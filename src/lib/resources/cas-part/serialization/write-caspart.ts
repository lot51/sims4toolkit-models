import { BinaryEncoder } from "@s4tk/encoding";
import { CasPartDto, LOD, OpacitySlider, Override, PartPreset, Slider, Tag, Tag32, TagMultimap, TagMultimap32 } from "../types";
import { ResourceKey } from "../../../packages/types";
import { Bytes } from '../../../enums/bytes';

export default function writeCasPart(
    dto: CasPartDto,
) {
    const version = dto.version;
    const propertyBuffers: Buffer[] = [];
    const keyIndex: ResourceKey[] = [];

    const getOrAddKeyIndex = (key: ResourceKey) => {
        let index = keyIndex.indexOf(key);
        if(index < 0) {
            keyIndex.push(key);
            index = keyIndex.length - 1;
        }
        return index;
    }

    const writeRaw = (t: string, v: any) => {
        const p = writeProp(t, v, version, getOrAddKeyIndex);
        propertyBuffers.push(p);
    }

    const write = (t: string, k: keyof CasPartDto["properties"]) => {
        writeRaw(t, dto.properties[k]);
    }

    const writeIndexedKey = (k: keyof CasPartDto["properties"]) => {
        const key = dto.properties[k] as ResourceKey;
        let index = getOrAddKeyIndex(key);
        const encoder = BinaryEncoder.alloc(1);
        encoder.byte(index);
        propertyBuffers.push(encoder.buffer);
    }

    const writeIndexedKeyList = (k: keyof CasPartDto["properties"]) => {
        const keys = dto.properties[k] as ResourceKey[];
        const encoder = BinaryEncoder.alloc(Bytes.BYTE + (Bytes.BYTE * keys.length));
        encoder.byte(keys.length);

        keys.forEach(key => {
            let index = getOrAddKeyIndex(key);
            encoder.byte(index);
        })

        propertyBuffers.push(encoder.buffer);
    }

    write('presets', 'presets');
    write('managedString', 'name');
    write('float', 'displayIndex');
    write('uint16', 'secondaryDisplayIndex');
    write('uint32', 'prototypeId');
    write('uint32', 'auralMaterialHash');
    write('byte', 'partFlags1');

    if(version > 39) {
        write('byte', 'partFlags2');
    }

    write('uint64', 'excludePartFlags');

    if(version >= 41) {
        write('uint64', 'excludePartFlags2');
    }

    if(version >= 36) {
        write('uint64', 'excludeModifierRegionFlags');
    } else {
        write('uint32', 'excludeModifierRegionFlags');
    }

    write('tags', 'tags');
    write('uint32', 'deprecatedPrice');
    write('uint32', 'partTitleKey');
    write('uint32', 'partDescriptionKey');

    if(version >= 43) {
        write('uint32', 'gameplayLockedDescriptionKey');
    }

    write('bool', 'uniqueTextureSpace');
    write('int32', 'bodyType');
    write('int32', 'bodySubType');
    write('uint32', 'ageGenderFlags');

    if(version >= 32) {
        write('uint32', 'species');
    }

    if(version >= 34) {
        write('int16', 'packId');
        write('uint8', 'packFlags');
        write('reserved0', 'reserved0');
    } else {
        write('byte', 'unused2');
        if(dto.properties.unused2 && dto.properties.unused2 > 0) {
            write('byte', 'unused2');
        }
    }

    write('swatchColorSet', 'swatchColorSet');

    writeIndexedKey('buffKey');
    writeIndexedKey('variantThumbKey');

    if(version >= 28) {
        write('uint64', 'voiceEffectHash');
    }

    if(version >= 30) {
        const hasAuralMaterialSets = dto.properties.auralMaterialSetUpperBodyHash && dto.properties.auralMaterialSetLowerBodyHash && dto.properties.auralMaterialSetShoesBodyHash;
        if(hasAuralMaterialSets) {
            writeRaw('byte', 3);
            write('uint32', 'auralMaterialSetUpperBodyHash');
            write('uint32', 'auralMaterialSetLowerBodyHash');
            write('uint32', 'auralMaterialSetShoesBodyHash');
        } else {
            writeRaw('byte', 0);
        }
    }

    if(version >= 31) {
        write('uint32', 'occultFlags');
    }

    if(version >= 46) {
        // UNKNOWN
        write('uint64', 'unused4');
    }

    if(version >= 38) {
        write('uint64', 'oppositeGenderPart');
    }

    if(version >= 39) {
        write('uint64', 'fallbackPart');
    }

    if(version >= 44) {
        write('opacitySlider', 'opacitySlider');
        write('slider', 'hueSlider');
        write('slider', 'saturationSlider');
        write('slider', 'brightnessSlider');
    }

    if(version >= 45) {
        writeIndexedKeyList('linkedParts');
    }

    writeIndexedKey('nakedKey');
    writeIndexedKey('parentKey');
    write('int32', 'sortLayer');
    write('lods', 'lods');
    writeIndexedKeyList('slotKeys');
    writeIndexedKey('diffuseKey');
    writeIndexedKey('shadowKey');
    write('byte', 'compositionMethod');
    writeIndexedKey('regionMapKey');
    write('overrides', 'overrides');
    writeIndexedKey('normalMapKey');
    writeIndexedKey('specMapKey');

    if(version >= 27) {
        write('uint32', 'normalUvBodyType');
    }

    if(version >= 29) {
        writeIndexedKey('emissionMapKey');
    }

    if(version >= 42) {
        writeIndexedKey('blendGeometryKey');
    }


    const keyIndexEncoder = BinaryEncoder.alloc(Bytes.BYTE + (Bytes.UINT32 * 4 * keyIndex.length));
    keyIndexEncoder.byte(keyIndex.length);

    keyIndex.forEach(key => {
        writeResourceKey(key, keyIndexEncoder);
    })

    const headerEncoder = BinaryEncoder.alloc(Bytes.UINT32*2);
    const dataSize = propertyBuffers.reduce((total, b) => b.byteLength + total, 0);
    headerEncoder.uint32(version);
    headerEncoder.uint32(dataSize);

    const buffer = Buffer.concat([
        headerEncoder.buffer,
        ...propertyBuffers,
        keyIndexEncoder.buffer,
    ]);

    return buffer;
}


