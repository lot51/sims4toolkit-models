import clone from "just-clone";
import compare from "just-compare";
import { CompressedBuffer, CompressionType } from "@s4tk/compression";
import WritableModel, { WritableModelCreationOptions, WritableModelFromOptions }  from "../../base/writable-model";
import EncodingType from "../../enums/encoding-type";
import { promisify } from '../../common/helpers';
import Resource from "../../resources/resource";
import { ObjectCatalogDto, ObjectCatalogProperties } from "./types";
import writeObjectCatalog from "./serialization/write-object-catalog";
import readObjectCatalog from "./serialization/read-object-catalog";


export interface ObjectCatalogCreationOptions extends
  WritableModelCreationOptions,
  Partial<ObjectCatalogDto> { };



/**
 * Model for cas part resoures
 */
export default class ObjectCatalogResource
    extends WritableModel implements Resource, ObjectCatalogDto {

    static readonly LATEST_VERSION = 26;
    static readonly LATEST_CATALOG_VERSION = 11;
    // @ts-ignore
    readonly encodingType: EncodingType = EncodingType.OBJC;

    /** The version. This should be equal to LATEST_VERSION. */
    version: number;

    /** The catalog version. This should be equal to LATEST_CATALOG_VERSION. */
    catalogVersion: number;

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
    properties: ObjectCatalogProperties;

    //#region Initialization

    /**
     * Creates a new ObjectCatalogResource from the given data.
     *
     * @param options Object containing arguments
     */
    constructor(
        options?: ObjectCatalogCreationOptions
    ) {
        super(options);
        this.version = options?.version ?? ObjectCatalogResource.LATEST_VERSION;
        this.catalogVersion = options?.catalogVersion ?? ObjectCatalogResource.LATEST_CATALOG_VERSION;
        this.properties = options?.properties ?? {};
        this._watchProps("version", "properties");
    }

    /**
     * Creates a new ObjectCatalogResource from the given buffer. The buffer is
     * assumed to be uncompressed; passing in a compressed buffer can lead to
     * unexpected behavior.
     *
     * @param buffer The decompressed buffer for this ObjectCatalogResource
     * @param options Object containing optional arguments
     */
    static from(
        buffer: Buffer,
        options?: WritableModelFromOptions
    ): ObjectCatalogResource {
        const dto = readObjectCatalog(buffer, options);
        let initialBufferCache: CompressedBuffer|undefined;

        if (options?.saveBuffer) initialBufferCache = options?.initialBufferCache ?? {
            buffer,
            compressionType: CompressionType.Uncompressed,
            sizeDecompressed: buffer.byteLength
        };

        return new ObjectCatalogResource({
            version: dto.version,
            catalogVersion: dto.catalogVersion,
            properties: dto.properties,
            defaultCompressionType: options?.defaultCompressionType,
            owner: options?.owner,
            initialBufferCache
        });
    }

  /**
   * Asynchronously creates a new ObjectCatalogResource from the given
   * buffer. The buffer is assumed to be uncompressed; passing in a compressed
   * buffer can lead to unexpected behavior.
   *
   * @param buffer The decompressed buffer for this ObjectCatalogResource
   * @param options Object containing optional arguments
   */
    static async fromAsync(
        buffer: Buffer,
        options?: WritableModelFromOptions
    ): Promise<ObjectCatalogResource> {
        return promisify(() => ObjectCatalogResource.from(buffer, options));
    }


    //#endregion Initialization

    //#region Overridden Methods

    clone(): ObjectCatalogResource {
        return new ObjectCatalogResource({
            version: this.version,
            catalogVersion: this.catalogVersion,
            properties: clone(this.properties),
            defaultCompressionType: this.defaultCompressionType,
            initialBufferCache: this._bufferCache
        });
    }

    equals(other: any): boolean {
        if (other?.encodingType !== this.encodingType) return false;
        if (other?.version !== this.version) return false;
        if (other?.catalogVersion !== this.catalogVersion) return false;
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
    updateProperties(fn: (props: ObjectCatalogProperties) => void) {
        fn(this.properties);
        this.onChange();
    }

    //#endregion Public Methods

    //#region Protected Methods

    protected _serialize(): Buffer {
        return writeObjectCatalog(this);
    }

    //#endregion Protected Methods
}
