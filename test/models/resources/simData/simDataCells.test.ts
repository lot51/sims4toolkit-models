import { expect } from "chai";
import { simDataCells } from "../../../../dst/api";
import { BinaryDecoder, BinaryEncoder } from "../../../../dst/lib/utils/encoding";

const cells = simDataCells;

describe("Cell", function() {
  describe("static#parseXmlNode()", function() {
    // TODO:
  });
});

describe("BooleanCell", function() {
  describe("#constructor", () => {
    it("should use the value that is given", () => {
      const cell = new cells.BooleanCell(true);
      expect(cell.value).to.be.true;
    });

    it("should have an undefined owner is none is given", () => {
      const cell = new cells.BooleanCell(true);
      expect(cell.owner).to.be.undefined;
    });

    it("should have an owner if one is given", () => {
      const owner = cells.VariantCell.getDefault();
      const cell = new cells.BooleanCell(true, owner);
      expect(cell.owner).to.equal(owner);
    });
  });

  describe("#clone()", () => {
    it("should not mutate the original", () => {
      const cell = new cells.BooleanCell(true);
      const clone = cell.clone();
      clone.value = false;
      expect(clone.value).to.be.false;
      expect(cell.value).to.be.true;
    });

    it("should not copy the owner", () => {
      const cell = new cells.BooleanCell(true);
      const owner = new cells.VariantCell(0, cell);
      const clone = cell.clone();
      expect(cell.owner).to.equal(owner);
      expect(clone.owner).to.be.undefined;
    });
  });

  describe("#encode()", () => {
    it("should write one byte", () => {
      const encoder = new BinaryEncoder(Buffer.alloc(1));
      const cell = new cells.BooleanCell(true);
      expect(encoder.tell()).to.equal(0);
      cell.encode(encoder);
      expect(encoder.tell()).to.equal(1);
    });

    it("should write 0 for false", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.BooleanCell(false);
      cell.encode(encoder);
      expect(buffer.readUInt8(0)).to.equal(0);
    });

    it("should write one byte", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      const cell = new cells.BooleanCell(true);
      cell.encode(encoder);
      expect(buffer.readUInt8(0)).to.equal(1);
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    it("should not throw", () => {
      const cell = new cells.BooleanCell(true);
      expect(() => cell.validate()).to.not.throw();
    });
  });

  describe("static#decode()", () => {
    it("should read 1 as true", () => {
      const buffer = Buffer.alloc(1);
      const encoder = new BinaryEncoder(buffer);
      encoder.uint8(1);
      const decoder = new BinaryDecoder(buffer);
      const cell = cells.BooleanCell.decode(decoder);
      expect(cell.value).to.be.true;
    });

    it("should read 0 as false", () => {
      const buffer = Buffer.alloc(1);
      const decoder = new BinaryDecoder(buffer);
      const cell = cells.BooleanCell.decode(decoder);
      expect(cell.value).to.be.false;
    });
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    it("should create a cell with a false value", () => {
      const cell = cells.BooleanCell.getDefault();
      expect(cell.value).to.be.false;
    });
  });
});

describe("TextCell", function() {
  describe("#clone()", () => {
    it("should copy the data type and value", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });
  });

  describe("#encode()", () => {
    context("data type === character", () => {
      it("should write 1 byte", () => {
        // TODO:
      });

      it("should write the character that is contained", () => {
        // TODO:
      });

      it("should throw if the byte length is > 1", () => {
        // TODO:
      });
    });

    context("data type === string", () => {
      it("should write the offset that is provided", () => {
        // TODO:
      });

      it("should throw if no offset is provided", () => {
        // TODO:
      });
    });

    context("data type === hashed string", () => {
      it("should write the offset that is provided", () => {
        // TODO:
      });

      it("should write the 32-bit hash of the string", () => {
        // TODO:
      });

      it("should throw if no offset is provided", () => {
        // TODO:
      });
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    context("data type === character", () => {
      it("should throw if the byte length is > 1", () => {
        // TODO:
      });

      it("should throw if the byte length is < 1", () => {
        // TODO:
      });

      it("should not throw if the byte length is = 1", () => {
        // TODO:
      });
    });

    context("data type === string/hashed string", () => {
      it("should throw if the byte length is < 1", () => {
        // TODO: is this actually the desired behavior? can't it just write a null offset?
      });

      it("should not throw if the byte length is >= 1", () => {
        // TODO:
      });
    });
  });

  describe("static#decode()", () => {
    context("data type === character", () => {
      it("should return a cell with a single character", () => {
        // TODO:
      });
    });

    context("data type === string", () => {
      it("should read an offset and the string at that offset", () => {
        // TODO:
      });
    });

    context("data type === hashed string", () => {
      it("should skip the hash, read an offset, and then read the string at that offset", () => {
        // TODO:
      });
    });
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    it("should return a cell with the given data type and an empty string", () => {
      // TODO:
    });
  });
});

describe("NumberCell", function() {
  describe("#clone()", () => {
    // TODO:
  });

  describe("#encode()", () => {
    context("data type === 8 bits", () => {
      // TODO:
    });

    context("data type === 16 bits", () => {
      // TODO:
    });

    context("data type === 36 bits", () => {
      // TODO:
    });
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    context("data type === 8 bits", () => {
      // TODO:
    });

    context("data type === 16 bits", () => {
      // TODO:
    });

    context("data type === 36 bits", () => {
      // TODO:
    });
  });

  describe("static#decode()", () => {
    context("data type === 8 bits", () => {
      // TODO:
    });

    context("data type === 16 bits", () => {
      // TODO:
    });

    context("data type === 36 bits", () => {
      // TODO:
    });
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("BigIntCell", function() {
  describe("#clone()", () => {
    // TODO:
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("ResourceKeyCell", function() {
  describe("#clone()", () => {
    // TODO:
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("Float2Cell", function() {
  describe("#clone()", () => {
    // TODO:
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("Float3Cell", function() {
  describe("#clone()", () => {
    // TODO:
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

describe("Float4Cell", function() {
  describe("#clone()", () => {
    // TODO:
  });

  describe("#encode()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("#validate()", () => {
    // TODO:
  });

  describe("static#decode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });

  describe("static#getDefault()", () => {
    // TODO:
  });
});

// TODO: ObjectCell, VectorCell, VariantCell
