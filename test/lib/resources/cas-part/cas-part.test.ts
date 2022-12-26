import fs from "fs";
import path from "path";
import { expect } from "chai";
import { CasPartResource } from "../../../../dst/models";
import { EncodingType } from "../../../../dst/enums";
import MockOwner from "../../../mocks/mock-owner";
import { CasPartProperties } from "../../../../dst/lib/resources/cas-part/types";
import { AgeGenderFlag, BodySubType, BodyType, PackFlag, Species } from "../../../../dst/lib/resources/cas-part/enums";
import { CompressionType } from "@s4tk/compression";

//#region Helpers & Variables

const getBuffer = (filename: string) => fs.readFileSync(
  path.resolve(
    __dirname,
    `../../../data/cas-parts/${filename}.binary`
  )
);

const latestBuffer = getBuffer("Version46");
const v43Buffer = getBuffer("Version43");


//#endregion Helpers & Variables

describe("CasPartResource", () => {
  //#region Properties

  describe("#encodingType", () => {
    it("should be CASP", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.encodingType).to.equal(EncodingType.CASP);
    });
  });

  describe("#properties", () => {
    it("should not uncache the owner when mutated", () => {
      const owner = new MockOwner();
      const def = CasPartResource.from(latestBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties.displayIndex = 1;
      expect(owner.cached).to.be.true;
    });

    it("should not uncache the owner when values mutated", () => {
      const owner = new MockOwner();
      const def = CasPartResource.from(latestBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties.brightnessSlider!.maximum = 1.05;
      expect(owner.cached).to.be.true;
    });

    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const def = CasPartResource.from(latestBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.properties = def.properties;
      expect(owner.cached).to.be.false;
    });
  });

  describe("#version", () => {
    it("should be 46", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.version).to.equal(46);
    });

    it("should uncache the owner when set", () => {
      const owner = new MockOwner();
      const def = CasPartResource.from(latestBuffer, {
        owner
      });

      expect(owner.cached).to.be.true;
      def.version = 43;
      expect(owner.cached).to.be.false;
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#constructor", () => {
    it("should use latest version if not provided", () => {
      const def = new CasPartResource();
      expect(def.version).to.equal(46);
    });

    it("should use the provided version", () => {
      const def = new CasPartResource({ version: 43 });
      expect(def.version).to.equal(43);
    });

    it("should have empty properties if none provided", () => {
      const def = new CasPartResource();
      expect(def.properties).to.be.an("Object");
      expect(Object.keys(def.properties).length).to.equal(0);
    });

    it("should use the provided properties", () => {
      const properties: CasPartProperties = {};
      const def = new CasPartResource({ properties });
      expect(def.properties.displayIndex).to.be.undefined;
      properties.displayIndex = 1;
      expect(def.properties.displayIndex).to.equal(1);
    });

    it("should be mutated if original properties are mutated", () => {
      const def = new CasPartResource({
        properties: {
          displayIndex: 1
        }
      });

      expect(def.properties.displayIndex).to.equal(1);
    });

    it("should use ZLIB compression by default", () => {
      const def = new CasPartResource();
      expect(def.defaultCompressionType).to.equal(CompressionType.ZLIB);
    });

    it("should use the provided defaultCompressionType", () => {
      const def = new CasPartResource({
        defaultCompressionType: CompressionType.InternalCompression
      });

      expect(def.defaultCompressionType).to.equal(CompressionType.InternalCompression);
    });

    it("should not have any initial cache by default", () => {
      const def = new CasPartResource();
      expect(def.bufferCache).to.be.undefined;
    });

    it("should use the provided initialBufferCache", () => {
      const initialBufferCache = {
        buffer: latestBuffer,
        compressionType: CompressionType.Uncompressed,
        sizeDecompressed: latestBuffer.byteLength
      };

      const def = new CasPartResource({
        initialBufferCache
      });

      expect(def.bufferCache).to.equal(initialBufferCache);
    });

    it("should not have an owner by default", () => {
      const def = new CasPartResource();
      expect(def.owner).to.be.undefined;
    });

    it("should use the provided owner", () => {
      const owner = new MockOwner();
      const def = new CasPartResource({ owner });
      expect(def.owner).to.equal(owner);
    });
  });

  describe("#from()", () => {
    it("should get the correct Name value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.name).to.equal("lot51_ymBody_SP01SuitTextured_SolidPurple_202211252224566068");
    });

    it("should have zero Presets", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.presets).to.be.empty;
    });

    it("should get the correct displayIndex value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.displayIndex).to.equal(3);
    });

    it("should get the correct secondaryDisplayIndex value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.secondaryDisplayIndex).to.equal(10);
    });

    it("should get the correct prototypeId value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.prototypeId).to.equal(2408666578);
    });

    it("should get the correct auralMaterialHash value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.auralMaterialHash).to.equal(2166136261);
    });

    it("should get the correct partFlags1 value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.partFlags1).to.equal(12);
    });

    it("should get the correct partFlags2 value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.partFlags2).to.equal(0);
    });

    it("should get the correct excludePartFlags value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.excludePartFlags).to.equal(0n);
    });

    it("should get the correct excludeModifierRegionFlags value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.excludeModifierRegionFlags).to.equal(0n);
    });

    it("should get the correct tags value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.tags).to.be.an("Array").with.lengthOf(17);
      expect(def.properties.tags![0].category).to.equal(68);
      expect(def.properties.tags![0].value).to.equal(84);
      expect(def.properties.tags![1].category).to.equal(68);
      expect(def.properties.tags![1].value).to.equal(72);
    });

    it("should get the correct deprecatedPrice value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.deprecatedPrice).to.equal(0);
    });

    it("should get the correct partTitleKey value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.partTitleKey).to.equal(0);
    });

    it("should get the correct partDescriptionKey value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.partDescriptionKey).to.equal(0);
    });

    it("should get the correct gameplayLockedDescriptionKey value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.gameplayLockedDescriptionKey).to.equal(0x00123ABC);
    });

    it("should get the correct uniqueTextureSpace value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.uniqueTextureSpace).to.be.false;
    });

    it("should get the correct bodyType value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.bodyType).to.equal(BodyType.FULL_BODY);
    });

    it("should get the correct bodySubType value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.bodySubType).to.equal(BodySubType.NONE);
    });

    it("should get the correct ageGenderFlags value", () => {
        const def = CasPartResource.from(latestBuffer);
        const flag = AgeGenderFlag.TEEN | AgeGenderFlag.YOUNG_ADULT | AgeGenderFlag.ADULT | AgeGenderFlag.ELDER | AgeGenderFlag.MALE;
        expect(def.properties.ageGenderFlags).to.equal(flag);
    });

    it("should get the correct species value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.species).to.equal(Species.HUMAN);
    });

    it("should get the correct packId value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.packId).to.equal(1);
    });

    it("should get the correct packFlags value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.packFlags).to.equal(PackFlag.HidePackIcon);
    });

    it("should get the correct swatchColorSet value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.swatchColorSet).to.be.an("Array").with.lengthOf(1);
        expect(def.properties.swatchColorSet![0]).to.equal(4286402012);
    });

    it("should get the correct buffKey value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.buffKey).to.be.an("Object");
        expect(def.properties.buffKey!.type).to.equal(0);
        expect(def.properties.buffKey!.group).to.equal(0);
        expect(def.properties.buffKey!.instance).to.equal(144469n);
    });

    it("should get the correct variantThumbKey value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.variantThumbKey).to.be.an("Object");
        expect(def.properties.variantThumbKey!.type).to.equal(0);
        expect(def.properties.variantThumbKey!.group).to.equal(0);
        expect(def.properties.variantThumbKey!.instance).to.equal(0n);
    });

    it("should get the correct voiceEffectHash value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.voiceEffectHash).to.equal(0n);
    });

    it("should get the correct auralMaterialSetLowauralMaterialSetUpperBodyHasherBodyHash value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.auralMaterialSetUpperBodyHash).to.be.undefined;
    });

    it("should get the correct auralMaterialSetLowerBodyHash value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.auralMaterialSetLowerBodyHash).to.be.undefined;
    });

    it("should get the correct auralMaterialSetShoesBodyHash value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.auralMaterialSetShoesBodyHash).to.be.undefined;
    });

    it("should get the correct occultFlags value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.occultFlags).to.equal(8);
    });

    it("should get the correct unused4 value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.unused4).to.equal(0n);
    });

    it("should get the correct oppositeGenderPart value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.oppositeGenderPart).to.equal(0n);
    });

    it("should get the correct fallbackPart value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.fallbackPart).to.equal(0n);
    });

    it("should get the correct opacitySlider value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.opacitySlider).to.be.an("Object");
        expect(def.properties.opacitySlider!.minimum).to.equal(0.20000000298023224);
        expect(def.properties.opacitySlider!.increment).to.equal(0.05000000074505806);
    });

    it("should get the correct hueSlider value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.hueSlider).to.be.an("Object");
        expect(def.properties.hueSlider!.minimum).to.equal(-0.5);
        expect(def.properties.hueSlider!.maximum).to.equal(0.5);
        expect(def.properties.hueSlider!.increment).to.equal(0.05000000074505806);
    });

    it("should get the correct saturationSlider value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.saturationSlider).to.be.an("Object");
        expect(def.properties.saturationSlider!.minimum).to.equal(-0.5);
        expect(def.properties.saturationSlider!.maximum).to.equal(0.5);
        expect(def.properties.saturationSlider!.increment).to.equal(0.05000000074505806);
    });

    it("should get the correct brightnessSlider value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.brightnessSlider).to.be.an("Object");
        expect(def.properties.brightnessSlider!.minimum).to.equal(-0.5);
        expect(def.properties.brightnessSlider!.maximum).to.equal(0.5);
        expect(def.properties.brightnessSlider!.increment).to.equal(0.05000000074505806);
    });

    it("should get the correct linkedParts value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.linkedParts).to.be.an("Array").with.lengthOf(0);
    });

    it("should get the correct slotKeys value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.slotKeys).to.be.an("Array").with.lengthOf(2);
      expect(def.properties.slotKeys![0].type).to.equal(0x0);
      expect(def.properties.slotKeys![0].group).to.equal(0x0);
      expect(def.properties.slotKeys![0].instance).to.equal(144469n);
      expect(def.properties.slotKeys![1].type).to.equal(0x0);
      expect(def.properties.slotKeys![1].group).to.equal(0x0);
      expect(def.properties.slotKeys![1].instance).to.equal(144469n);
    });

    it("should get the correct diffuseKey value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.diffuseKey).to.be.an("Object");
      expect(def.properties.diffuseKey!.type).to.equal(877907861);
      expect(def.properties.diffuseKey!.group).to.equal(0x0);
      expect(def.properties.diffuseKey!.instance).to.equal(8541761165723853684n);
    });

    it("should get the correct shadowKey value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.shadowKey).to.be.an("Object");
      expect(def.properties.shadowKey!.type).to.equal(877907861);
      expect(def.properties.shadowKey!.group).to.equal(0x0);
      expect(def.properties.shadowKey!.instance).to.equal(3730896899111643448n);
    });

    it("should get the correct compositionMethod value", () => {
      const def = CasPartResource.from(latestBuffer);
      expect(def.properties.compositionMethod).to.equal(0);
    });

    it("should get the correct regionMapKey value", () => {
        const def = CasPartResource.from(latestBuffer);
        expect(def.properties.regionMapKey).to.be.an("Object");
        expect(def.properties.regionMapKey!.type).to.equal(2887187436);
        expect(def.properties.regionMapKey!.group).to.equal(0x0);
        expect(def.properties.regionMapKey!.instance).to.equal(15950608409992469786n);
      });

