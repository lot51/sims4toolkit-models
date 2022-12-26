import clone from "just-clone";
import compare from "just-compare";
import { CompressedBuffer, CompressionType } from "@s4tk/compression";
import WritableModel, { WritableModelCreationOptions, WritableModelFromOptions }  from "../../../lib/base/writable-model";
import EncodingType from "../../../lib/enums/encoding-type";
import { promisify } from '../../../lib/common/helpers';
import Resource from "../../../lib/resources/resource";
import { CasPartDto, CasPartProperties } from "./types";
import writeCasPart from "./serialization/write-caspart";
import readCasPart from "./serialization/read-caspart";


export interface CasPartCreationOptions extends
  WritableModelCreationOptions,
  Partial<CasPartDto> { };



/**
 * Model for cas part resoures
 */
export default class CasPartResource
    extends WritableModel implements Resource, CasPartDto {

    static readonly LATEST_VERSION = 46;

    readonly encodingType: EncodingType = EncodingType.CASP;

    /** The version. This should be equal to LATEST_VERSION. */
    version: number;

    /**
     * An object of properties. Note that mutating this object or individual
     * properties on it will not uncache this model or its owner. To handle
     * cacheing, there are multiple options:
     *
     * ```ts
     * // using setProperty()
     * def.setProperty(ObjectDefinitionType.IsBaby, true);
     *
     * // using updateProperties()
     * def.updateProperties(props => {
     *   props.isBaby = true;
     * });
     *
     * // using onChange()
     * def.properties.isBaby = true;
     * def.onChange();
     *
     * // using reassignment
     * def.properties.isBaby = true;
     * def.properties = def.properties;
     * ```
     */
    properties: CasPartProperties;

    //#region Initialization

    /**
     * Creates a new CasPartResource from the given data.
     *
     * @param options Object containing arguments
     */
    constructor(
        options?: CasPartCreationOptions
    ) {
        super(options);
        this.version = options?.version ?? CasPartResource.LATEST_VERSION;
        this.properties = options?.properties ?? {};
        this._watchProps("version", "properties");
    }

    /**
     * Creates a new CasPartResource from the given buffer. The buffer is
     * assumed to be uncompressed; passing in a compressed buffer can lead to
     * unexpected behavior.
     *
     * @param buffer The decompressed buffer for this CasPartResource
     * @param options Object containing optional arguments
     */
    static from(
        buffer: Buffer,
        options?: WritableModelFromOptions
    ): CasPartResource {
        const dto = readCasPart(buffer, options);
        let initialBufferCache: CompressedBuffer|undefined;

        if (options?.saveBuffer) initialBufferCache = options?.initialBufferCache ?? {
            buffer,
            compressionType: CompressionType.Uncompressed,
            sizeDecompressed: buffer.byteLength
        };

        return new CasPartResource({
            version: dto.version,
            properties: dto.properties,
            defaultCompressionType: options?.defaultCompressionType,
            owner: options?.owner,
            initialBufferCache
        });
    }

  /**
   * Asynchronously creates a new CasPartResource from the given
   * buffer. The buffer is assumed to be uncompressed; passing in a compressed
   * buffer can lead to unexpected behavior.
   *
   * @param buffer The decompressed buffer for this CasPartResource
   * @param options Object containing optional arguments
   */
    static async fromAsync(
        buffer: Buffer,
        options?: WritableModelFromOptions
    ): Promise<CasPartResource> {
        return promisify(() => CasPartResource.from(buffer, options));
    }


    //#endregion Initialization

    //#region Overridden Methods

    clone(): CasPartResource {
        return new CasPartResource({
            version: this.version,
            properties: clone(this.properties),
            defaultCompressionType: this.defaultCompressionType,
            initialBufferCache: this._bufferCache
        });
    }

    equals(other: any): boolean {
        if (other?.encodingType !== this.encodingType) return false;
        if (other?.version !== this.version) return false;
        return compare(this.properties, other.properties);
    }

    isXml() {
        return false;
    }

    //#endregion Overridden Methods

    //#region Public Methods

    /**
     * Dynamically gets a value from the properties object. This is here for
     * convenience, but it is recommended to access properties directly since it
     * will be more type-safe.
     *
     * @param type Type of property to get value for
     */
    getProperty(type: string): unknown {
        return this.properties[type];
    }

    /**
     * Dynamically sets a value in the properties object. This is here for
     * convenience, but it is recommended to set properties with
     * `updateProperties()` since it will be more type-safe.
     *
     * @param type Type of property to set value of
     * @param value Value to set
     */
    setProperty(type: string, value: any) {
        this.properties[type] = value;
        this.onChange();
    }

    /**
     * Provides a context in which properties can be updated in a way that is
     * safe for cacheing. The provided function will be executed, and when it is
     * done, the model and its owner will be uncached.
     *
     * @param fn Function to perform property updates in
     */
    updateProperties(fn: (props: CasPartProperties) => void) {
        fn(this.properties);
        this.onChange();
    }

    //#endregion Public Methods

    //#region Protected Methods

    protected _serialize(): Buffer {
        return writeCasPart(this);
    }

    //#endregion Protected Methods
}
