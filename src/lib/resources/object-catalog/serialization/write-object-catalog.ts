import { BinaryEncoder } from "@s4tk/encoding";
import { ObjectCatalogDto, ObjectTooltipTag } from "../types";
import { ResourceKey } from "../../../packages/types";
import { Bytes } from '../../../enums/bytes';

export default function writeObjectCatalog(
    dto: ObjectCatalogDto,
) {
    const version = dto.version;
    const catalogVersion = dto.catalogVersion;

    const propertyBuffers: Buffer[] = [];

    const writeRaw = (t: string, v: any) => {
        const p = writeProp(t, v, version);
        propertyBuffers.push(p);
    }

    const write = (t: string, k: keyof ObjectCatalogDto["properties"]) => {
        writeRaw(t, dto.properties[k]);
    }

    write("uint32", "nameKey");
    write("uint32", "descriptionKey");
    write("uint32", "simoleonPrice");
    write("uint64", "thumbnailHash");
    write("uint32", "devCategoryFlags");
    write("styleKeySet", "styleKeySet");

    if(catalogVersion >= 10) {
        write("int16", "packId");
        write("uint8", "packFlags");
        write("reserved0", "reserved0");
    } else {
        write("byte", "unused3");
        if(dto.properties.unused3 && dto.properties.unused3 > 0) {
            write("byte", "unused4");
        }
    }

    if(catalogVersion >= 11) {
        write("tags32", "tags");
    } else {
        write("tags16", "tags");
    }

    write("objectTooltipTags", "objectTooltipTags");
    write("uint32", "gameplayLockedDescriptionKey");
    write("uint32", "gameplayUnlockedDescriptionKey");
    write("uint16", "swatchColorsSortPriority");
    write("uint64", "variantThumbnailImageHash");

    write("uint32", "auralMaterialsVersion");
    write("uint32", "auralMaterials1");
    write("uint32", "auralMaterials2");
    write("uint32", "auralMaterials3");
    write("uint32", "auralPropertiesVersion");
    write("uint32", "auralQuality");

    if(dto.properties.auralPropertiesVersion > 1) {
        write("uint32", "auralAmbientObject");
    }

    if(dto.properties.auralPropertiesVersion == 3) {
        write("uint64", "ambienceFileInstanceId");
        write("bool", "isOverrideAmbience");
    }

    if(dto.properties.auralPropertiesVersion > 3) {
        write("swatchColorSet", "secondaryAuralAmbientObjects");
    }

    write("byte", 'unused5'); // unknown byte

    write("uint32", "unused0");
    write("uint32", "unused1");
    write("uint32", "unused2");
    write("uint32", "placementFlagsHigh");
    write("uint32", "placementFlagsLow");
    write("uint64", "slotTypeSet");
    write("byte", "slotDecoSize");
    write("uint64", "catalogGroup");
    write("byte", "stateUsage");
    write("swatchColorSet", "swatchColorSet");
    write("uint32", "fenceHeight");
    write("bool", "isStackable");
    write("bool", "canItemDepreciate");

    if(version >= 25) {
        write("key", "fallbackObjectKey");
    }

    const headerEncoder = BinaryEncoder.alloc(Bytes.UINT32 * 2);
    headerEncoder.uint32(version);
    headerEncoder.uint32(catalogVersion);

    const buffer = Buffer.concat([
        headerEncoder.buffer,
        ...propertyBuffers,
    ]);

    return buffer;
}


function writeProp(
    key: string,
    value: any,
    version: number,
) {
    let encoder: BinaryEncoder;
    let length: number;
    // console.log('writing', key, value);

    switch(key) {
        case "key":
            encoder = BinaryEncoder.alloc(Bytes.UINT32 * 4);
            writeResourceKey(value, encoder);
            break;
        case "objectTooltipTags":
            length = (value as ObjectTooltipTag[]).length;
            encoder = BinaryEncoder.alloc(Bytes.UINT32 + ((Bytes.UINT32 + Bytes.UINT16) * length));
            encoder.uint32(length);
            value.forEach(v => {
                encoder.uint16(v.localizedString);
                encoder.uint32(v.value);
            });
            break;
        case "styleKeySet":
            length = (value as number[]).length;
            encoder = BinaryEncoder.alloc(Bytes.BYTE + (Bytes.UINT32 * 4 * length));
            encoder.byte(length);
            value.forEach(v => writeResourceKey(v, encoder));
            break;
        case "swatchColorSet":
            length = (value as number[]).length;
            encoder = BinaryEncoder.alloc(Bytes.BYTE + (Bytes.UINT32 * length));
            encoder.byte(length);
            value.forEach(v => encoder.uint32(v));
            break;
        case "reserved0":
            encoder = BinaryEncoder.alloc(9);
            encoder.bytes(Array(9).fill(0));
            break;
        case "tags16":
            length = (value as number[]).length;
            encoder = BinaryEncoder.alloc(Bytes.UINT32 + (Bytes.UINT16 * length));
            encoder.uint32(length);
            value.forEach(v => encoder.uint16(v));
            break;
        case "tags32":
            length = (value as number[]).length;
            encoder = BinaryEncoder.alloc(Bytes.UINT32 + (Bytes.UINT32 * length));
            encoder.uint32(length);
            value.forEach(v => encoder.uint32(v));
            break;
        case "bool":
            encoder = BinaryEncoder.alloc(Bytes.BYTE);
            encoder.boolean(value as boolean);
            break;
        case "byte":
            encoder = BinaryEncoder.alloc(Bytes.BYTE);
            encoder.byte(value as number);
            break;
        case "float":
            encoder = BinaryEncoder.alloc(Bytes.FLOAT);
            encoder.float(value as number);
            break;
        case "uint8":
            encoder = BinaryEncoder.alloc(Bytes.UINT8);
            encoder.uint8(value as number);
            break;
        case "int16":
            encoder = BinaryEncoder.alloc(Bytes.INT16);
            encoder.int16(value as number);
            break;
        case "uint16":
            encoder = BinaryEncoder.alloc(Bytes.UINT16);
            encoder.uint16(value as number);
            break;
        case "int32":
            encoder = BinaryEncoder.alloc(Bytes.INT32);
            encoder.int32(value as number);
            break;
        case "uint32":
            encoder = BinaryEncoder.alloc(Bytes.UINT32);
            encoder.uint32(value as number);
            break;
        case "uint64":
            encoder = BinaryEncoder.alloc(Bytes.UINT64);
            encoder.uint64(BigInt(value));
            break;
        default:
            throw new Error(`Object Catalog property "${key}" not recognized. This error should never be thrown, so if you're reading this, please report the error ASAP.`);
    }

    return encoder.buffer;
}


function writeResourceKey(key: ResourceKey, encoder: BinaryEncoder) {
    encoder.uint32(Number((key.instance ?? BigInt(0)) & 0xFFFFFFFFn));
    encoder.uint32(Number((key.instance ?? BigInt(0)) >> 32n));
    encoder.uint32(key.group ?? 0);
    encoder.uint32(key.type ?? 0);
    return encoder.buffer;
}