//     it("should get the correct Rig value", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.properties.rigs![0].type).to.equal(0x8EAF13DE);
//       expect(def.properties.rigs![0].group).to.equal(0);
//       expect(def.properties.rigs![0].instance).to.equal(0x1AB585368F4D8687n);
//     });

//     it("should get the correct Slot value", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.properties.slots![0].type).to.equal(0xD3044521);
//       expect(def.properties.slots![0].group).to.equal(0);
//       expect(def.properties.slots![0].instance).to.equal(0x1AB585368F4D8687n);
//     });

//     it("should get the correct Model value", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.properties.models![0].type).to.equal(0x01661233);
//       expect(def.properties.models![0].group).to.equal(0);
//       expect(def.properties.models![0].instance).to.equal(0x5CCFAD78FE4212BEn);
//     });

//     it("should get the correct Footprint value", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.properties.footprints![0].type).to.equal(0xD382BF57);
//       expect(def.properties.footprints![0].group).to.equal(0x80000000);
//       expect(def.properties.footprints![0].instance).to.equal(0x999BE3F885903910n);
//     });

//     it("should read an obj def with no properties", () => {
//       const def = ObjectDefinitionResource.from(emptyBuffer);
//       expect(Object.keys(def.properties).length).to.equal(0);
//     });

