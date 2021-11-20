const expect = require('chai').expect;
const hashing = require('../../dst/lib/utils/hashing');

function getTestFuncs(hashFn) {
  return {
    assertHashes(expectedHashes) {
      expectedHashes.forEach(([string, expectedValue]) => {
        it(`should return ${expectedValue} for "${string}"`, function() {
          expect(hashFn(string)).to.equal(expectedValue);
        });
      });
    },
    assertIgnoreCase() {
      it('should ignore case', function() {
        expect(hashFn('hello world')).to.equal(hashFn('HELLO WORLD'));
      });
    }
  }
}

describe('Hashing', function() {
  describe('#fnv24()', function() {
    const fns = getTestFuncs(value => hashing.fnv24(value));
    fns.assertIgnoreCase();
    fns.assertHashes([
      ['', 0x001C9D44],
      ['this is a string', 12795340],
      ['Hé110 : wør!D', 2405745]
    ]);
  });

  describe('#fnv32()', function() {
    const fns = getTestFuncs(value => hashing.fnv32(value));
    fns.assertIgnoreCase();
    fns.assertHashes([
      ['', 0x811C9DC5],
      ['this is a string', 1103314317],
      ['Hé110 : wør!D', 2133112078]
    ]);
  });

  describe('#fnv56()', function() {
    const fns = getTestFuncs(value => hashing.fnv56(value));
    fns.assertIgnoreCase();
    fns.assertHashes([
      ['', 0x00F29CE4842223EEn],
      ['this is a string', 45046755487557328n],
      ['Hé110 : wør!D', 7003673140831451n]
    ]);
  });

  describe('#fnv64()', function() {
    const fns = getTestFuncs(value => hashing.fnv64(value));
    fns.assertIgnoreCase();
    fns.assertHashes([
      ['', 0xCBF29CE484222325n],
      ['this is a string', 4440559991801161453n],
      ['Hé110 : wør!D', 17661114212433175598n]
    ]);
  });

  describe('#fnv32to24()', function() {
    it('should return 2405745 for 2133112078', function() {
      expect(hashing.fnv32to24(2133112078)).to.equal(2405745);
    });

    it('should return 1875268 for 2166136261', function() {
      expect(hashing.fnv32to24(2166136261)).to.equal(1875268);
    });
  });

  describe('#fnv64to56()', function() {
    it('should return 68289449647285230n for 14695981039346656037n', function() {
      expect(hashing.fnv64to56(14695981039346656037n)).to.equal(68289449647285230n);
    });

    it('should return 45046755487557328n for 4440559991801161453n', function() {
      expect(hashing.fnv64to56(4440559991801161453n)).to.equal(45046755487557328n);
    });
  });
});