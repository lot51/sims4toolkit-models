import { XMLParser } from "fast-xml-parser";
import type StringTable from "./resources/stringtable";
import { XML_DECLARATION } from "../utils/constants";
import { formatStringKey } from "../utils/formatting";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  commentPropName: "#comment",
  preserveOrder: true,
  textNodeName: "#value"
});

//#region Types & Classes

type Tag = 'I' | 'M' | 'T' | 'E' | 'V' | 'U' | 'L' | 'C';
type AttributeKey = 'n' | 'c' | 't' | 'm' | 'i' | 'ev' | 'p' | 's';
type TunableAttributes = { [key in AttributeKey]?: any; }

/**
 * Base class for all tunable nodes.
 */
export abstract class TunableNode {
  abstract readonly tag: Tag;
  readonly attributes: TunableAttributes;
  readonly value?: any;
  readonly children?: TunableNode[];
  readonly comment?: string;

  constructor({ attributes = {}, value, children, comment }: {
    attributes?: TunableAttributes;
    value?: any;
    children?: TunableNode[];
    comment?: string;
  }) {
    this.attributes = attributes;
    this.value = value;
    this.children = children;
    this.comment = comment;
  }

  /**
   * TODO:
   * 
   * @param xml TODO:
   */
  static fromXml(xml: string): TunableNode {
    // TODO:
    return undefined;
  }

  /**
   * Finds the first child of this node that has the given tag and attributes.
   * Neither argument is required - if one is left out, the first child matching
   * the other will be returned. If neither argument is supplied, the first 
   * child will be returned. If no children match the arguments or this node
   * does not have any children, `undefined` is returned.
   * 
   * Arguments
   * - `tag`: The tag that the child must have
   * - `attrs`: The attribute values that the child must have
   * 
   * @param args Object containing arguments
   */
  getChild({ tag, attributes }: { tag?: Tag; attributes?: TunableAttributes; } = {}): TunableNode {
    return this.children?.find(child => {
      if (tag && (child.tag !== tag)) return false;
      if (!attributes) return true;
      for (const key in attributes) 
        if (child.attributes[key] !== attributes[key]) return false;
      return true;
    });
  }

  /**
   * Returns an XML string representation of this node and all of its children
   * following the given options.
   * 
   * Options
   * - `indents`: Number of times to indent this node. This will increase by 1
   * for each recursive call. (Default = 0)
   * - `spacesPerIndent`: Number of spaces to use per indent. (Default = 2)
   * - `includeDeclaration`: Whether an XML declaration should be added to the
   * beginning of this node. This property will not be passed down to children,
   * they will always be false. (Default = false)
   * - `alphabetize`: Whether the nodes and their attributes should be written
   * in alphanumeric order. If set to true, nodes will be organized according to
   * the value of their name attribute. (Default = false)
   * 
   * @param options Object containing options
   */
  toXml({ indents = 0, spacesPerIndent = 2, includeDeclaration = false, alphabetize = false }: {
    indents?: number;
    spacesPerIndent?: number;
    includeDeclaration?: boolean;
    alphabetize?: boolean;
  } = {}): string {
    const spaces = " ".repeat(indents * spacesPerIndent);
    const lines: string[] = [];

    // declaration
    if (includeDeclaration) lines.push(`${spaces}${XML_DECLARATION}`);

    // attributes
    const attrKeys = Object.keys(this.attributes);
    const attrNodes: string[] = [];
    if (attrKeys.length > 0) {
      attrNodes.push(''); // just for spacing
      if (alphabetize) attrKeys.sort();
      attrKeys.forEach(key => {
        const value = formatValue(this.attributes[key]);
        attrNodes.push(`${key}="${value}"`);
      });
    }

    // writing self & children/value
    const attrString = attrNodes.join(' ');
    const comment = this.comment === undefined ? '' : `<!--${this.comment}-->`;
    if (this.children?.length > 0) {
      // node has children
      const children = alphabetize ? [...this.children].sort((a, b) => {
        const aName = a.attributes.n;
        const bName = b.attributes.n;
        if (!(aName && bName)) return 0;
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      }) : this.children;

      lines.push(`${spaces}<${this.tag}${attrString}>`);

      if (comment) {
        const extraSpaces = " ".repeat(spacesPerIndent);
        lines.push(`${spaces}${extraSpaces}${comment}`);
      }

      children.forEach(child => {
        lines.push(child.toXml({
          indents: indents + 1,
          spacesPerIndent,
          alphabetize
        }));
      });

      lines.push(`${spaces}</${this.tag}>`);
    } else if (this.value !== undefined) {
      // node has value
      const value = `${formatValue(this.value)}${comment}`;
      lines.push(`${spaces}<${this.tag}${attrString}>${value}</${this.tag}>`);
    } else {
      // node is empty
      lines.push(`${spaces}<${this.tag}${attrString}/>${comment}`);
    }

    return lines.join('\n');
  }
}