//     it("should use ZLIB compression by default", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.defaultCompressionType).to.equal(CompressionType.ZLIB);
//     });

//     it("should use the provided defaultCompressionType", () => {
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         defaultCompressionType: CompressionType.InternalCompression
//       });

//       expect(def.defaultCompressionType).to.equal(CompressionType.InternalCompression);
//     });

//     it("should not have an owner by default", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.owner).to.be.undefined;
//     });

//     it("should use the provided owner", () => {
//       const owner = new MockOwner();
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, { owner });
//       expect(def.owner).to.equal(owner);
//     });

//     it("should fail if version ≠ 2 by default", () => {
//       expect(() => ObjectDefinitionResource.from(badVersionBuffer)).to.throw();
//     });

//     it("should not fail if version ≠ 2 but recoveryMode is true", () => {
//       expect(() => ObjectDefinitionResource.from(badVersionBuffer, {
//         recoveryMode: true
//       })).to.not.throw();
//     });

//     it("should not cache the buffer by default", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.hasBufferCache).to.be.false;
//     });

//     it("should cache the buffer if saveBuffer is true", () => {
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       expect(def.hasBufferCache).to.be.true;
//     });
  });

//   describe("#fromAsync()", () => {
//     it("should return an obj def asynchronously", async () => {
//       const def = await ObjectDefinitionResource.fromAsync(tartosianoBuffer);
//       expect(def.encodingType).to.equal(EncodingType.OBJDEF);
//     });

