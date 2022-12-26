import { BinaryDecoder } from "@s4tk/encoding";
import { makeList } from "../../../common/helpers";
import { BinaryFileReadingOptions } from "../../../common/options";
import { ResourceKey } from "../../../packages/types";
import { CasPartDto, CasPartProperties, ParamType, PartPreset, PresetParam } from "../types";

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

// Returns a UTF-16BE string
export const readManagedString = (decoder: BinaryDecoder) => {
    let size, sizeHigh;
    const sizeLow = decoder.uint8();
    size = sizeLow;

    if(sizeLow > 127) {
        sizeHigh = decoder.uint8();
        size = (sizeHigh << 7) | (sizeLow & 0x7f)
    }

    return decoder.slice(size).swap16().toString('utf16le');
}

/**
 * Reads a buffer as a CAS Part resource and returns a DTO.
 *
 * @param buffer Buffer to read as a cas part resource
 * @param options Options for reading this definition
 */
export default function readCasPart(
    buffer: Buffer,
    options?: BinaryFileReadingOptions
): CasPartDto {
    const decoder = new BinaryDecoder(buffer);

    const version = decoder.uint32();
    if(version < 26 || version > 46) {
        throw new Error("Unsupported version detected: " + version);
    }

    const dataSize = decoder.uint32();
    let keyTable: ResourceKey[] = [];

    decoder.savePos(() => {
        decoder.skip(dataSize);
        keyTable = readResourceKeyArray(decoder);
    })

    const readIndexedKey = (decoder) => {
        const i = decoder.byte();
        const key = keyTable[i];
        return key;
    }

    const properties: CasPartProperties = {};

    const presetCount = decoder.uint32();
    properties.presets = makeList(presetCount, () => {
        const preset: PartPreset = {
            complateId: decoder.uint64(),
            params: makeList(decoder.byte(), () => {
                const param: PresetParam = {
                    paramNameId: decoder.uint32(),
                    paramType: decoder.byte() as ParamType,
                    value: 0,
                }

                switch(param.paramType) {
                    case ParamType.UINT32:
                        param.value = decoder.uint32();
                        break;
                    case ParamType.FLOAT:
                        param.value = decoder.float();
                        break;
                    case ParamType.RESKEY:
                        param.value = readResourceKey(decoder);
                        break;
                    case ParamType.REF:
                        param.value = decoder.uint32();
                }

                return param;
            }),
        }

        return preset;
    });


    properties.name = readManagedString(decoder);

    properties.displayIndex = decoder.float();

    properties.secondaryDisplayIndex = decoder.uint16();

    properties.prototypeId = decoder.uint32();

    properties.auralMaterialHash = decoder.uint32();

    properties.partFlags1 = decoder.byte();

    if(version > 39) {
        properties.partFlags2 = decoder.byte();
    }

    properties.excludePartFlags = decoder.uint64();

    if(version >= 41) {
        properties.excludePartFlags2 = decoder.uint64();
    }

    properties.excludeModifierRegionFlags = version >= 36 ? decoder.uint64() : decoder.uint32();

    properties.tags = makeList(decoder.uint32(), () => {
        return {
            category: decoder.uint16(),
            value: version >= 37 ? decoder.uint32() : decoder.uint16(),
        }
    });

    properties.deprecatedPrice = decoder.uint32();

    properties.partTitleKey = decoder.uint32();

    properties.partDescriptionKey = decoder.uint32();

    if(version >= 43) {
        properties.gameplayLockedDescriptionKey = decoder.uint32();
    }

    properties.uniqueTextureSpace = decoder.boolean();

    properties.bodyType = decoder.int32();

    // v35+ only
    properties.bodySubType = decoder.int32();

    properties.ageGenderFlags = decoder.uint32();

    if(version >= 32) {
        properties.species = decoder.uint32();
    }



    if(version >= 34) {
        properties.packId = decoder.int16();
        properties.packFlags = decoder.uint8();
        properties.reserved0 = decoder.bytes(9); // always 0
    } else {
        properties.packId = 0;
        properties.unused2 = decoder.byte();
        if(properties.unused2 > 0) {
            properties.unused3 = decoder.byte();
        }
    }

    properties.swatchColorSet = makeList(decoder.byte(), () => {
        return decoder.uint32();
    })

    properties.buffKey = readIndexedKey(decoder);

    properties.variantThumbKey = readIndexedKey(decoder);

    if(version >= 28) {
        properties.voiceEffectHash = decoder.uint64();
    }

    if(version >= 30) {
        const materialCount = decoder.byte();
        if(materialCount > 0) {
            if(materialCount !== 3) throw new Error("Unexpected number of Aural Material Set hashes");

            properties.auralMaterialSetUpperBodyHash = decoder.uint32();
            properties.auralMaterialSetLowerBodyHash = decoder.uint32();
            properties.auralMaterialSetShoesBodyHash = decoder.uint32();
        }
    }

    if(version >= 31) {
        properties.occultFlags = decoder.uint32();
    }

    if(version >= 46) {
        properties.unused4 = decoder.uint64();
    }

    if(version >= 38) {
        properties.oppositeGenderPart = decoder.uint64();
    }

    if(version >= 39) {
        properties.fallbackPart = decoder.uint64();
    }

    if(version >= 44) {

        properties.opacitySlider = {
            minimum: decoder.float(),
            increment: decoder.float(),
        }

        properties.hueSlider = {
            minimum: decoder.float(),
            maximum: decoder.float(),
            increment: decoder.float(),
        }

        properties.saturationSlider = {
            minimum: decoder.float(),
            maximum: decoder.float(),
            increment: decoder.float(),
        }

        properties.brightnessSlider = {
            minimum: decoder.float(),
            maximum: decoder.float(),
            increment: decoder.float(),
        }
    }

    if(version >= 45) {
        properties.linkedParts = makeList(decoder.byte(), () => {
            return readIndexedKey(decoder);
        })
    }

    properties.nakedKey = readIndexedKey(decoder);

    properties.parentKey = readIndexedKey(decoder);

    properties.sortLayer = decoder.int32();

    properties.lods = makeList(decoder.byte(), () => {
        return {
            level: decoder.byte(),
            unused: decoder.uint32(),
            assets: makeList(decoder.byte(), () => {
                return {
                    sorting: decoder.int32(),
                    specLevel: decoder.int32(),
                    castShadow: decoder.int32(),
                }
            }),
            lodKeys: makeList(decoder.byte(), () => {
                return readIndexedKey(decoder);
            })
        }
    })

    properties.slotKeys = makeList(decoder.byte(), () => {
        return readIndexedKey(decoder);
    });

    properties.diffuseKey = readIndexedKey(decoder);

    properties.shadowKey = readIndexedKey(decoder);

    properties.compositionMethod = decoder.byte();

    properties.regionMapKey = readIndexedKey(decoder);

    properties.overrides = makeList(decoder.byte(), () => {
        return {
            region: decoder.byte(),
            layer: decoder.float(),
        }
    })

    properties.normalMapKey = readIndexedKey(decoder);

    properties.specMapKey = readIndexedKey(decoder);

    if(version >= 27) {
        // "Additional Texture Space" in s4s?
        properties.normalUvBodyType = decoder.uint32();
    }

    if(version >= 29) {
        properties.emissionMapKey = readIndexedKey(decoder);
    }

    if(version >= 42) {
        properties.blendGeometryKey = readIndexedKey(decoder);
    }


    return { version, properties }
}
