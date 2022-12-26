import type { ResourceKey } from "../../packages/types";

export interface ObjectCatalogDto {
    version: number, // uint32
    catalogVersion: number, // uint32
    properties: ObjectCatalogProperties,
}

export type ObjectCatalogProperties = Partial<{
    // Object product properties
    version: number, // uint32
    nameKey: number, // uint32
    descriptionKey: number, // uint32
    simoleonPrice: number, // uint32
    thumbnailHash: bigint|string, // uint64
    devCategoryFlags: number, // uint32
    styleKeySet: ResourceKey[],
    packId: number, // int16
    packFlags: number, // uint8
    reserved0: number[], // bytes 9
    unused3: number, // byte
    unused4: number, // byte
    tags: number[],
    objectTooltipTags: ObjectTooltipTag[],
    gameplayLockedDescriptionKey: number, // uint32,
    gameplayUnlockedDescriptionKey: number, // uint32,
    swatchColorsSortPriority: number, // uint16
    variantThumbnailImageHash: bigint|string, // uint64

    // Default catalog properties
    auralMaterialsVersion: number, // uint32
    auralMaterials1: number, // uint32
    auralMaterials2: number, // uint32
    auralMaterials3: number, // uint32
    auralPropertiesVersion: number, // uint32
    auralQuality: number, // uint32
    auralAmbientObject: number, // uint32
    ambienceFileInstanceId: bigint|string, // uint64
    isOverrideAmbience: number, // byte (uchar?)
    secondaryAuralAmbientObjects: number[], // uint32

    unused0: number, // uint32
    unused1: number, // uint32
    unused2: number, // uint32
    unused5: number, // uint8
    placementFlagsHigh: number, // uint32
    placementFlagsLow: number, // uint32
    slotTypeSet: bigint|string, // uint64
    slotDecoSize: number, // byte
    catalogGroup: bigint|string, // uint64
    stateUsage: number, // byte
    swatchColorSet: number[], // uint32
    fenceHeight: number, // uint32
    isStackable: boolean, // byte
    canItemDepreciate: boolean, // byte
    fallbackObjectKey: ResourceKey,
}>

export type ObjectTooltipTag = {
    localizedString: number, // uint16
    value: number, // uint32
}