//     it("should use the given options", async () => {
//       const def = await ObjectDefinitionResource.fromAsync(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       expect(def.hasBufferCache).to.be.true;
//     });
//   });

//   //#endregion Initialization

//   //#region Methods

//   describe("#clone()", () => {
//     it("should copy the original's version", () => {
//       const original = new ObjectDefinitionResource({ version: 3 });
//       const clone = original.clone();
//       expect(clone.version).to.equal(3);
//     });

//     it("should copy the original's properties", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           isBaby: true,
//           components: [1, 2, 3],
//           icons: [{
//             type: 0x1234,
//             group: 0,
//             instance: 12345n
//           }],
//           name: "something",
//           simoleonPrice: 500,
//         }
//       });

//       const clone = original.clone();

//       expect(Object.keys(clone.properties).length).to.equal(5);
//       expect(clone.properties.isBaby).to.be.true;
//       expect(clone.properties.components).to.be.an("Array").with.lengthOf(3);
//       expect(clone.properties.components![0]).to.equal(1);
//       expect(clone.properties.components![1]).to.equal(2);
//       expect(clone.properties.components![2]).to.equal(3);
//       expect(clone.properties.icons).to.be.an("Array").with.lengthOf(1);
//       expect(clone.properties.icons![0].type).to.equal(0x1234);
//       expect(clone.properties.icons![0].group).to.equal(0);
//       expect(clone.properties.icons![0].instance).to.equal(12345n);
//       expect(clone.properties.name).to.equal("something");
//       expect(clone.properties.simoleonPrice).to.equal(500);
//     });

