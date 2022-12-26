import { BinaryDecoder } from "@s4tk/encoding";
import { makeList } from "../../../common/helpers";
import { BinaryFileReadingOptions } from "../../../common/options";
import { ObjectCatalogDto, ObjectCatalogProperties } from "../types";

export const readResourceKey = (decoder: BinaryDecoder) => {
    const instanceP1 = decoder.uint32();
    const instanceP2 = decoder.uint32();
    const instance = (BigInt(instanceP2) << 32n) + BigInt(instanceP1);
    const group = decoder.uint32();
    const type = decoder.uint32();
    return { type, group, instance };
}

export const readResourceKeyArray = (decoder: BinaryDecoder) => {
    return makeList(decoder.byte(), () => readResourceKey(decoder));
}

/**
 * Reads a buffer as an object catalog resource and returns a DTO.
 *
 * @param buffer Buffer to read as an object catalog resource
 * @param options Options for reading this definition
 */
export default function readObjectCatalog(
    buffer: Buffer,
    options?: BinaryFileReadingOptions
): ObjectCatalogDto {
    const decoder = new BinaryDecoder(buffer);

    const version = decoder.uint32();
    if(version > 26) {
        throw new Error("Unsupported catalog version detected: " + version);
    }

    const properties: ObjectCatalogProperties = {};

    const catalogVersion = decoder.uint32();

    if(catalogVersion > 11) {
        throw new Error("Unsupported catalog product version detected: " + version);
    }

    properties.nameKey = decoder.uint32();
    properties.descriptionKey = decoder.uint32();
    properties.simoleonPrice = decoder.uint32();
    properties.thumbnailHash = decoder.uint64();
    properties.devCategoryFlags = decoder.uint32();
    properties.styleKeySet = readResourceKeyArray(decoder);

    if(catalogVersion >= 10) {
        properties.packId = decoder.int16();
        properties.packFlags = decoder.uint8();
        properties.reserved0 = decoder.bytes(9); // always 0
    } else {
        properties.packId = 0;
        properties.unused3 = decoder.byte();
        if(properties.unused3 > 0) {
            properties.unused4 = decoder.byte();
        }
    }

    if(catalogVersion >= 11) {
        properties.tags = makeList(decoder.uint32(), () => {
            return decoder.uint32();
        });
    } else {
        properties.tags = makeList(decoder.uint32(), () => {
            return decoder.uint16();
        });
    }

    properties.objectTooltipTags = makeList(decoder.uint32(), () => {
        return {
            localizedString: decoder.uint16(),
            value: decoder.uint32(),
        }
    });

    properties.gameplayLockedDescriptionKey = decoder.uint32();
    properties.gameplayUnlockedDescriptionKey = decoder.uint32();
    properties.swatchColorsSortPriority = decoder.uint16();
    properties.variantThumbnailImageHash = decoder.uint64();



    properties.auralMaterialsVersion = decoder.uint32();
    if(properties.auralMaterialsVersion > 1) {
        throw new Error("Unknown aural materials version")
    }
    properties.auralMaterials1 = decoder.uint32();
    properties.auralMaterials2 = decoder.uint32();
    properties.auralMaterials3 = decoder.uint32();

    properties.auralPropertiesVersion = decoder.uint32();
    if(properties.auralPropertiesVersion > 5) {
        throw new Error("Unknown aural properties version")
    }

    properties.auralQuality = decoder.uint32();
    if(properties.auralPropertiesVersion > 1) {
        properties.auralAmbientObject = decoder.uint32();
    }

    if(properties.auralPropertiesVersion == 3) {
        properties.ambienceFileInstanceId = decoder.uint64();
        properties.isOverrideAmbience = decoder.byte();
    }

    if(properties.auralPropertiesVersion > 3) {
        properties.secondaryAuralAmbientObjects = makeList(decoder.byte(), () => {
            return decoder.uint32();
        })
    }

    properties.unused5 = decoder.byte(); // unknown byte

    properties.unused0 = decoder.uint32();
    properties.unused1 = decoder.uint32();
    properties.unused2 = decoder.uint32();

    properties.placementFlagsHigh = decoder.uint32();
    properties.placementFlagsLow = decoder.uint32();
    properties.slotTypeSet = decoder.uint64();
    properties.slotDecoSize = decoder.byte();
    properties.catalogGroup = decoder.uint64();
    properties.stateUsage = decoder.byte();
    properties.swatchColorSet = makeList(decoder.byte(), () => decoder.uint32());
    properties.fenceHeight = decoder.uint32();
    properties.isStackable = decoder.boolean();
    properties.canItemDepreciate = decoder.boolean();

    if(version >= 25) {
        properties.fallbackObjectKey = readResourceKey(decoder);
    }

    return { version, catalogVersion, properties }
}
