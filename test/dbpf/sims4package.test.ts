import fs from "fs";
import path from "path";
import { unzipSync } from "zlib";
import { expect } from "chai";
import compare from "just-compare";
import type { ResourceKey } from "../../dst/lib/dbpf/shared";
import { Sims4Package, StringTableResource, TuningResource } from "../../dst/api";
import { TuningResourceType } from "../../dst/enum";

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string): Buffer {
  if (!cachedBuffers[filename]) {
    const filepath = path.resolve(__dirname, `../data/packages/${filename}.package`);
    cachedBuffers[filename] = fs.readFileSync(filepath);
  }

  return cachedBuffers[filename];
}

function getPackage(filename: string): Sims4Package {
  return Sims4Package.from(getBuffer(filename));
}

function getTestTuning(): TuningResource {
  return TuningResource.create({ content: `<I n="something">\n  <T n="value">50</T>\n</I>` });
}

function getTestKey(): ResourceKey {
  return { type: TuningResourceType.Trait, group: 456, instance: 789n };
}

//#endregion Helpers

describe("Sims4Package", () => {
  //#region Properties

  describe("#buffer", () => {
    it("should serialize a dbpf that is empty", () => {
      const original = Sims4Package.create();
      const dbpf = Sims4Package.from(original.buffer);
      expect(dbpf.size).to.equal(0);
    });

    it("should return the cached buffer if it wasn't changed", () => {
      const buffer = getBuffer("Trait");
      const dbpf = Sims4Package.from(buffer);
      expect(dbpf.buffer).to.equal(buffer);
    });

    it("should serialize a dbpf that wasn't changed, but was uncached", () => {
      const buffer = getBuffer("Trait");
      const original = Sims4Package.from(buffer);
      original.uncache();
      expect(original.buffer).to.not.equal(buffer);
      const dbpf = Sims4Package.from(original.buffer);
      expect(dbpf.equals(original)).to.be.true;
    });

    it("should serialize a dbpf that had entries added", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      const testKey = getTestKey();
      original.add(testKey, getTestTuning());
      const dbpf = Sims4Package.from(original.buffer);
      expect(dbpf.size).to.equal(3);
      expect(dbpf.get(2).keyEquals(testKey)).to.be.true;
      expect(dbpf.get(2).value.equals(getTestTuning())).to.be.true;
    });

    it("should serialize a dbpf that had entries removed", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      original.delete(0);
      const dbpf = Sims4Package.from(original.buffer);
      expect(dbpf.size).to.equal(1);
      const tuning = dbpf.get(0).value as TuningResource;
      expect(tuning.variant).to.equal("XML");
      expect(tuning.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
    });

    it("should serialize a dbpf that had entries mutated", () => {
      const original = getPackage("Trait");
      expect(original.size).to.equal(2);
      original.delete(0);
      const dbpf = Sims4Package.from(original.buffer);
      expect(dbpf.size).to.equal(1);
      const tuning = dbpf.get(0).value as TuningResource;
      expect(tuning.variant).to.equal("XML");
      expect(tuning.root.name).to.equal("frankkulak_LB:trait_SimlishNative");
    });
  });

  describe("#entries", () => {
    it("should return entries in an array", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      expect(entries).to.be.an('Array').with.lengthOf(4);
    });

    it("should not mutate the internal map", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      dbpf.entries.push(dbpf.get(0));
      expect(dbpf.size).to.equal(4);
    });

    it("should not uncache the model when mutated", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.isCached).to.be.true;
      dbpf.entries.push(dbpf.get(0));
      expect(dbpf.isCached).to.be.true;
    });

    it("should be the same object when accessed more than once without changes", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      expect(entries).to.equal(dbpf.entries);
    });

    it("should be a new object when an entry is added", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      const entry = dbpf.get(0);
      dbpf.add(entry.key, entry.value);
      expect(entries).to.not.equal(dbpf.entries);
    });

    it("should be a new object when an entry is deleted", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      dbpf.delete(0);
      expect(entries).to.not.equal(dbpf.entries);
    });

    it("should be a new object when an entry is mutated", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      dbpf.get(0).key.group++;
      expect(entries).to.not.equal(dbpf.entries);
    });
  });

  // #hasChanged tested by other tests

  // #isCached tested by other tests

  describe("#size", () => {
    it("should return 0 when the dbpf is empty", () => {
      const dbpf = getPackage("Empty");
      expect(dbpf.size).to.equal(0);
    });

    it("should return the number of entries in the dbpf", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
    });

    it("should increase by 1 after adding an entry", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      const testKey = getTestKey();
      dbpf.add(testKey, TuningResource.create());
      expect(dbpf.size).to.equal(5);
    });

    it("should decrease by 1 after deleting an entry", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      dbpf.delete(0);
      expect(dbpf.size).to.equal(3);
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("static#create()", () => {
    it("should create an empty dbpf if given list is empty", () => {
      const dbpf = Sims4Package.create();
      expect(dbpf.size).to.equal(0);
    });

    it("should create entries from the ones that are given", () => {
      const dbpf = Sims4Package.create([
        { key: getTestKey(), value: getTestTuning() }
      ]);

      expect(dbpf.size).to.equal(1);
      const entry = dbpf.get(0);
      expect(entry.keyEquals(getTestKey())).to.be.true;
      expect(entry.value.equals(getTestTuning())).to.be.true;
    });

    it("should assign itself as the owner of the given entries", () => {
      const dbpf = Sims4Package.create([
        { key: getTestKey(), value: getTestTuning() }
      ]);

      const entry = dbpf.get(0);
      expect(entry.owner).to.equal(dbpf);
    });

    it("should not be cached", () => {
      const dbpf = Sims4Package.create();
      expect(dbpf.isCached).to.be.false;
    });
  });

  describe("static#from()", () => {
    context("dbpf is valid", () => {
      it("should be cached", () => {
        // TODO:
      });

      it("should read empty dbpf", () => {
        // TODO:
      });

      it("should read dbpf with entries", () => {
        // TODO:
      });

      it("should have cached entries", () => {
        // TODO:
      });

      it("should have cached resources within its entries", () => {
        // TODO:
      });

      it("should read tuning resource correctly", () => {
        // TODO:
      });

      it("should read stbl resource correctly", () => {
        // TODO:
      });

      it("should read simdata resource correctly", () => {
        // TODO:
      });

      it("should read raw resource correctly", () => {
        // TODO:
      });

      it("should read other xml resource correctly", () => {
        // TODO:
      });

      it("should load all contents as raw if told to", () => {
        // TODO:
      });
    });

    context("dbpf header is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        // TODO:
      });

      it("should not throw if ignoreErrors = true", () => {
        // TODO:
      });

      it("should return return a regular DBPF", () => {
        // TODO:
      });
    });

    context("dbpf content is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        // TODO:
      });

      it("should throw even if ignoreErrors = true", () => {
        // TODO:
      });

      it("should return undefined if dontThrow = true", () => {
        // TODO:
      });
    });

    context("inner resource content is invalid", () => {
      it("should throw if ignoreErrors = false", () => {
        // TODO:
      });

      it("should throw even if ignoreErrors = true", () => {
        // TODO:
      });

      it("should contain an undefined resource if dontThrow = true", () => {
        // TODO:
      });

      it("should return a regular DBPF if loading as raw", () => {
        // TODO:
      });
    });
  });

  //#endregion Initialization

  //#region Public Methods

  describe("#add()", () => {
    it("should add the entry to an empty dbpf", () => {
      const dbpf = Sims4Package.create();
      expect(dbpf.size).to.equal(0);
      const resource = TuningResource.create();
      const testKey = getTestKey();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(1);
      expect(compare(dbpf.get(0).key, testKey)).to.be.true;
      expect(dbpf.get(0).value).to.equal(resource);
    });

    it("should add the entry to a dbpf with entries", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      const resource = TuningResource.create();
      const testKey = getTestKey();
      dbpf.add(testKey, resource);
      expect(dbpf.size).to.equal(5);
      expect(compare(dbpf.get(4).key, testKey)).to.be.true;
      expect(dbpf.get(4).value).to.equal(resource);
    });

    it("should add the key to the key map", () => {
      const dbpf = Sims4Package.create();
      const testKey = getTestKey();
      expect(dbpf.hasKey(testKey)).to.be.false;
      dbpf.add(testKey, TuningResource.create());
      expect(dbpf.hasKey(testKey)).to.be.true;
    });

    it("should uncache the buffer", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.isCached).to.be.true;
      const testKey = getTestKey();
      dbpf.add(testKey, TuningResource.create());
      expect(dbpf.isCached).to.be.false;
    });

    it("should not uncache other entries", () => {
      const dbpf = getPackage("CompleteTrait");

      dbpf.entries.forEach(entry => {
        expect(entry.isCached).to.be.true;
      });

      const testKey = getTestKey();
      dbpf.add(testKey, TuningResource.create());
      
      dbpf.entries.forEach(entry => {
        if (entry.keyEquals(testKey)) {
          expect(entry.isCached).to.be.false;
        } else {
          expect(entry.isCached).to.be.true;
        }
      });
    });
  });

  describe("#addAll()", () => {
    it("should add the given entries", () => {
      const dbpf = Sims4Package.create();

      expect(dbpf.size).to.equal(0);

      dbpf.addAll([
        {
          key: { type: 123, group: 456, instance: 789n },
          value: getTestTuning()
        },
        {
          key: { type: 321, group: 654, instance: 987n },
          value: StringTableResource.create([ { key: 1, value: "hi" } ])
        }
      ]);

      expect(dbpf.size).to.equal(2);
      expect(dbpf.get(0).key.type).to.equal(123);
      expect(dbpf.get(1).key.type).to.equal(321);
    });
  });

  describe("#clear()", () => {
    it("should delete all entries", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.size).to.equal(4);
      dbpf.clear();
      expect(dbpf.size).to.equal(0);
    });

    it("should reset the key map", () => {
      const dbpf = getPackage("CompleteTrait");
      const key = dbpf.get(0).key;
      expect(dbpf.hasKey(key)).to.be.true;
      dbpf.clear();
      expect(dbpf.hasKey(key)).to.be.false;
    });

    it("should uncache the buffer", () => {
      const dbpf = getPackage("CompleteTrait");
      expect(dbpf.isCached).to.be.true;
      dbpf.clear();
      expect(dbpf.isCached).to.be.false;
    });

    it("should reset the entries property", () => {
      const dbpf = getPackage("CompleteTrait");
      const entries = dbpf.entries;
      dbpf.clear();
      const newEntries = dbpf.entries;
      expect(newEntries).to.not.equal(entries);
      expect(newEntries).to.be.an('Array').that.is.empty;
    });

    it("should reset the ID counter", () => {
      const dbpf = getPackage("CompleteTrait");
      const entry = dbpf.get(3);
      dbpf.clear();
      dbpf.add(entry.key, entry.value);
      expect(dbpf.getIdForKey(entry.key)).to.equal(0);
    });
  });

  describe("#clone()", () => {
    it("should copy the entries", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.size).to.equal(2);
      const clone = dbpf.clone();
      expect(clone.size).to.equal(2);
      const [ simdata, tuning ] = clone.entries;
      expect(simdata.value.variant).to.equal("DATA");
      expect(simdata.equals(dbpf.get(0))).to.be.true;
      expect(tuning.value.variant).to.equal("XML");
      expect(tuning.equals(dbpf.get(1))).to.be.true;
    });

    it("should not mutate the original", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.size).to.equal(2);
      const clone = dbpf.clone();
      expect(clone.size).to.equal(2);
      const testKey = getTestKey();
      clone.add(testKey, getTestTuning());
      expect(clone.size).to.equal(3);
      expect(dbpf.size).to.equal(2);
    });

    it("should not mutate the original entries", () => {
      const dbpf = getPackage("Trait");
      const clone = dbpf.clone();
      clone.get(0).value = getTestTuning();
      expect(clone.get(0).value.variant).to.equal("XML");
      expect(dbpf.get(0).value.variant).to.equal("DATA");
    });

    it("should not mutate the original resources", () => {
      const dbpf = getPackage("Trait");
      const clone = dbpf.clone();
      const cloneTuning = clone.get(1).value as TuningResource;
      cloneTuning.content = "";
      const dbpfTuning = dbpf.get(1).value as TuningResource;
      expect(cloneTuning.content).to.equal("");
      expect(dbpfTuning.content).to.not.equal("");
    });

    it("should set itself as the owner of the new entries", () => {
      const dbpf = getPackage("Trait");
      const clone = dbpf.clone();
      clone.entries.forEach(entry => {
        expect(entry.owner).to.equal(clone);
      });
    });
  });

  describe("#delete()", () => {
    it("should delete the entry with the given ID", () => {
      const dbpf = getPackage("Trait");
      const key = dbpf.get(0).key;
      expect(dbpf.size).to.equal(2);
      expect(dbpf.getByKey(key)).to.not.be.undefined;
      dbpf.delete(0);
      expect(dbpf.size).to.equal(1);
      expect(dbpf.getByKey(key)).to.be.undefined;
    });

    it("should uncache the buffer", () => {
      const dbpf = getPackage("Trait");
      expect(dbpf.isCached).to.be.true;
      dbpf.delete(0);
      expect(dbpf.isCached).to.be.false;
    });

    it("should remove the key from the key map", () => {
      const dbpf = getPackage("Trait");
      const key = dbpf.get(0).key;
      expect(dbpf.hasKey(key)).to.be.true;
      dbpf.delete(0);
      expect(dbpf.hasKey(key)).to.be.false;
    });

    it("should update the ID in the key map if there is another entry with the same key", () => {
      const dbpf = getPackage("Trait");
      const key = dbpf.get(0).key;
      dbpf.get(1).key = key;
      expect(dbpf.hasKey(key)).to.be.true;
      expect(dbpf.getIdForKey(key)).to.equal(0);
      dbpf.delete(0);
      expect(dbpf.hasKey(key)).to.be.true;
      expect(dbpf.getIdForKey(key)).to.equal(1);
    });

    it("should reset the entries array", () => {
      const dbpf = getPackage("Trait");
      const entries = dbpf.entries;
      expect(entries).to.equal(dbpf.entries);
      dbpf.delete(0);
      expect(entries).to.not.equal(dbpf.entries);
    });
  });

  describe("#deleteByKey()", () => {
    it("should delete the entry with the given key", () => {
      // TODO:
    });
  });

  describe("#equals()", () => {
    it("should return true if dbpfs have the same entries", () => {
      // TODO:
    });

    it("should return false if an entry has a different key", () => {
      // TODO:
    });

    it("should return false if an entry has a different value", () => {
      // TODO:
    });
  });

  describe("#findRepeatedKeys()", () => {
    it("should be empty when there are no repeated keys", () => {
      // TODO:
    });

    it("should return all keys that are repeated", () => {
      // TODO:
    });
  });

  describe("#get()", () => {
    it("should return the entry with the given ID", () => {
      // TODO:
    });

    it("should return the same item for the same ID even if one before it is removed", () => {
      // TODO:
    });

    it("should return undefined if the given ID doesn't exist", () => {
      // TODO:
    });
  });

  describe("#getByKey()", () => {
    it("should return the entry with the given key", () => {
      // TODO:
    });

    it("should return an entry after adding it", () => {
      // TODO:
    });

    it("should return the correct entry after changing its key", () => {
      // TODO:
    });

    it("should return undefined after removing the entry", () => {
      // TODO:
    });

    it("should return the first entry with the given key if there are more than one", () => {
      // TODO:
    });

    it("should return undefined if the given key doesn't exist", () => {
      // TODO:
    });

    it("should return the correct entry if there are more than one entry with this key, and the first was deleted", () => {
      // TODO:
    });
  });

  describe("#getIdForKey()", () => {
    it("should return the ID for the given key", () => {
      // TODO:
    });

    it("should return the ID for the given key, even if it's another instance", () => {
      // TODO:
    });

    it("should return the first ID for the given key if there are more than one", () => {
      // TODO:
    });

    it("should return undefined after the entry with the key is deleted", () => {
      // TODO:
    });

    it("should return the ID for an entry after adding it", () => {
      // TODO:
    });
  });

  describe("#getIdsForKey()", () => {
    it("should return an empty array if no entries have this key", () => {
      // TODO:
    });

    it("should return the ID for the given key", () => {
      // TODO:
    });

    it("should return the ID for the given key, even if it's another instance", () => {
      // TODO:
    });

    it("should return all IDs for the given key", () => {
      // TODO:
    });
  });

  describe("#has()", () => {
    it("should return true if the ID is in the model", () => {
      // TODO:
    });

    it("should return true if the ID was not in the model but was added", () => {
      // TODO:
    });

    it("should return false if the ID is not in the model", () => {
      // TODO:
    });

    it("should return false if the ID was in the model but was removed", () => {
      // TODO:
    });
  });

  describe("#hasKey()", () => {
    it("should return true if the key is in the model", () => {
      // TODO:
    });

    it("should return true if a different instance, but identical, key is in the model", () => {
      // TODO:
    });

    it("should return true if the key was not in the model but was added", () => {
      // TODO:
    });

    it("should return false if the key is not in the model", () => {
      // TODO:
    });

    it("should return false if the key was in the model but was removed", () => {
      // TODO:
    });

    it("should return true if there are more than one entry with this key, and the first was deleted", () => {
      // TODO:
    });
  });

  describe("#resetEntries()", () => {
    it("should force the entries to make a new list", () => {
      // TODO:
    });
  });

  describe("#uncache()", () => {
    it("should uncache the buffer", () => {
      // TODO:
    });

    it("should notify the owner to uncache", () => {
      // TODO:
    });

    it("should reset the entries", () => {
      // TODO:
    });

    it("should not uncache the entries", () => {
      // TODO:
    });

    it("should not uncache the entries' resources", () => {
      // TODO:
    });
  });

  describe("#validate()", () => {
    it("should not throw if all entries are valid", () => {
      const dbpf = Sims4Package.create([
        {
          key: {
            type: 123,
            group: 456,
            instance: 789n
          },
          value: getTestTuning()
        },
        {
          key: {
            type: 321,
            group: 654,
            instance: 987n
          },
          value: StringTableResource.create([
            { key: 1, value: "hi" }
          ])
        }
      ]);

      expect(() => dbpf.validate()).to.not.throw();
    });

    it("should throw if at least one entry is not valid", () => {
      const dbpf = Sims4Package.create([
        {
          key: {
            type: -1,
            group: 456,
            instance: 789n
          },
          value: getTestTuning()
        },
        {
          key: {
            type: 321,
            group: 654,
            instance: 987n
          },
          value: StringTableResource.create([
            { key: 1, value: "hi" }
          ])
        }
      ]);

      expect(() => dbpf.validate()).to.throw();
    });

    it("should throw if there are multiple entries with the same key", () => {
      const dbpf = Sims4Package.create([
        {
          key: {
            type: 123,
            group: 456,
            instance: 789n
          },
          value: getTestTuning()
        },
        {
          key: {
            type: 123,
            group: 456,
            instance: 789n
          },
          value: StringTableResource.create([
            { key: 1, value: "hi" }
          ])
        }
      ]);

      expect(() => dbpf.validate()).to.throw();
    });
  });

  //#endregion Public Methods
});