//     it("should copy the original's buffer cache if present", () => {
//       const original = ObjectDefinitionResource.from(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       const clone = original.clone();
//       expect(clone.hasBufferCache).to.be.true;
//     });

//     it("should not have buffer cache if original doesn't", () => {
//       const original = new ObjectDefinitionResource();
//       const clone = original.clone();
//       expect(clone.hasBufferCache).to.be.false;
//     });

//     it("should copy the original's default compression type", () => {
//       const original = ObjectDefinitionResource.from(tartosianoBuffer, {
//         defaultCompressionType: CompressionType.InternalCompression
//       });

//       const clone = original.clone();
//       expect(clone.defaultCompressionType).to.equal(CompressionType.InternalCompression);
//     });

//     it("should not copy the original's owner", () => {
//       const owner = new MockOwner();
//       const original = new ObjectDefinitionResource({ owner });
//       const clone = original.clone();
//       expect(original.owner).to.equal(owner);
//       expect(clone.owner).to.be.undefined;
//     });

//     it("should not mutate the original's version", () => {
//       const original = new ObjectDefinitionResource({ version: 2 });
//       const clone = original.clone();
//       clone.version = 3;
//       expect(original.version).to.equal(2);
//       expect(clone.version).to.equal(3);
//     });

//     it("should not mutate the original's properties", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           isBaby: true,
//         }
//       });

//       const clone = original.clone();
//       clone.properties = {
//         isBaby: false
//       };

//       expect(original.properties.isBaby).to.be.true;
//       expect(clone.properties.isBaby).to.be.false;
//     });

//     it("should not mutate the original's properties primitive values", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           isBaby: true,
//         }
//       });

//       const clone = original.clone();
//       clone.properties.isBaby = false;
//       expect(original.properties.isBaby).to.be.true;
//       expect(clone.properties.isBaby).to.be.false;
//     });

//     it("should not mutate the original's properties mutable values", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           models: [{
//             type: 0x12345678,
//             group: 0,
//             instance: 12345n
//           }]
//         }
//       });

//       const clone = original.clone();
//       clone.properties.models![0].group = 8;
//       expect(original.properties.models![0].group).to.equal(0);
//       expect(clone.properties.models![0].group).to.equal(8);
//     });
//   });

//   describe("#equals()", () => {
//     context("version is same", () => {
//       context("properties are same", () => {
//         it("should return true if all properties are exactly the same in same order", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               name: "something",
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               name: "something",
//             }
//           });

//           expect(def1.equals(def2)).to.be.true;
//         });

//         it("should return true if all properties are exactly the same in different order", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               name: "something",
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               name: "something",
//               isBaby: true,
//             }
//           });

//           expect(def1.equals(def2)).to.be.true;
//         });