abstract class ValueTunable extends TunableNode {
  constructor({ attributes, value, comment }: {
    attributes?: TunableAttributes;
    value?: any;
    comment?: string;
  }) {
    super({ attributes, value, comment });
  }
}

abstract class ParentTunable extends TunableNode {
  constructor({ attributes, children, comment }: {
    attributes?: TunableAttributes;
    children?: TunableNode[];
    comment?: string;
  }) {
    super({ attributes, children, comment });
  }
}

/** Root node for instance tuning (I tag). */
export class InstanceTuning extends ParentTunable { readonly tag = 'I'; }

/** Root node for module tuning (M tag). */
export class ModuleTuning   extends ParentTunable { readonly tag = 'M'; }

/** Node for primitive values (T tag). */
export class Tunable        extends ValueTunable  { readonly tag = 'T'; }

/** Node for enum values (E tag). */
export class TunableEnum    extends ValueTunable  { readonly tag = 'E'; }

/** Node for variants (V tag). */
export class TunableVariant extends ParentTunable { readonly tag = 'V'; }

/** Node for tuples (U tag). */
export class TunableTuple   extends ParentTunable { readonly tag = 'U'; }

/** Node for lists (L tag). */
export class TunableList    extends ParentTunable { readonly tag = 'L'; }

/** Node for classes (C tag). */
export class TunableClass   extends ParentTunable { readonly tag = 'C'; }

//#endregion Types & Classes

//#region Functions

/**
 * Creates and returns an InstanceTuning (I tag).
 * 
 * Arguments
 * - `c`: Value to appear in the class attribute
 * - `i`: Value to appear in the instance type attribute
 * - `m`: Value to appear in the module path attribute
 * - `n`: Value to appear in the filename attribute
 * - `s`: Value to appear in the tuning ID attribute
 * - `children`: List of nodes that this one contains
 * - `comment`: Comment to add to this instance
 * 
 * @param args Object containing the arguments
 */
export function I({ c, i, m, n, s, children, comment }: {
  c: string;
  i: string;
  m: string;
  n: string;
  s: string | number | bigint;
  children?: TunableNode[];
  comment?: string;
}): InstanceTuning {
  return new InstanceTuning({
    attributes: { c, i, m, n, s: formatValue(s) },
    children,
    comment
  });
}

/**
 * Creates and returns a ModuleTuning (M tag).
 * 
 * Arguments
 * - `n`: Value to appear in the filename attribute
 * - `s`: Value to appear in the tuning ID attribute
 * - `children`: List of nodes that this one contains
 * 
 * @param args Object containing the arguments
 */
export function M({ n, s, children, comment }: {
  n: string;
  s: string | number | bigint;
  children?: TunableNode[];
  comment?: string;
}): ModuleTuning {
  return new ModuleTuning({
    attributes: { n, s: formatValue(s) },
    children,
    comment
  });
}

/**
 * Creates and returns a Tunable (T tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `ev`: The enum value of this node (only for use within `C` nodes)
 * - `value`: The single value that this node contains
 * - `comment`: A comment to write after the value
 * 
 * @param args Object containing the arguments
 */
