import { BinaryDecoder } from "@s4tk/encoding";
import { makeList } from "../../../helpers";
import { SimDataType, SimDataTypeUtils } from "../../simData/simDataTypes";
import { BinaryTuningDto, Named, Row, Schema, SchemaColumn, StringTable, TableData, TableInfo } from "../shared";

/**
 * TODO:
 * 
 * @param buffer TODO:
 * @returns TODO:
 */
export default function readData(buffer: Buffer): BinaryTuningDto {
  const decoder = new BinaryDecoder(buffer);

  // Zero can be a valid offset, so use 0x8000000 to represent
  // a NULL relative offset.
  const RELOFFSET_NULL = (-0x7FFFFFFF) - 1;

  // Iteration variables
  let i: number, j: number, k: number;

  // Seek to the next byte with alignment given by alignmentMask
  function seekToAlignment(alignmentMask: number) {
    const nCurPos = decoder.tell();
    const nPadAmount = -nCurPos & alignmentMask;
    decoder.seek(nCurPos + nPadAmount);
  }

  function readString(offset: number) {
    return decoder.savePos(() => {
      decoder.seek(offset);
      return decoder.string()
    });
  }

  // Information about each data table.
  function structTableInfo(): TableInfo {
    return {
      startof_mnNameOffset: decoder.tell(),
      mnNameOffset: decoder.int32(),
      mnNameHash: decoder.uint32(),
      startof_mnSchemaOffset: decoder.tell(),
      mnSchemaOffset: decoder.int32(),
      mnDataType: decoder.uint32(),
      mnRowSize: decoder.uint32(),
      mnRowOffset: decoder.int32(),
      mnRowCount: decoder.uint32()
    }
  }

  // Information about each column in a schema.
  function structSchemaColumn(): SchemaColumn {
    return {
      startof_mnNameOffset: decoder.tell(),
      mnNameOffset: decoder.int32(),
      mnNameHash: decoder.uint32(),
      mnDataType: decoder.uint16(),
      mnFlags: decoder.uint16(),
      mnOffset: decoder.uint32(),
      mnSchemaOffset: decoder.int32() 
    }
  }

  // Information about each schema.
  let schemaEndPos: number; // int64
  let lastColumnEndPos: number; // int64
  function structSchema(): Schema {
    const schema: Schema = {
      startof_mnNameOffset: decoder.tell(),
      mnNameOffset: decoder.int32(),
      mnNameHash: decoder.uint32(),
      mnSchemaHash: decoder.uint32(),
      mnSchemaSize: decoder.uint32(),
      startof_mnColumnOffset: decoder.tell(),
      mnColumnOffset: decoder.int32(),
      mnNumColumns: decoder.uint32(),
      mColumn: []
    };

    // Load the schema columns inside the schema.
    schemaEndPos = decoder.tell();

    decoder.seek(schema.startof_mnColumnOffset + schema.mnColumnOffset);
    for (j = 0; j < schema.mnNumColumns; ++j) { // FIXME: mSchema[i]?
      schema.mColumn.push(structSchemaColumn());
    }

    // Remember the end of the final column.
    lastColumnEndPos = decoder.tell();
    decoder.seek(schemaEndPos);

    return schema;
  }

  function readNamed(named: Named): string {
    if (named.mnNameOffset === RELOFFSET_NULL) return "Unnamed";
    return readString(named.startof_mnNameOffset + named.mnNameOffset);
  }

  function structVector2() {
    return {
      x: decoder.float(),
      y: decoder.float()
    }
  }

  function structVector3() {
    return {
      x: decoder.float(),
      y: decoder.float(),
      z: decoder.float()
    }
  }

  function structVector4() {
    return {
      x: decoder.float(),
      y: decoder.float(),
      z: decoder.float(),
      w: decoder.float()
    }
  }

  function structString() {
    return {
      mDataOffset: decoder.uint32()
    }
  }

  function structHashedString() {
    return {
      mDataOffset: decoder.uint32(),
      mHash: decoder.uint32()
    }
  }

  function structLocKey() {
    return {
      mKey: decoder.uint32()
    }
  }

  function structResourceKey() {
    return {
      mInstance: decoder.uint64(),
      mType: decoder.uint32 (),
      mGroup: decoder.uint32()
    }
  }

  function structObjectRef() {
    return {
      mDataOffset: decoder.uint32()
    }
  }

  function structTableSetRef() {
    return {
      mValue: decoder.uint64()
    }
  }

  function structVector() {
    return {
      mDataOffset: decoder.uint32(),
      mCount: decoder.uint32()
    }
  }

  function structVariant() {
    return {
      mDataOffset: decoder.int32(),
      mTypeHash: decoder.uint32()
    }
  }


  // Read a single data field with the given type code.
  function readDataType(typeCode: SimDataType): any {
    switch (typeCode) {
      case SimDataType.Boolean:           return decoder.uint8();
      case SimDataType.UInt8:             return decoder.uint8();
      case SimDataType.Character:         return decoder.charsUtf8(1);
      case SimDataType.Int8:              return decoder.uint8();
      case SimDataType.Int16:             return decoder.int16();
      case SimDataType.UInt16:            return decoder.uint16();
      case SimDataType.Int32:             return decoder.int32();
      case SimDataType.UInt32:            return decoder.uint32();
      case SimDataType.Int64:             return decoder.int64();
      case SimDataType.UInt64:            return decoder.uint64();
      case SimDataType.Float:             return decoder.float();
      case SimDataType.String:            return structString();
      case SimDataType.HashedString:      return structHashedString();
      case SimDataType.Object:            return structObjectRef();
      case SimDataType.Vector:            return structVector();
      case SimDataType.Float2:            return structVector2();
      case SimDataType.Float3:            return structVector3();
      case SimDataType.Float4:            return structVector4();
      case SimDataType.TableSetReference: return structTableSetRef();
      case SimDataType.ResourceKey:       return structResourceKey();
      case SimDataType.LocalizationKey:   return structLocKey();
      case SimDataType.Variant:           return structVariant();
      case SimDataType.Undefined:
        throw new Error(`Unknown type code ${typeCode}`);
    }
  }

  // Header
  // There are a few unused or deprecated fields in the header. Most of these
  // should be set to 0 unless marked otherwise.
  const mnFileIdentifier = decoder.charsUtf8(4);

  if (mnFileIdentifier != "DATA") {
    throw new Error(`Not a simdata file!`);
  }

  // Base game version is 0x101
  const mnVersion = decoder.uint32();
  if(mnVersion < 0x100 || mnVersion > 0x101) {
    // Base Game shipped with version 0x100
    throw new Error(`Unknown version`);
  }


  // Offset of table header data
  const nTableHeaderPos = decoder.tell();
  const mnTableHeaderOffset = decoder.int32();

  // Number of table headers
  const mnNumTables = decoder.int32();

  // Offset of schema data
  const nSchemaPos = decoder.tell();
  const mnSchemaOffset = decoder.int32();

  // Number of schemas
  const mnNumSchemas = decoder.int32();

  // Not used, set to 0xFFFFFFFF
  const mUnused = mnVersion >= 0x101 ? decoder.uint32() : undefined;

  // Skip to the beginning of the table header block
  decoder.seek(nTableHeaderPos + mnTableHeaderOffset);

  // Load the tables
  const mTable = makeList(mnNumTables, structTableInfo);

  // We need to read schemas before we can load data, so
  // just remember the position at which row data starts.
  const rowDataPos = decoder.tell();

  // Read schemas.  Because schemas are variable-sized,
  // and reading them is complex, we cannot use the
  // array syntax (even with <optimize=false>).
  decoder.seek(nSchemaPos + mnSchemaOffset);
  let mSchema: Schema[] = [];
  for (i = 0; i < mnNumSchemas; ++i) {
    mSchema.push(structSchema());
  }

  // Get the schema with the given offset
  function getSchemaIndex(offset: number): number {
    for (let i = 0; i < mnNumSchemas; ++i) {
      if (offset === mSchema[i].startof_mnNameOffset) {
        return i;
      }
    }

    throw new Error(`Unknown schema offset ${offset}`);
  }

  // Now, jump past the columns that were read above.
  decoder.seek(lastColumnEndPos);

  // Read the string table, which consists of NULL separated
  // UTF-8 encoded strings, and comprises the rest of the file.
  function structStringTable(): StringTable {
    const mStringEntry: string[] = [];
    while (!decoder.isEOF()) {
      mStringEntry.push(decoder.string());
    }
    return { mStringEntry };
  }
  const mStringTable = structStringTable();

  // Now, we can jump back and read data.  Note that the start of the
  // row data must be aligned (mask == 15).
  decoder.seek(rowDataPos);

  let schemaIndex: number;
  let alignment: number, columnAlignment: number;
  let rowStart: number;
  let schemaColumnName: string;
  const mTableData: TableData[] = [];
  for (i = 0; i < mnNumTables; ++i) {
    seekToAlignment(15);
    seekToAlignment(mTable[i].mnRowSize - 1);

    const tableData: TableData = {};
    if (mTable[i].mnSchemaOffset === RELOFFSET_NULL) {
      tableData.mValue = [];
    } else {
      tableData.mRow = [];
    }

    function structTableData(): TableData {
      alignment = 1;
      for (j = 0; j < mTable[i].mnRowCount; ++j) {
        // Some tables have no schema; these support only one
        // data type.
        if (mTable[i].mnSchemaOffset === RELOFFSET_NULL) {
          tableData.mValue.push(readDataType(mTable[i].mnDataType));
          alignment = SimDataTypeUtils.getAlignment(mTable[i].mnDataType);
        } else {
          schemaIndex = getSchemaIndex(mTable[i].startof_mnSchemaOffset + mTable[i].mnSchemaOffset);
          function structRow(): Row {
            // Read each column.  The order of column data does not match the column
            // order (columns are sorted by name hash).
            const mValue: any[] = [];
            for (k = 0; k < mSchema[schemaIndex].mnNumColumns; ++k) {
              schemaColumnName = readNamed(mSchema[schemaIndex].mColumn[k]);
              decoder.seek(rowStart + mSchema[schemaIndex].mColumn[k].mnOffset);
              mValue.push(readDataType(mSchema[schemaIndex].mColumn[k].mnDataType));
              columnAlignment = SimDataTypeUtils.getAlignment(mTable[i].mnDataType);
              if (columnAlignment > alignment)
                alignment = columnAlignment;
            }
            return { mValue };
          }

          // Reading the rows will modify the file position.  We need to save the current row start
          // and then manually increment the position after loading the column data.
          rowStart = decoder.tell();
          tableData.mRow.push(structRow());
          decoder.seek(rowStart + mSchema[schemaIndex].mnSchemaSize);
        }
        seekToAlignment(alignment - 1);
      }
      return tableData;
    }
    mTableData.push(structTableData());
    seekToAlignment(15);
  }

  return {
    mnVersion,
    mUnused,
    mSchema,
    mTable,
    mTableData,
    mStringTable,
  }
}