//         it("should return true if icon key is different object but has same values", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               icons: [
//                 {
//                   type: 0x12345678,
//                   group: 0,
//                   instance: 12345n
//                 }
//               ]
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               icons: [
//                 {
//                   type: 0x12345678,
//                   group: 0,
//                   instance: 12345n
//                 }
//               ]
//             }
//           });

//           expect(def1.equals(def2)).to.be.true;
//         });

//         it("should return true if components list is different object, but has same values in same order", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               components: [1, 2, 3]
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               components: [1, 2, 3]
//             }
//           });

//           expect(def1.equals(def2)).to.be.true;
//         });

//         it("should return true if unknown misc set is different object, but has same values in same order", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               unknownMisc: new Set([1, 2, 3])
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               unknownMisc: new Set([1, 2, 3])
//             }
//           });

//           expect(def1.equals(def2)).to.be.true;
//         });
//       });

//       context("properties are different", () => {
//         it("should return false if a primitive value is different", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: false,
//             }
//           });

//           expect(def1.equals(def2)).to.be.false;
//         });

//         it("should return false if unknown sets contain different amounts", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               unknownMisc: new Set([1, 2, 3])
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               unknownMisc: new Set([2, 3, 4])
//             }
//           });

//           expect(def1.equals(def2)).to.be.false;
//         });

//         it("should return false if this is a subset of that", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               name: "something"
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               name: "something",
//               components: [1, 2, 3]
//             }
//           });

//           expect(def1.equals(def2)).to.be.false;
//         });

//         it("should return false if that is a subset of this", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               name: "something"
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               name: "something",
//               components: [1, 2, 3]
//             }
//           });

//           expect(def2.equals(def1)).to.be.false;
//         });

//         it("should return false if components list is has same values, but in different order", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               components: [1, 2, 3]
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               components: [2, 1, 3]
//             }
//           });

//           expect(def1.equals(def2)).to.be.false;
//         });

//         it("should return false if unknown misc set is different object, but has same values in different order", () => {
//           const def1 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               unknownMisc: new Set([1, 2, 3])
//             }
//           });

//           const def2 = new ObjectDefinitionResource({
//             properties: {
//               isBaby: true,
//               unknownMisc: new Set([3, 2, 1])
//             }
//           });

//           expect(def1.equals(def2)).to.be.false;
//         });
//       });
//     });

//     context("version is different", () => {
//       context("properties are same", () => {
//         it("should return false", () => {
//           const properties = {};

//           const def1 = new ObjectDefinitionResource({
//             version: 2,
//             properties
//           });

//           const def2 = new ObjectDefinitionResource({
//             version: 3,
//             properties
//           });

//           expect(def1.properties).to.equal(def2.properties);
//           expect(def1.equals(def2)).to.be.false;
//         });
//       });

//       context("properties are different", () => {
//         it("should return false", () => {
//           const def1 = new ObjectDefinitionResource({
//             version: 2,
//             properties: {}
//           });

//           const def2 = new ObjectDefinitionResource({
//             version: 3,
//             properties: {
//               isBaby: true
//             }
//           });

//           expect(def1.properties).to.not.equal(def2.properties);
//           expect(def1.equals(def2)).to.be.false;
//         });
//       });
//     });
//   });

//   describe("#getBuffer()", () => {
//     it("should write Components correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           components: [1, 2, 3]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.components).to.be.an("Array").with.lengthOf(3);
//       const [first, second, third] = def.properties.components!;
//       expect(first).to.equal(1);
//       expect(second).to.equal(2);
//       expect(third).to.equal(3);
//     });

//     it("should write EnvironmentScoreEmotionTags correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           environmentScoreEmotionTags: [100, 250]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.environmentScoreEmotionTags).to.be.an("Array").with.lengthOf(2);
//       const [first, second] = def.properties.environmentScoreEmotionTags!;
//       expect(first).to.equal(100);
//       expect(second).to.equal(250);
//     });

//     it("should write EnvironmentScoreEmotionTags_32 correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           environmentScoreEmotionTags_32: [100, 250]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.environmentScoreEmotionTags_32).to.be.an("Array").with.lengthOf(2);
//       const [first, second] = def.properties.environmentScoreEmotionTags_32!;
//       expect(first).to.equal(100);
//       expect(second).to.equal(250);
//     });

//     it("should write EnvironmentScores correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           environmentScores: [1.5, -2.5]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.environmentScores).to.be.an("Array").with.lengthOf(2);
//       const [first, second] = def.properties.environmentScores!;
//       expect(first).to.be.approximately(1.5, 0.001);
//       expect(second).to.be.approximately(-2.5, 0.001);
//     });

//     it("should write Footprint correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           footprints: [
//             {
//               type: 0x12345678,
//               group: 0x80000000,
//               instance: 0x1234567890n
//             }
//           ]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.footprints).to.be.an("Array").with.lengthOf(1);
//       const [first] = def.properties.footprints!;
//       expect(first.type).to.equal(0x12345678);
//       expect(first.group).to.equal(0x80000000);
//       expect(first.instance).to.equal(0x1234567890n);
//     });

//     it("should write Icon correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           icons: [
//             {
//               type: 0x12345678,
//               group: 0x80000000,
//               instance: 0x1234567890n
//             }
//           ]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.icons).to.be.an("Array").with.lengthOf(1);
//       const [first] = def.properties.icons!;
//       expect(first.type).to.equal(0x12345678);
//       expect(first.group).to.equal(0x80000000);
//       expect(first.instance).to.equal(0x1234567890n);
//     });

//     it("should write IsBaby correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           isBaby: true
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.isBaby).to.equal(true);
//     });