describe("ResourceEntry", () => {
  //#region Properties

  describe("#buffer", () => {
    it("should serialize and compress the contained resource", () => {
      const tuning = getTestTuning();
      const dbpf = Sims4Package.create();
      const testKey = getTestKey();
      const entry = dbpf.add(testKey, tuning);
      const unzipped = unzipSync(entry.buffer).toString();
      expect(unzipped).to.equal(tuning.content);
    });

    it("should return the cached buffer if it wasn't changed", () => {
      const tuning = getTestTuning();
      const dbpf = Sims4Package.create();
      const testKey = getTestKey();
      const entry = dbpf.add(testKey, tuning);
      const buffer = entry.buffer;
      expect(buffer).to.equal(entry.buffer);
    });

    it("should return a new buffer if it was changed", () => {
      const tuning = getTestTuning();
      const dbpf = Sims4Package.create();
      const testKey = getTestKey();
      const entry = dbpf.add(testKey, tuning);
      const buffer = entry.buffer;
      (entry.value as TuningResource).content = "";
      expect(buffer).to.not.equal(entry.buffer);
    });
  });

  // #hasChanged tested by other tests

  describe("#key", () => {
    it("should uncache the dbpf when set", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      expect(dbpf.isCached).to.be.true;
      const testKey = getTestKey();
      entry.key = testKey;
      expect(dbpf.isCached).to.be.false;
    });

    it("should uncache the dbpf when mutated", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      expect(dbpf.isCached).to.be.true;
      entry.key.group = 0x80000000;
      expect(dbpf.isCached).to.be.false;
    });

    it("should not uncache the entry when mutated", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      expect(entry.isCached).to.be.true;
      entry.key.group = 0x80000000;
      expect(entry.isCached).to.be.true;
    });

    it("should not uncache the entry's resource when mutated", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      expect(entry.value.isCached).to.be.true;
      entry.key.group = 0x80000000;
      expect(entry.value.isCached).to.be.true;
    });
  });

  // #isCached tested by other tests

  describe("#value", () => {
    it("should uncache the dbpf when set", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(1);
      expect(dbpf.isCached).to.be.true;
      entry.value = getTestTuning();
      expect(dbpf.isCached).to.be.false;
    });

    it("should uncache the dbpf when mutated", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(1);
      expect(dbpf.isCached).to.be.true;
      (entry.value as TuningResource).content = "";
      expect(dbpf.isCached).to.be.false;
    });

    it("should uncache the entry when mutated", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(1);
      expect(entry.isCached).to.be.true;
      (entry.value as TuningResource).content = "";
      expect(entry.isCached).to.be.false;
    });

    it("should uncache the entry's resource when mutated", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(1);
      expect(entry.value.isCached).to.be.true;
      (entry.value as TuningResource).content = "";
      expect(entry.value.isCached).to.be.false;
    });
  });

  //#endregion Properties

  //#region Public Methods

  describe("#clone()", () => {
    it("should return an entry that is equal", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      const clone = entry.clone();
      expect(clone.value.variant).to.equal("DATA");
      expect(clone.equals(dbpf.get(0))).to.be.true;
    });

    it("should not mutate the original key", () => {
      const dbpf = getPackage("Trait");
      const tuningEntry = dbpf.get(1);
      const cloneEntry = tuningEntry.clone();
      cloneEntry.key.group = 0x80000000;
      expect(tuningEntry.key.group).to.equal(0);
      expect(cloneEntry.key.group).to.equal(0x80000000);
    });

    it("should not mutate the original resource", () => {
      const dbpf = getPackage("Trait");
      const tuningEntry = dbpf.get(1);
      const cloneEntry = tuningEntry.clone();
      (cloneEntry.value as TuningResource).content = "";
      expect((cloneEntry.value as TuningResource).content).to.equal("");
      expect((tuningEntry.value as TuningResource).content).to.not.equal("");
    });

    it("should not copy the owner", () => {
      const dbpf = getPackage("Trait");
      const simdataEntry = dbpf.get(0);
      const clone = simdataEntry.clone();
      expect(simdataEntry.owner).to.equal(dbpf);
      expect(clone.owner).to.be.undefined;
    });
  });

  describe("#equals()", () => {
    it("should return true when key and value are equal", () => {
      const dbpf = Sims4Package.create();
      const first = dbpf.add(getTestKey(), getTestTuning());
      const second = dbpf.add(getTestKey(), getTestTuning());
      expect(first.equals(second)).to.be.true;
    });

    it("should return false when key is different", () => {
      const dbpf = Sims4Package.create();
      const first = dbpf.add(getTestKey(), getTestTuning());
      const secondKey = getTestKey();
      secondKey.group++;
      const second = dbpf.add(secondKey, getTestTuning());
      expect(first.equals(second)).to.be.false;
    });

    it("should return false when value is different", () => {
      const dbpf = Sims4Package.create();
      const first = dbpf.add(getTestKey(), getTestTuning());
      const second = dbpf.add(getTestKey(), TuningResource.create());
      expect(first.equals(second)).to.be.false;
    });

    it("should return false when other is undefined", () => {
      const dbpf = Sims4Package.create();
      const entry = dbpf.add(getTestKey(), getTestTuning());
      expect(entry.equals(undefined)).to.be.false;
    });
  });

  describe("#keyEquals()", () => {
    it("should return true when key is the same object", () => {
      const dbpf = Sims4Package.create();

      const key = {
        type: 123,
        group: 456,
        instance: 789n
      };

      const entry = dbpf.add(key, TuningResource.create());
      expect(entry.keyEquals(key)).to.be.true;
    });

    it("should return true when key is a different object, but identical", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, TuningResource.create());

      expect(entry.keyEquals({
        type: 123,
        group: 456,
        instance: 789n
      })).to.be.true;
    });

    it("should return false when keys have different type", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, TuningResource.create());

      expect(entry.keyEquals({
        type: 0,
        group: 456,
        instance: 789n
      })).to.be.false;
    });

    it("should return false when keys have different group", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, TuningResource.create());

      expect(entry.keyEquals({
        type: 123,
        group: 0,
        instance: 789n
      })).to.be.false;
    });

    it("should return false when keys have different instance", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 123,
        group: 456,
        instance: 789n
      }, TuningResource.create());

      expect(entry.keyEquals({
        type: 123,
        group: 456,
        instance: 0n
      })).to.be.false;
    });
  });

  describe("#uncache()", () => {
    it("should uncache the owning dbpf", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      expect(dbpf.isCached).to.be.true;
      entry.uncache();
      expect(dbpf.isCached).to.be.false;
    });

    it("should reset the compressed buffer", () => {
      const dbpf = getPackage("Trait");
      const entry = dbpf.get(0);
      const buffer = entry.buffer;
      expect(entry.buffer).to.equal(buffer);
      entry.uncache();
      expect(entry.buffer).to.not.equal(buffer);
    });

    it("should not uncache other entries in the dbpf", () => {
      const dbpf = getPackage("Trait");
      const [ simdata, tuning ] = dbpf.entries;
      expect(tuning.isCached).to.be.true;
      expect(tuning.isCached).to.be.true;
      simdata.uncache();
      expect(simdata.isCached).to.be.false;
      expect(tuning.isCached).to.be.true;
    });

    it("should not uncache the contained resource", () => {
      const dbpf = getPackage("Trait");
      const [ simdata ] = dbpf.entries;
      expect(simdata.value.isCached).to.be.true;
      simdata.uncache();
      expect(simdata.value.isCached).to.be.true;
    });
  });

  describe("#validate()", () => {
    it("should not throw when key and resource are valid", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: 0n
      }, StringTableResource.create([
        { key: 1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.not.throw();
    });

    it("should throw if key type is negative", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: -1,
        group: 0,
        instance: 0n
      }, StringTableResource.create([
        { key: 1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key group is negative", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 0,
        group: -1,
        instance: 0n
      }, StringTableResource.create([
        { key: 1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key instance is negative", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: -1n
      }, StringTableResource.create([
        { key: 1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key type is > 32 bit", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 0x800000000,
        group: 0,
        instance: 0n
      }, StringTableResource.create([
        { key: 1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key group is > 32 bit", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0x800000000,
        instance: 0n
      }, StringTableResource.create([
        { key: 1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if key instance is > 64 bit", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: 0x80000000000000000n
      }, StringTableResource.create([
        { key: 1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.throw();
    });

    it("should throw if contained resource is invalid", () => {
      const dbpf = Sims4Package.create();

      const entry = dbpf.add({
        type: 0,
        group: 0,
        instance: 0x80000000000000000n
      }, StringTableResource.create([
        { key: -1, value: "hi" }
      ]));

      expect(() => entry.validate()).to.throw();
    });
  });

  //#endregion Public Methods
});