function writeProp(
    key: string,
    value: any,
    version: number,
    getOrAddKeyIndex,
) {
    let encoder: BinaryEncoder;
    let length: number;

    switch(key) {
        case 'bool':
            encoder = BinaryEncoder.alloc(Bytes.BYTE);
            encoder.boolean(value as boolean);
            break;
        case 'byte':
            encoder = BinaryEncoder.alloc(Bytes.BYTE);
            encoder.byte(value as number);
            break;
        case 'float':
            encoder = BinaryEncoder.alloc(Bytes.FLOAT);
            encoder.float(value as number);
            break;
        case 'lods':
            encoder = BinaryEncoder.alloc(Bytes.BYTE);
            let lodBuffers: Buffer[] = [];
            (value as LOD[]).forEach(lod => {
                const lodAlloc = Bytes.BYTE + Bytes.UINT32 +
                    Bytes.BYTE + (Bytes.INT32 * 3 * lod.assets.length) +
                    Bytes.BYTE + (Bytes.BYTE *  lod.lodKeys.length);

                const lodEncoder = BinaryEncoder.alloc(lodAlloc);
                lodEncoder.byte(lod.level);
                lodEncoder.uint32(lod.unused);
                lodEncoder.byte(lod.assets.length);
                lod.assets.forEach(asset => {
                    lodEncoder.int32(asset.sorting);
                    lodEncoder.int32(asset.specLevel);
                    lodEncoder.int32(asset.castShadow);
                });

                lodEncoder.byte(lod.lodKeys.length);
                lod.lodKeys.forEach(lodKey => {
                    let index = getOrAddKeyIndex(lodKey);
                    lodEncoder.byte(index);
                })

                lodBuffers.push(lodEncoder.buffer);
            })

            encoder.byte(lodBuffers.length);

            return Buffer.concat([encoder.buffer, ...lodBuffers]);
        case 'managedString':
            return writeManagedString(value as string);
        case 'opacitySlider':
            encoder = BinaryEncoder.alloc(Bytes.FLOAT*2);
            var min = (value as OpacitySlider)?.minimum;
            var inc = (value as OpacitySlider)?.increment;
            encoder.float(typeof min == 'number' ? min : 0.2);
            encoder.float(typeof inc == 'number' ? inc : 0.05);
            break;
        case 'overrides':
            length = (value as Override[]).length;
            encoder = BinaryEncoder.alloc(Bytes.BYTE + ((Bytes.BYTE + Bytes.FLOAT) * length));
            encoder.byte(length);
            value.forEach(override => {
                encoder.byte(override.region);
                encoder.byte(override.layer);
            })
            break;
        case 'presets':
            length = (value as Array<PartPreset>)?.length ?? 0;
            encoder = BinaryEncoder.alloc(Bytes.UINT32);
            encoder.uint32(length);
            break;
        case 'slider':
            encoder = BinaryEncoder.alloc(Bytes.FLOAT*3);
            var min = (value as Slider)?.minimum;
            var max = (value as Slider)?.maximum;
            var inc = (value as Slider)?.increment;
            encoder.float(typeof min == 'number' ? min : -0.5);
            encoder.float(typeof max == 'number' ? max : 0.5);
            encoder.float(typeof inc == 'number' ? inc : 0.05);
            break;
        case 'swatchColorSet':
            length = (value as number[]).length;
            encoder = BinaryEncoder.alloc(Bytes.BYTE + (Bytes.UINT32 * length));
            encoder.byte(length);
            value.forEach(v => {
                encoder.uint32(v);
            })
            break;
        case 'tags':
            if(version >= 37) {
                length = (value as TagMultimap32).length;
                encoder = BinaryEncoder.alloc(Bytes.UINT32 + ((Bytes.UINT16 + Bytes.UINT32) * length));
            } else {
                length = (value as TagMultimap).length;
                encoder = BinaryEncoder.alloc(Bytes.UINT32 + ((Bytes.UINT16 + Bytes.UINT16) * length));
            }

            encoder.uint32(length);

            value.forEach((tag: Tag|Tag32) => {
                encoder.uint16(tag.category);
                if(version >= 37) {
                    encoder.uint32(tag.value);
                } else {
                    encoder.uint16(tag.value);
                }
            });
            break;
        case 'uint8':
            encoder = BinaryEncoder.alloc(Bytes.UINT8);
            encoder.uint8(value as number);
            break;
        case 'int16':
            encoder = BinaryEncoder.alloc(Bytes.INT16);
            encoder.int16(value as number);
            break;
        case 'uint16':
            encoder = BinaryEncoder.alloc(Bytes.UINT16);
            encoder.uint16(value as number);
            break;
        case 'int32':
            encoder = BinaryEncoder.alloc(Bytes.INT32);
            encoder.int32(value as number);
            break;
        case 'uint32':
            encoder = BinaryEncoder.alloc(Bytes.UINT32);
            encoder.uint32(value as number);
            break;
        case 'uint64':
            encoder = BinaryEncoder.alloc(Bytes.UINT64);
            encoder.uint64(BigInt(value));
            break;
        case 'reserved0':
            encoder = BinaryEncoder.alloc(9);
            encoder.bytes(Array(9).fill(0));
            break;
        default:
            throw new Error(`CAS Part property "${key}" not recognized. This error should never be thrown, so if you're reading this, please report the error ASAP.`);
    }

    return encoder.buffer;
}

function writeManagedString(str: string) {
    const length = Buffer.byteLength(str)*2;
    let encoder: BinaryEncoder;
    let alloc = Bytes.UINT8;
    if(length > 127) {
        alloc += Bytes.UINT8;
        encoder = BinaryEncoder.alloc(alloc);
        encoder.uint8(length & 0xFFFFFFFF);
        encoder.uint8(length >> 7);
    } else {
        encoder = BinaryEncoder.alloc(alloc);
        encoder.uint8(length);
    }

    return Buffer.concat([
        encoder.buffer.subarray(0, alloc),
        Buffer.from(str, 'utf16le').swap16(),
    ]);
}

function writeResourceKey(key: ResourceKey, encoder: BinaryEncoder) {
    encoder.uint32(Number(key.instance & 0xFFFFFFFFn));
    encoder.uint32(Number(key.instance >> 32n));
    encoder.uint32(key.group);
    encoder.uint32(key.type);
    return encoder.buffer;
}