//     it("should write MaterialVariant correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           materialVariant: "material"
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.materialVariant).to.equal("material");
//     });

//     it("should write Model correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           models: [
//             {
//               type: 0x12345678,
//               group: 0x80000000,
//               instance: 0x1234567890n
//             }
//           ]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.models).to.be.an("Array").with.lengthOf(1);
//       const [first] = def.properties.models!;
//       expect(first.type).to.equal(0x12345678);
//       expect(first.group).to.equal(0x80000000);
//       expect(first.instance).to.equal(0x1234567890n);
//     });

//     it("should write Name correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           name: "something"
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.name).to.equal("something");
//     });

//     it("should write PositiveEnvironmentScore correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           positiveEnvironmentScore: 1.2
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.positiveEnvironmentScore).to.be.approximately(1.2, 0.001);
//     });

//     it("should write NositiveEnvironmentScore correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           negativeEnvironmentScore: -1.2
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.negativeEnvironmentScore).to.be.approximately(-1.2, 0.001);
//     });

//     it("should write Rig correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           rigs: [
//             {
//               type: 0x12345678,
//               group: 0x80000000,
//               instance: 0x1234567890n
//             }
//           ]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.rigs).to.be.an("Array").with.lengthOf(1);
//       const [first] = def.properties.rigs!;
//       expect(first.type).to.equal(0x12345678);
//       expect(first.group).to.equal(0x80000000);
//       expect(first.instance).to.equal(0x1234567890n);
//     });

//     it("should write SimoleonPrice correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           simoleonPrice: 500
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.simoleonPrice).to.equal(500);
//     });

//     it("should write Slot correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           slots: [
//             {
//               type: 0x12345678,
//               group: 0x80000000,
//               instance: 0x1234567890n
//             },
//             {
//               type: 0x12345678,
//               group: 0x0000000,
//               instance: 0xABCDEFn
//             }
//           ]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.slots).to.be.an("Array").with.lengthOf(2);
//       const [first, second] = def.properties.slots!;
//       expect(first.type).to.equal(0x12345678);
//       expect(first.group).to.equal(0x80000000);
//       expect(first.instance).to.equal(0x1234567890n);
//       expect(second.type).to.equal(0x12345678);
//       expect(second.group).to.equal(0x00000000);
//       expect(second.instance).to.equal(0xABCDEFn);
//     });

//     it("should write ThumbnailGeometryState correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           thumbnailGeometryState: 12345
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.thumbnailGeometryState).to.equal(12345);
//     });

//     it("should write Tuning correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           tuning: "something"
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.tuning).to.equal("something");
//     });

//     it("should write TuningId correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           tuningId: 0x1234567890ABCDEFn
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(1);
//       expect(def.properties.tuningId).to.equal(0x1234567890ABCDEFn);
//     });

//     it("should write multiple properties correctly", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           tuningId: 0x1234567890ABCDEFn,
//           isBaby: true,
//           models: [
//             {
//               type: 1,
//               group: 2,
//               instance: 3n
//             }
//           ]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(3);
//       expect(def.properties.tuningId).to.equal(0x1234567890ABCDEFn);
//       expect(def.properties.isBaby).to.be.true
//       expect(def.properties.models).to.be.an("Array").with.lengthOf(1);
//       expect(def.properties.models![0].type).to.equal(1);
//       expect(def.properties.models![0].group).to.equal(2);
//       expect(def.properties.models![0].instance).to.equal(3n);
//     });

//     it("should serialize an obj def with no properties", () => {
//       const original = new ObjectDefinitionResource();
//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(0);
//     });

//     it("should not write UnknownMisc", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           unknownMisc: new Set([1, 2, 3])
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(Object.keys(def.properties).length).to.equal(0);
//     });

//     it("should reserialize into an object that is equal to this one", () => {
//       const original = new ObjectDefinitionResource({
//         properties: {
//           isBaby: true,
//           name: "something",
//           components: [1, 2, 3]
//         }
//       });