export function T({ name, ev, value, comment }: {
  name?: string;
  ev?: string | number | bigint;
  value?: any;
  comment?: string;
}): Tunable {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  if (ev !== undefined) attributes.ev = formatValue(ev);
  return new Tunable({ attributes, value, comment });
}

/**
 * Creates and returns a TunableEnum (E tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `value`: The single value that this node contains
 * - `comment`: A comment to write after the value
 * 
 * @param args Object containing the arguments
 */
export function E({ name, value, comment }: {
  name?: string;
  value?: string;
  comment?: string;
}): TunableEnum {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableEnum({ attributes, value, comment });
}

/**
 * Creates and returns a TunableList (L tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * - `comment`: A comment to write before the first child
 * 
 * @param args Object containing the arguments
 */
export function L({ name, children, comment }: {
  name?: string;
  children?: TunableNode[];
  comment?: string;
}): TunableList {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableList({ attributes, children, comment });
}

/**
 * Creates and returns a TunableTuple (U tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * - `comment`: A comment to write before the first child
 * 
 * @param args Object containing the arguments
 */
export function U({ name, children, comment }: {
  name?: string;
  children?: TunableNode[];
  comment?: string;
}): TunableTuple {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableTuple({ attributes, children, comment });
}

/**
 * Creates and returns a TunableVariant (V tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `type`: Value to appear in the type attribute
 * - `child`: The node that this one contains
 * - `comment`: A comment to write before the child
 * 
 * @param args Object containing the arguments
 */
export function V({ name, type, child, comment }: {
  name?: string;
  type: string;
  child?: TunableNode;
  comment?: string;
}): TunableVariant {
  const children: TunableNode[] = child ? [child] : undefined;
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  if (type !== undefined) attributes.t = type;
  return new TunableVariant({ attributes, children, comment });
}

/**
 * Creates and returns a TunableClass (C tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * - `comment`: A comment to write before the first child
 * 
 * @param args Object containing the arguments
 */
export function C({ name, children, comment }: {
  name: string;
  children?: TunableNode[];
  comment?: string;
}): TunableClass {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableClass({ attributes, children, comment });
}

/**
 * Creates and returns a Tunable for a new string. It will put the string in the
 * given string table, and return a node that contains its hash as a value and
 * its string as a comment. If `textToHash` is supplied, it will be hashed. If
 * not, then the string itself will be hashed.
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `string`: The string to add to the table
 * - `textToHash`: Text to hash instead of hashing the string itself
 * - `stbl`: The string table to add this string to
 * 
 * @param args Object containing the arguments
 */
export function S({ name, string, textToHash, stbl }: {
  name?: string;
  string: string;
  textToHash?: string;
  stbl: StringTable;
}): Tunable {
  const toHash = textToHash || string;
  const id = stbl.addStringAndHash(toHash);
  return T({
    name,
    value: formatStringKey(stbl.getEntryById(id).key),
    comment: string
  });
}

/**
 * Returns a version of `S` that already has a string table baked into it, so
 * that you do not need to pass it every time. Example usage is:
 * 
 * ```ts
 * const stbl = StringTableResource.create();
 * const S = getStringNodeFunction(stbl);
 * const tunable = S({ string: "This is the string!" });
 * ```
 *  
 * @param stbl String table to use 
 */
export function getStringNodeFunction(stbl: StringTable): ({ name, textToHash, string }: {
  name?: string;
  textToHash?: string;
  string: string;
}) => Tunable {
  return ({ name, textToHash, string }: { name?: string; textToHash?: string; string: string }) => {
    return S({ name, string, textToHash, stbl });
  };
}

//#endregion Functions

//#region Helpers

/**
 * Formats the given value so it can appear in tuning XML.
 * 
 * @param value Value to format
 */
function formatValue(value: any): string {
  const type = typeof value;
  switch (type) {
    case 'boolean':
      return value ? 'True' : 'False';
    case 'number':
    case 'bigint':
      return value.toString();
    default:
      return value;
  }
}

//#endregion Helpers