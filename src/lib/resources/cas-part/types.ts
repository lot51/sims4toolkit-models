import type { ResourceKey } from "../../../lib/packages/types";

export interface CasPartDto {
    version: number, // uint32
    properties: CasPartProperties,
}

export type CasPartProperties = Partial<{
    presets: PartPreset[], // count uint32
    name: string,
    displayIndex: number, // float
    secondaryDisplayIndex: number, // uint16
    prototypeId: number, // uint32
    auralMaterialHash: number, // uint32 hex
    partFlags1: number, // uint32
    partFlags2: number, // uint32
    excludePartFlags: bigint | string, // uint64
    excludePartFlags2: bigint | string, // uint64
    excludeModifierRegionFlags: bigint | number | string, // uint64 or uint32
    tags: TagMultimap32 | TagMultimap,
    deprecatedPrice: number, // uint32
    partTitleKey: number | string, // uint32
    partDescriptionKey: number | string, // uint32
    uniqueTextureSpace: boolean, // byte
    gameplayLockedDescriptionKey: number, // uint32,
    bodyType: number, // int32
    bodySubType: number, // int32
    ageGenderFlags: bigint | number | string, // uint32
    species: number, // uint32
    packId: number, // int16
    packFlags: number, // int8
    reserved0: number[], // bytes 9
    unused2: number, // uint32
    unused3: number, // uint32
    swatchColorSet: any[], // uint32
    buffKey: ResourceKey,
    variantThumbKey: ResourceKey,
    voiceEffectHash: bigint | string // uint64,
    auralMaterialSetUpperBodyHash: number | string // uint32,
    auralMaterialSetLowerBodyHash: number | string // uint32,
    auralMaterialSetShoesBodyHash: number | string // uint32,
    occultFlags: number, // uint32
    unused4: bigint | string,
    oppositeGenderPart: bigint | string // uint64,
    fallbackPart: bigint | string // uint64,
    opacitySlider: OpacitySlider,
    hueSlider: Slider,
    saturationSlider: Slider,
    brightnessSlider: Slider,
    linkedParts: ResourceKey[],
    nakedKey: ResourceKey,
    parentKey: ResourceKey,
    sortLayer: number, // int32
    lods: LOD[],
    slotKeys: ResourceKey[],
    diffuseKey: ResourceKey,
    shadowKey: ResourceKey,
    compositionMethod: number, // byte
    regionMapKey: ResourceKey,
    overrides: Override[],
    normalMapKey: ResourceKey,
    specMapKey: ResourceKey,
    normalUvBodyType: number, // int32,
    emissionMapKey: ResourceKey,
    blendGeometryKey: ResourceKey,
}>


export type PartPreset = {
    complateId: bigint, // uint64
    params: PresetParam[],
}

export type PresetParam = {
    paramNameId: number, // uint32
    paramType: ParamType, // byte
    value: number | string | ResourceKey,
}

export enum ParamType {
    UINT32 = 1, // uint32
    FLOAT = 2, // float
    RESKEY = 3, // ResourceKey
    REF = 4
}

// count uint32
export type TagMultimap32 = Tag32[];

// count uint32
export type TagMultimap = Tag[];

export type Tag32 = {
    category: number, // uint16
    value: number, // uint32
}

export type Tag = {
    category: number, // uint16
    value: number, // uint16
}

export type LOD = {
    level: number, // byte
    unused: number, // uint32
    assets: LODAsset[],
    lodKeys: ResourceKey[],
}

export type LODAsset = {
    sorting: number, // int32
    specLevel: number, // int32
    castShadow: number // int32
}

export type Override = {
    region: number, // byte
    layer: number, // float
}

export type Slider = {
    minimum: number, // float
    maximum: number, // float
    increment: number, // float
}

export type OpacitySlider = {
    minimum: number, // float
    increment: number, // float
}