//       const buffer = original.getBuffer();
//       const def = ObjectDefinitionResource.from(buffer);
//       expect(original.equals(def)).to.be.true;
//     });
//   });

//   describe("#getProperty()", () => {
//     it("should get the primitive value of the property for the given type", () => {
//       const def = CasPartResource.from(latestBuffer);
//       const name = def.getProperty(ObjectDefinitionType.Name);
//       expect(name).to.equal("frankk_LB:object_textbook_Tartosiano");
//     });

//     it("should get the mutable value of the property for the given type", () => {
//       const def = CasPartResource.from(latestBuffer);
//       const components = def.getProperty(ObjectDefinitionType.Components) as number[];
//       expect(components).to.be.an("Array").with.lengthOf(9);
//       expect(components[0]).to.equal(573464449);
//     });

//     it("should return undefined if there is no property set for the given type", () => {
//       const def = CasPartResource.from(latestBuffer);
//       const unknown4 = def.getProperty(ObjectDefinitionType.Unknown4);
//       expect(unknown4).to.be.undefined;
//     });
//   });

//   describe("#isXml()", () => {
//     it("should always return false", () => {
//       const def = CasPartResource.from(latestBuffer);
//       expect(def.isXml()).to.be.false;
//     });
//   });

//   describe("#onChange()", () => {
//     it("should delete the buffer cache", () => {
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       expect(def.hasBufferCache).to.be.true;
//       def.onChange();
//       expect(def.hasBufferCache).to.be.false;
//     });

//     it("should uncache the owner", () => {
//       const owner = new MockOwner();
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         owner
//       });

//       expect(owner.cached).to.be.true;
//       def.onChange();
//       expect(owner.cached).to.be.false;
//     });
//   });

//   describe("#setProperty()", () => {
//     it("should set the primitive value of the property for the given type", () => {
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       expect(def.properties.isBaby).to.be.undefined;
//       def.setProperty(ObjectDefinitionType.IsBaby, true);
//       expect(def.properties.isBaby).to.be.true;
//     });

//     it("should set the mutable value of the property for the given type", () => {
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       expect(def.properties.components).to.be.an("Array").with.lengthOf(9);
//       const newComponents = [1, 2, 3];
//       def.setProperty(ObjectDefinitionType.Components, newComponents);
//       expect(def.properties.components).to.equal(newComponents);
//     });

//     it("should uncache the buffer", () => {
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       expect(def.hasBufferCache).to.be.true;
//       def.setProperty(ObjectDefinitionType.IsBaby, true);
//       expect(def.hasBufferCache).to.be.false;
//     });

//     it("should uncache the owner", () => {
//       const owner = new MockOwner();
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         owner,
//         saveBuffer: true
//       });

//       expect(owner.cached).to.be.true;
//       def.setProperty(ObjectDefinitionType.IsBaby, true);
//       expect(owner.cached).to.be.false;
//     });
//   });

//   describe("#updateProperties()", () => {
//     it("should mutate the properties object", () => {
//       const properties: ObjectDefinitionProperties = {};
//       const def = new ObjectDefinitionResource({ properties });
//       expect(properties.isBaby).to.be.undefined;
//       def.updateProperties(props => {
//         props.isBaby = true;
//       });
//       expect(properties.isBaby).to.be.true;
//     });

//     it("should uncache the buffer", () => {
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         saveBuffer: true
//       });

//       expect(def.hasBufferCache).to.be.true;
//       def.updateProperties(props => {
//         props.isBaby = true;
//       });
//       expect(def.hasBufferCache).to.be.false;
//     });

//     it("should uncache the owner", () => {
//       const owner = new MockOwner();
//       const def = ObjectDefinitionResource.from(tartosianoBuffer, {
//         owner,
//         saveBuffer: true
//       });

//       expect(owner.cached).to.be.true;
//       def.updateProperties(props => {
//         props.isBaby = true;
//       });
//       expect(owner.cached).to.be.false;
//     });
//   });

  //#endregion Methods
});
