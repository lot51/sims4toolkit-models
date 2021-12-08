const { expect } = require("chai");
const { nodes } = require("../../../dst/api");

const {
  TuningDocumentNode,
  TuningElementNode,
  TuningValueNode,
  TuningCommentNode
} = nodes;

describe('TuningDocumentNode', function() {
  const newNode = (root) => new TuningDocumentNode(root);

  describe('#constructor', function() {
    it('should not throw when no children are given', function () {
      expect(() => new TuningDocumentNode()).to.not.throw();
    });

    it('should add the root that is given', function () {
      const node = new TuningDocumentNode(new TuningValueNode(5));
      expect(node.numChildren).to.equal(1);
      expect(node.child.value).to.equal(5);
    });
  });

  describe('#from()', function() {
    it('should throw if the given XML contains multiple nodes at the root', function() {
      expect(() => TuningDocumentNode.from(`<T/><T/>`)).to.throw();
    });

    it('should not throw for multiple roots if told not to', function() {
      const doc = TuningDocumentNode.from(`<T/><T/>`, {
        allowMultipleRoots: true
      });

      expect(doc.numChildren).to.equal(2);
    });

    it('should parse comments', function() {
      const doc = TuningDocumentNode.from(`<!--This is a comment-->`);
      expect(doc.numChildren).to.equal(1);
      expect(doc.child.value).to.equal("This is a comment");
    });

    it('should parse number values as strings', function() {
      const doc = TuningDocumentNode.from(`<T>50</T>`);
      expect(doc.child.innerValue).to.equal("50");
    });

    it('should parse boolean values as strings', function() {
      const doc = TuningDocumentNode.from(`<T>True</T>`);
      expect(doc.child.innerValue).to.equal("True");
    });

    it('should parse strings', function() {
      const doc = TuningDocumentNode.from(`<T>something</T>`);
      expect(doc.child.innerValue).to.equal("something");
    });

    it('should parse nodes that contain other nodes', function() {
      const doc = TuningDocumentNode.from(`<I>
        <L>
          <T>foo</T>
          <T>bar</T>
        </L>
      </I>`);

      expect(doc.numChildren).to.equal(1);
      expect(doc.child.numChildren).to.equal(1);
      const list = doc.child.child;
      expect(list.children[0].innerValue).to.equal("foo");
      expect(list.children[1].innerValue).to.equal("bar");
    });

    it('should parse attributes', function() {
      const doc = TuningDocumentNode.from(`<M n="module" s="12345">
        <C n="Class">
          <T n="TUNABLE">50</T>
          <V n="VARIANT" t="disabled"/>
        </C>
      </M>`);

      const mod = doc.child;
      expect(mod.name).to.equal("module");
      expect(mod.id).to.equal("12345");
      const cls = mod.child;
      expect(cls.name).to.equal("Class");
      const [ tunable, variant ] = cls.children;
      expect(tunable.name).to.equal("TUNABLE");
      expect(variant.name).to.equal("VARIANT");
      expect(variant.type).to.equal("disabled");
    });

    it('should parse tags', function() {
      const doc = TuningDocumentNode.from(`<M n="module" s="12345">
        <C n="Class">
          <T n="TUNABLE">50</T>
          <V n="VARIANT" t="disabled"/>
        </C>
      </M>`);

      const mod = doc.child;
      expect(mod.tag).to.equal("M");
      const cls = mod.child;
      expect(cls.tag).to.equal("C");
      const [ tunable, variant ] = cls.children;
      expect(tunable.tag).to.equal("T");
      expect(variant.tag).to.equal("V");
    });

    it('should preserve order of nodes', function() {
      const doc = TuningDocumentNode.from(`<L>
        <T>5</T>
        <T>3</T>
        <T>1</T>
        <T>4</T>
        <T>2</T>
      </L>`);

      expect(doc.child.children[0].innerValue).to.equal("5");
      expect(doc.child.children[1].innerValue).to.equal("3");
      expect(doc.child.children[2].innerValue).to.equal("1");
      expect(doc.child.children[3].innerValue).to.equal("4");
      expect(doc.child.children[4].innerValue).to.equal("2");
    });
  });

  describe('#attributes', function() {
    it('should not be assignable', function () {
      const node = newNode();
      node.attributes = { n: "name" };
      expect(node.attributes).to.be.undefined;
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.attributes).to.be.undefined;
    });
  });

  describe('#child', function() {
    it('should be undefined if there are no children', function () {
      const node = newNode();
      expect(node.child).to.be.undefined;
    });

    it('should be the same as the first child', function () {
      const node = newNode(new TuningValueNode("hello"));
      expect(node.child.value).to.equal("hello");
    });

    it('should update the first child when set', function () {
      const node = newNode(new TuningValueNode("hello"));
      node.child = new TuningValueNode("new text");
      expect(node.child.value).to.equal("new text");
    });

    it('should add a child if there are none', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.child = new TuningValueNode("new text");
      expect(node.numChildren).to.equal(1);
      expect(node.child.value).to.equal("new text");
    });
  });

  describe('#children', function() {
    it('should not be assignable', function () {
      const node = newNode();
      node.children = [new TuningCommentNode("hi")];
      expect(node.children).to.be.empty;
    });

    it('should be an empty array if there are no children', function () {
      const node = newNode();
      expect(node.children).to.be.an('Array').that.is.empty;
    });

    it('should contain the root node', function () {
      const node = newNode(new TuningValueNode(1));
      expect(node.children.length).to.equal(1);
      expect(node.children[0].value).to.equal(1);
    });

    it('should allow you to push without throwing', function () {
      const node = newNode();
      node.children.push(new TuningValueNode("hi"), new TuningValueNode("bye"));
      expect(node.numChildren).to.equal(2);
    });
  });

  describe('#hasChildren', function() {
    it('should not be assignable', function () {
      const node = newNode();
      node.hasChildren = false;
      expect(node.hasChildren).to.be.true;
    });

    it('should return true when it has children', function () {
      const node = newNode(newNode(), newNode());
      expect(node.hasChildren).to.be.true;
    });

    it('should return true when it does not have children', function () {
      // this test is not a typo, the hasChildren getter returns if there is
      // a children ARRAY -- it does not have to have any items in it
      const node = newNode();
      expect(node.hasChildren).to.be.true;
    });
  });

  describe('#id', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.id = 123).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });
  });

  describe('#innerValue', function() {
    it('should be undefined if there are no children', function () {
      const node = newNode();
      expect(node.innerValue).to.be.undefined;
    });

    it('should be undefined if the first child is an element', function () {
      const node = newNode(new TuningElementNode({ tag: 'I' }));
      expect(node.innerValue).to.be.undefined;
    });

    it('should be the value of the first child if it is a value node', function () {
      const node = newNode(new TuningValueNode(123n));
      expect(node.innerValue).to.equal(123n);
    });

    it('should be the value of the text of the first child if it is a comment', function () {
      const node = newNode(new TuningCommentNode("This is a comment."));
      expect(node.innerValue).to.equal("This is a comment.");
    });

    it('should throw when setting if the first child cannot have a value', function () {
      const node = newNode(new TuningElementNode({ tag: 'I' }));
      expect(() => node.innerValue = 123n).to.throw();
    });

    it('should set the value of the first child if it can have a value', function () {
      const child = new TuningValueNode(123n);
      const node = newNode(child);
      node.innerValue = 456n;
      expect(child.value).to.equal(456n);
    });

    it('should create a new value node child if there are no children', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.innerValue = 123n;
      expect(node.numChildren).to.equal(1);
      expect(node.child.value).to.equal(123n);
    });
  });

  describe('#name', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.name = "name").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.name).to.be.undefined;
    });
  });

  describe('#numChildren', function() {
    it('should not be assignable', function () {
      const node = newNode();
      node.numChildren = 5
      expect(node.numChildren).to.equal(0);
    });

    it('should return 0 when there are no children', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
    });

    it('should return 1 when there is one root', function () {
      const node = newNode(new TuningValueNode(123n));
      expect(node.numChildren).to.equal(1);
    });
  });

  describe('#tag', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.tag = "T").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.tag).to.be.undefined;
    });
  });

  describe('#type', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.type = "enabled").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.type).to.be.undefined;
    });
  });

  describe('#value', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.value = "test").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.value).to.be.undefined;
    });
  });

  describe('#addChildren()', function() {
    it('should do nothing when no children are given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addChildren();
      expect(node.numChildren).to.equal(0);
    });

    it('should add the one child that is given if the node is empty', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addChildren(new TuningValueNode("hi"));
      expect(node.numChildren).to.equal(1);
      expect(node.children[0].value).to.equal("hi");
    });

    it('should throw if given more than one child', function () {
      const node = newNode();
      expect(() => node.addChildren(new TuningValueNode("hi"), new TuningValueNode("bye"))).to.throw();
    });

    it('should throw if there is already a child', function () {
      const node = newNode(new TuningValueNode("hi"));
      expect(() => node.addChildren(new TuningValueNode("bye"))).to.throw();
    });

    it('should mutate the original children', function () {
      const node = newNode();
      const child = new TuningValueNode(123n);
      node.addChildren(child);
      node.innerValue = 456n;
      expect(child.value).to.equal(456n);
    });
  });

  describe('#addClones()', function() {
    it('should do nothing when no children are given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addClones();
      expect(node.numChildren).to.equal(0);
    });

    it('should add the one child that is given if there are none', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addClones(new TuningValueNode("hi"));
      expect(node.numChildren).to.equal(1);
      expect(node.children[0].value).to.equal("hi");
    });

    it('should throw if more than one child is given', function () {
      const node = newNode();
      expect(() => node.addClones(new TuningValueNode("hi"), new TuningValueNode("bye"))).to.throw();
    });

    it('should throw if there is already a child', function () {
      const node = newNode(new TuningValueNode("hi"));
      expect(() => node.addClones(new TuningValueNode("bye"))).to.throw();
    });

    it('should not mutate the original children', function () {
      const node = newNode();
      const child = new TuningValueNode(123n);
      node.addClones(child);
      node.innerValue = 456n;
      expect(child.value).to.equal(123n);
    });
  });

  describe('#clone()', function() {
    it('should return a new, empty document node if there are no children', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      const clone = node.clone();
      expect(clone.numChildren).to.equal(0);
    });

    it('should return a new document node with root node', function () {
      const node = newNode(new TuningValueNode(5));
      expect(node.numChildren).to.equal(1);
      const clone = node.clone();
      expect(clone.numChildren).to.equal(1);
      expect(clone.children[0].value).to.equal(5);
    });

    it('should not mutate the children array of the original', function () {
      const node = newNode();
      const clone = node.clone();
      expect(node.numChildren).to.equal(0);
      expect(clone.numChildren).to.equal(0);
      clone.innerValue = 5;
      expect(node.numChildren).to.equal(0);
      expect(clone.numChildren).to.equal(1);
    });

    it('should not mutate the individual children of the original', function () {
      const node = newNode(new TuningValueNode(5));
      const clone = node.clone();
      expect(node.innerValue).to.equal(5);
      expect(clone.innerValue).to.equal(5);
      clone.innerValue = 10;
      expect(node.innerValue).to.equal(5);
      expect(clone.innerValue).to.equal(10);
    });
  });

  describe('#deepSort()', function() {
    it("should sort child's children", function() {
      const node = newNode(
        new TuningElementNode({
          tag: 'L',
          attributes: { n: "list" },
          children: [
            new TuningElementNode({ tag: 'T', attributes: { n: "b" } }),
            new TuningElementNode({ tag: 'T', attributes: { n: "a" } }),
            new TuningElementNode({ tag: 'T', attributes: { n: "c" } })
          ]
        })
      );

      node.deepSort();
      expect(node.child.children[0].name).to.equal("a");
      expect(node.child.children[1].name).to.equal("b");
      expect(node.child.children[2].name).to.equal("c");
    });
  });

  describe('#sort()', function() {
    it('should sort in alphabetical order by name if no fn passed in', function() {
      const node = newNode();
      node.children.push(
        new TuningElementNode({ tag: 'T', attributes: { n: "c" } }),
        new TuningElementNode({ tag: 'T', attributes: { n: "a" } }),
        new TuningElementNode({ tag: 'T', attributes: { n: "d" } }),
        new TuningElementNode({ tag: 'T', attributes: { n: "b" } })
      );

      node.sort();
      expect(node.children[0].name).to.equal('a');
      expect(node.children[1].name).to.equal('b');
      expect(node.children[2].name).to.equal('c');
      expect(node.children[3].name).to.equal('d');
    });

    it('should sort children according to the given function', function() {
      const node = newNode();
      node.children.push(
        new TuningElementNode({
          tag: 'T',
          attributes: { n: "ten" },
          children: [ new TuningValueNode(10) ]
        }),
        new TuningElementNode({
          tag: 'T',
          attributes: { n: "one" },
          children: [ new TuningValueNode(1) ]
        }),
        new TuningElementNode({
          tag: 'T',
          attributes: { n: "five" },
          children: [ new TuningValueNode(5) ]
        })
      );

      node.sort((a, b) => a.innerValue - b.innerValue);
      expect(node.children[0].name).to.equal('one');
      expect(node.children[1].name).to.equal('five');
      expect(node.children[2].name).to.equal('ten');
    });

    it("should not change the order of childrens' children", function() {
      const node = newNode(
        new TuningElementNode({
          tag: 'L',
          attributes: { n: "list" },
          children: [
            new TuningElementNode({ tag: 'T', attributes: { n: "b" } }),
            new TuningElementNode({ tag: 'T', attributes: { n: "a" } }),
            new TuningElementNode({ tag: 'T', attributes: { n: "c" } })
          ]
        })
      );

      node.sort();
      expect(node.child.children[0].name).to.equal("b");
      expect(node.child.children[1].name).to.equal("a");
      expect(node.child.children[2].name).to.equal("c");
    });
  });

  describe('#toXml()', function() {
    const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>';

    it('should not indent if the given number is 0', function () {
      const node = newNode();
      expect(node.toXml()).to.equal(XML_DECLARATION);
    });

    it('should use a default indentation of 2 spaces', function () {
      const node = newNode();
      expect(node.toXml({ indents: 1 })).to.equal(`  ${XML_DECLARATION}`);
    });

    it('should use the number of spaces that are provided', function () {
      const node = newNode();
      expect(node.toXml({
        indents: 1,
        spacesPerIndent: 4
      })).to.equal(`    ${XML_DECLARATION}`);
    });

    it('should just return an XML declaration when there are no children', function () {
      const node = newNode();
      expect(node.toXml()).to.equal(XML_DECLARATION);
    });

    it('should write root on its own line', function () {
      const node = newNode(
        new TuningElementNode({
          tag: 'M',
          attributes: {
            n: "module.name",
            s: 12345n
          },
          children: [
            new TuningElementNode({
              tag: 'C',
              attributes: { n: "ClassName" },
              children: [
                new TuningElementNode({
                  tag: 'T',
                  attributes: { n: "SOMETHING" },
                  children: [ new TuningValueNode(10) ]
                })
              ]
            })
          ]
        })
      );

      expect(node.toXml()).to.equal(`${XML_DECLARATION}
<M n="module.name" s="12345">
  <C n="ClassName">
    <T n="SOMETHING">10</T>
  </C>
</M>`);
    });
  });
});

describe('TuningElementNode', function() {
  const newNode = (tag = "T") => new TuningElementNode({ tag });

  describe('#constructor', function() {
    it('should throw when no tag is given', function () {
      expect(() => new TuningElementNode()).to.throw();
    });

    it('should throw when tag is an empty string', function () {
      expect(() => new TuningElementNode({ tag: '' })).to.throw();
    });

    it('should create a new node with just a tag', function () {
      expect(new TuningElementNode({ tag: 'T' })).to.not.be.undefined;
    });

    it('should create a new node with all of the given values', function () {
      const node = new TuningElementNode({
        tag: 'L',
        attributes: { n: "list" },
        children: [ new TuningValueNode(15) ]
      });

      expect(node.tag).to.equal('L');
      expect(node.name).to.equal('list');
      expect(node.children).to.be.an('Array').with.lengthOf(1);
      expect(node.child.value).to.equal(15);
    });
  });

  describe('#attributes', function() {
    it('should not be assignable', function () {
      const node = newNode();
      node.attributes = { n: "name" };
      expect(node.attributes.n).to.be.undefined;
    });

    it('should not be undefined when there are no attributes', function () {
      const node = newNode();
      expect(node.attributes).to.not.be.undefined;
    });

    it('should allow mutation', function () {
      const node = new TuningElementNode({
        tag: 'T',
        attributes: { n: "name", t: "enabled" }
      });

      expect(node.attributes.t).to.equal("enabled");
      node.attributes.t = "disabled";
      expect(node.attributes.t).to.equal("disabled");
    });
  });

  describe('#child', function() {
    it('should be undefined if there are no children', function () {
      const node = newNode();
      expect(node.child).to.be.undefined;
    });

    it('should be the same as the first child', function () {
      const node = newNode();
      node.addChildren(new TuningValueNode("hello"));
      expect(node.child.value).to.equal("hello");
    });

    it('should update the first child when set', function () {
      const node = newNode();
      node.addChildren(new TuningValueNode("hello"));
      expect(node.child.value).to.equal("hello");
      node.child = new TuningValueNode("new text");
      expect(node.child.value).to.equal("new text");
    });

    it('should add a child if there are none', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.child = new TuningValueNode("new text");
      expect(node.numChildren).to.equal(1);
      expect(node.child.value).to.equal("new text");
    });
  });

  describe('#children', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      node.children = [newNode()];
      expect(node.children)
    });

    it('should be an empty array if there are no children', function () {
      const node = newNode();
      expect(node.children).to.be.an('Array').that.is.empty;
    });

    it('should contain all of this node\'s children', function () {
      const node = newNode();
      node.addChildren(new TuningValueNode(1), new TuningValueNode(2));
      expect(node.children.length).to.equal(2);
      expect(node.children[0].value).to.equal(1);
      expect(node.children[1].value).to.equal(2);
    });
  });

  describe('#hasChildren', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.children = []).to.throw();
    });

    it('should return true when it has children', function () {
      const node = newNode(newNode(), newNode());
      expect(node.hasChildren).to.be.true;
    });

    it('should return true when it does not have children', function () {
      // this test is not a typo, the hasChildren getter returns if there is
      // a children ARRAY -- it does not have to have any items in it
      const node = newNode();
      expect(node.hasChildren).to.be.true;
    });
  });

  describe('#id', function() {
    it('should return undefined if there is no `s` attribute', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });

    it('should return the value of the `s` attribute', function () {
      const node = new TuningElementNode({
        tag: 'I',
        attributes: { s: 123n }
      });

      expect(node.id).to.equal(123n)
    });

    it('should change the value of the `s` attribute', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
      node.id = 123n;
      expect(node.id).to.equal(123n)
    });
  });

  describe('#innerValue', function() {
    it('should be undefined if there are no children', function () {
      const node = newNode();
      expect(node.innerValue).to.be.undefined;
    });

    it('should be undefined if the first child is an element', function () {
      const node = newNode('L');
      node.addChildren(new TuningElementNode({ tag: 'T' }));
      expect(node.innerValue).to.be.undefined;
    });

    it('should be the value of the first child if it is a value node', function () {
      const node = newNode();
      node.addChildren(new TuningValueNode(123n));
      expect(node.innerValue).to.equal(123n);
    });

    it('should be the value of the text of the first child if it is a comment', function () {
      const node = newNode();
      node.child = new TuningCommentNode("This is a comment.");
      expect(node.innerValue).to.equal("This is a comment.");
    });

    it('should throw when setting if the first child cannot have a value', function () {
      const node = newNode();
      node.addChildren(new TuningElementNode({ tag: 'T' }));
      expect(() => node.innerValue = 123n).to.throw();
    });

    it('should set the value of the first child if it can have a value', function () {
      const node = new TuningElementNode({
        tag: 'T',
        children: [ new TuningValueNode(123) ]
      });

      expect(node.child.value).to.equal(123);
      node.innerValue = 456;
      expect(node.child.value).to.equal(456);
    });

    it('should create a new value node child if there are no children', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.innerValue = 123n;
      expect(node.numChildren).to.equal(1);
      expect(node.child.value).to.equal(123n);
    });
  });

  describe('#name', function() {
    it('should return undefined if there is no `n` attribute', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });

    it('should return the value of the `n` attribute', function () {
      const node = new TuningElementNode({
        tag: 'T',
        attributes: { n: "name" }
      });

      expect(node.name).to.equal("name")
    });

    it('should change the value of the `n` attribute', function () {
      const node = newNode();
      expect(node.name).to.be.undefined;
      node.name = "name";
      expect(node.name).to.equal("name")
    });
  });

  describe('#numChildren', function() {
    it('should return 0 if there are no children', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
    });

    it('should return number of children if there are any', function () {
      const node = new TuningElementNode({
        tag: 'L',
        children: [
          new TuningCommentNode("first"),
          new TuningCommentNode("second"),
          new TuningCommentNode("third")
        ]
      });

      expect(node.numChildren).to.equal(3);
      node.addChildren(new TuningCommentNode("fourth"));
      expect(node.numChildren).to.equal(4);
    });
  });

  describe('#tag', function() {
    it('should be the tag of this node', function () {
      const node = new TuningElementNode({ tag: 'T' });
      expect(node.tag).to.equal('T');
    });

    it('should set the tag of this node', function () {
      const node = new TuningElementNode({ tag: 'T' });
      node.tag = 'L';
      expect(node.tag).to.equal('L');
    });
  });

  describe('#type', function() {
    it('should return undefined if there is no `t` attribute', function () {
      const node = newNode();
      expect(node.type).to.be.undefined;
    });

    it('should return the value of the `t` attribute', function () {
      const node = new TuningElementNode({ tag: 'T', attributes: { t: "enabled" } });
      expect(node.type).to.equal("enabled")
    });

    it('should change the value of the `t` attribute', function () {
      const node = new TuningElementNode({ tag: 'V', attributes: { t: "disabled" } });
      expect(node.type).to.equal("disabled")
      node.type = "enabled";
      expect(node.type).to.equal("enabled")
    });
  });

  describe('#value', function() {
    it('should be undefined', function () {
      const node = newNode();
      expect(node.value).to.be.undefined;
    });

    it('should throw when setting', function () {
      const node = newNode();
      expect(() => node.value = 1).to.throw();
    });
  });

  describe('#addChildren()', function() {
    it('should do nothing when no children are given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addChildren();
      expect(node.numChildren).to.equal(0);
    });

    it('should add the one child that is given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addChildren(new TuningValueNode("hi"));
      expect(node.numChildren).to.equal(1);
      expect(node.children[0].value).to.equal("hi");
    });

    it('should add all children that are given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addChildren(new TuningValueNode("hi"), new TuningValueNode("bye"));
      expect(node.numChildren).to.equal(2);
      expect(node.children[0].value).to.equal("hi");
      expect(node.children[1].value).to.equal("bye");
    });

    it('should mutate the original children', function () {
      const node = newNode();
      const child = new TuningValueNode(123n);
      node.addChildren(child);
      node.innerValue = 456n;
      expect(child.value).to.equal(456n);
    });
  });

  describe('#addClones()', function() {
    it('should do nothing when no children are given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addClones();
      expect(node.numChildren).to.equal(0);
    });

    it('should add the one child that is given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addClones(new TuningValueNode("hi"));
      expect(node.numChildren).to.equal(1);
      expect(node.children[0].value).to.equal("hi");
    });

    it('should add all children that are given', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      node.addClones(new TuningValueNode("hi"), new TuningValueNode("bye"));
      expect(node.numChildren).to.equal(2);
      expect(node.children[0].value).to.equal("hi");
      expect(node.children[1].value).to.equal("bye");
    });

    it('should not mutate the original children', function () {
      const node = newNode();
      const child = new TuningValueNode(123n);
      node.addClones(child);
      node.innerValue = 456n;
      expect(child.value).to.equal(123n);
    });
  });

  describe('#clone()', function() {
    it('should return a new, empty document node if there are no children', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
      const clone = node.clone();
      expect(clone.numChildren).to.equal(0);
    });

    it('should return a new document node with all children', function () {
      const node = newNode();
      node.addChildren(new TuningValueNode(5), new TuningCommentNode("hi"));
      expect(node.numChildren).to.equal(2);
      const clone = node.clone();
      expect(clone.numChildren).to.equal(2);
      expect(clone.children[0].value).to.equal(5);
      expect(clone.children[1].value).to.equal("hi");
    });

    it('should not mutate the children array of the original', function () {
      const node = newNode();
      const clone = node.clone();
      expect(node.numChildren).to.equal(0);
      expect(clone.numChildren).to.equal(0);
      clone.innerValue = 5;
      expect(node.numChildren).to.equal(0);
      expect(clone.numChildren).to.equal(1);
    });

    it('should not mutate the individual children of the original', function () {
      const node = newNode();
      node.addChildren(new TuningValueNode(5));
      const clone = node.clone();
      expect(node.innerValue).to.equal(5);
      expect(clone.innerValue).to.equal(5);
      clone.innerValue = 10;
      expect(node.innerValue).to.equal(5);
      expect(clone.innerValue).to.equal(10);
    });
  });

  describe('#deepSort()', function() {
    it("should sort childrens' children", function() {
      const node = new TuningElementNode({
        tag: 'U',
        children: [
          new TuningElementNode({
            tag: 'L',
            attributes: { n: "list_b" },
            children: [
              new TuningElementNode({ tag: 'T', attributes: { n: "b" } }),
              new TuningElementNode({ tag: 'T', attributes: { n: "a" } }),
              new TuningElementNode({ tag: 'T', attributes: { n: "c" } })
            ]
          }),
          new TuningElementNode({
            tag: 'L',
            attributes: { n: "list_a" },
            children: [
              new TuningElementNode({ tag: 'T', attributes: { n: "b" } }),
              new TuningElementNode({ tag: 'T', attributes: { n: "a" } }),
              new TuningElementNode({ tag: 'T', attributes: { n: "c" } })
            ]
          })
        ]
      });

      node.deepSort();
      const [ first, second ] = node.children;
      expect(first.name).to.equal("list_a");
      expect(first.children[0].name).to.equal("a");
      expect(first.children[1].name).to.equal("b");
      expect(first.children[2].name).to.equal("c");
      expect(second.name).to.equal("list_b");
      expect(second.children[0].name).to.equal("a");
      expect(second.children[1].name).to.equal("b");
      expect(second.children[2].name).to.equal("c");
    });
  });

  describe('#sort()', function() {
    it('should sort in alphabetical order by name if no fn passed in', function() {
      const node = new TuningElementNode({
        tag: "L",
        children: [
          new TuningElementNode({ tag: 'T', attributes: { n: "c" } }),
          new TuningElementNode({ tag: 'T', attributes: { n: "a" } }),
          new TuningElementNode({ tag: 'T', attributes: { n: "d" } }),
          new TuningElementNode({ tag: 'T', attributes: { n: "b" } })
        ]
      });

      node.sort();
      expect(node.children[0].name).to.equal('a');
      expect(node.children[1].name).to.equal('b');
      expect(node.children[2].name).to.equal('c');
      expect(node.children[3].name).to.equal('d');
    });

    it('should sort children according to the given function', function() {
      const node = new TuningElementNode({
        tag: "L",
        children: [
          new TuningElementNode({
            tag: 'T',
            attributes: { n: "ten" },
            children: [ new TuningValueNode(10) ]
          }),
          new TuningElementNode({
            tag: 'T',
            attributes: { n: "one" },
            children: [ new TuningValueNode(1) ]
          }),
          new TuningElementNode({
            tag: 'T',
            attributes: { n: "five" },
            children: [ new TuningValueNode(5) ]
          })
        ]
      });

      node.sort((a, b) => a.innerValue - b.innerValue);
      expect(node.children[0].name).to.equal('one');
      expect(node.children[1].name).to.equal('five');
      expect(node.children[2].name).to.equal('ten');
    });

    it("should not change the order of childrens' children", function() {
      const node = new TuningElementNode({
        tag: "L",
        children: [
          new TuningElementNode({
            tag: 'L',
            attributes: { n: "list" },
            children: [
              new TuningElementNode({ tag: 'T', attributes: { n: "b" } }),
              new TuningElementNode({ tag: 'T', attributes: { n: "a" } }),
              new TuningElementNode({ tag: 'T', attributes: { n: "c" } })
            ]
          })
        ]
      });

      node.sort();
      expect(node.child.children[0].name).to.equal("b");
      expect(node.child.children[1].name).to.equal("a");
      expect(node.child.children[2].name).to.equal("c");
    });

    it("should not do anything when no children have names", function() {
      const node = new TuningElementNode({
        tag: "L",
        children: [
          new TuningElementNode({ tag: "T" }),
          new TuningElementNode({ tag: "L" }),
          new TuningElementNode({ tag: "U" })
        ]
      });

      node.sort();
      expect(node.children[0].tag).to.equal("T");
      expect(node.children[1].tag).to.equal("L");
      expect(node.children[2].tag).to.equal("U");
    });
  });

  describe('#toXml()', function() {
    it('should not indent by default', function () {
      const node = newNode();
      expect(node.toXml()).to.equal(`<T/>`);
    });

    it('should use two spaces by default', function () {
      const node = newNode();
      expect(node.toXml({ indents: 1 })).to.equal(`  <T/>`);
    });

    it('should use the given number of spaces', function () {
      const node = newNode();
      expect(node.toXml({
        indents: 1,
        spacesPerIndent: 4
      })).to.equal(`    <T/>`);
    });

    it('should write attributes when there are children', function() {
      const node = new TuningElementNode({
        tag: 'T',
        attributes: { n: "something" },
        children: [ new TuningValueNode(50) ]
      });

      expect(node.toXml()).to.equal(`<T n="something">50</T>`);
    });

    it('should write attributes when there are no children', function() {
      const node = new TuningElementNode({
        tag: 'T',
        attributes: { n: "something" }
      });

      expect(node.toXml()).to.equal(`<T n="something"/>`);
    });

    it('should write open/close tags if there are children', function() {
      const node = new TuningElementNode({
        tag: 'T',
        children: [ new TuningValueNode(50) ]
      });

      expect(node.toXml()).to.equal(`<T>50</T>`);
    });

    it('should write one tag if there are no children', function() {
      const node = new TuningElementNode({
        tag: 'T'
      });

      expect(node.toXml()).to.equal(`<T/>`);
    });

    it('should be on one line if there is one value child', function() {
      const node = new TuningElementNode({
        tag: 'T',
        children: [ new TuningValueNode(50) ]
      });

      expect(node.toXml()).to.equal(`<T>50</T>`);
    });

    it('should be on one line if there are two value/comment children', function() {
      const node = new TuningElementNode({
        tag: 'T',
        children: [ new TuningValueNode(50), new TuningCommentNode("hi") ]
      });

      expect(node.toXml()).to.equal(`<T>50<!--hi--></T>`);
    });

    it('should put an element child on its own line, indented', function() {
      const node = new TuningElementNode({
        tag: 'L',
        children: [
          new TuningElementNode({
            tag: 'T',
            children: [
              new TuningValueNode(123)
            ]
          })
        ]
      });

      expect(node.toXml()).to.equal(`<L>\n  <T>123</T>\n</L>`);
    });

    it('should increase indentation by 1 for each recursive call', function() {
      const node = new TuningElementNode({
        tag: 'L',
        children: [
          new TuningElementNode({
            tag: 'U',
            children: [
              new TuningElementNode({
                tag: 'T',
                attributes: { n: 'first' },
                children: [ new TuningValueNode(123) ]
              }),
              new TuningElementNode({
                tag: 'T',
                attributes: { n: 'second' },
                children: [ new TuningValueNode(456) ]
              })
            ]
          })
        ]
      });

      expect(node.toXml()).to.equal(`<L>
  <U>
    <T n="first">123</T>
    <T n="second">456</T>
  </U>
</L>`);
    });
  });
});

describe('TuningValueNode', function() {
  const newNode = (value = "test") => new TuningValueNode(value);

  describe('#constructor', function() {
    it('should throw when no value is given', function () {
      expect(() => new TuningValueNode()).to.throw();
    });

    it('should use the value that is given', function () {
      const node1 = new TuningValueNode("hello");
      expect(node1.value).to.equal("hello");
      const node2 = new TuningValueNode(123n);
      expect(node2.value).to.equal(123n);
    });
  });

  describe('#attributes', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.attributes = {}).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.attributes).to.be.undefined;
    });
  });

  describe('#child', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.child = newNode()).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.child).to.be.undefined;
    });
  });

  describe('#children', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.children = []).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.children).to.be.undefined;
    });
  });

  describe('#hasChildren', function() {
    it('should be false', function () {
      const node = newNode();
      expect(node.hasChildren).to.be.false;
    });
  });

  describe('#id', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.id = 123n).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });
  });

  describe('#innerValue', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.innerValue = 123n).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.innerValue).to.be.undefined;
    });
  });

  describe('#name', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.name = "name").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.name).to.be.undefined;
    });
  });

  describe('#numChildren', function() {
    it('should be 0', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
    });
  });

  describe('#tag', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.tag = "tag").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.tag).to.be.undefined;
    });
  });

  describe('#type', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.type = "enabled").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.type).to.be.undefined;
    });
  });

  describe('#value', function() {
    it('should change the value when set', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
      node.value = "goodbye";
      expect(node.value).to.equal("goodbye");
    });

    it('should return the current value', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
    });
  });

  describe('#addChildren()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addChildren()).to.throw();
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addChildren(newNode(), newNode())).to.throw();
    });
  });

  describe('#addClones()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addClones()).to.throw();
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addClones(newNode(), newNode())).to.throw();
    });
  });

  describe('#clone()', function() {
    it('should return a new node with the same value as this one', function () {
      const node = newNode();
      expect(node.value).to.equal("test");
      const clone = node.clone();
      expect(clone.value).to.equal("test");
    });

    it('should not mutate the original', function () {
      const node = newNode();
      const clone = node.clone();
      expect(node.value).to.equal("test");
      expect(clone.value).to.equal("test");
      clone.value = 123n;
      expect(node.value).to.equal("test");
      expect(clone.value).to.equal(123n);
    });
  });

  describe('#deepSort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.deepSort()).to.throw();
    });
  });

  describe('#sort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.sort()).to.throw();
    });
  });

  describe('#toXml()', function() {
    it('should not indent if the given number is 0', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('test');
    });

    it('should use a default indentation of 2 spaces', function () {
      const node = newNode();
      expect(node.toXml({ indents: 1 })).to.equal('  test');
    });

    it('should use the number of spaces that are provided', function () {
      const node = newNode();
      expect(node.toXml({
        indents: 1,
        spacesPerIndent: 4
      })).to.equal('    test');
    });

    it('should capitalize boolean values', function () {
      const trueNode = newNode(true);
      expect(trueNode.toXml()).to.equal('True');
      const falseNode = newNode(false);
      expect(falseNode.toXml()).to.equal('False');
    });

    it('should write numbers and bigints as strings', function () {
      const numberNode = newNode(123);
      expect(numberNode.toXml()).to.equal('123');
      const bigintNode = newNode(123n);
      expect(bigintNode.toXml()).to.equal('123');
    });

    it('should write strings', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('test');
    });
  });
});

describe('TuningCommentNode', function() {
  const newNode = (value = "Comment") => new TuningCommentNode(value);

  describe('#constructor', function() {
    it('should throw when no value is given', function () {
      expect(() => new TuningCommentNode()).to.throw();
    });

    it('should use the value that is given', function () {
      const node = new TuningCommentNode("hello");
      expect(node.value).to.equal("hello");
    });
  });

  describe('#attributes', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.attributes = {}).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.attributes).to.be.undefined;
    });
  });

  describe('#child', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.child = newNode()).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.child).to.be.undefined;
    });
  });

  describe('#children', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.children = []).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.children).to.be.undefined;
    });
  });

  describe('#hasChildren', function() {
    it('should be false', function () {
      const node = newNode();
      expect(node.hasChildren).to.be.false;
    });
  });

  describe('#id', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.id = 123n).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.id).to.be.undefined;
    });
  });

  describe('#innerValue', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.innerValue = 123n).to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.innerValue).to.be.undefined;
    });
  });

  describe('#name', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.name = "name").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.name).to.be.undefined;
    });
  });

  describe('#numChildren', function() {
    it('should be 0', function () {
      const node = newNode();
      expect(node.numChildren).to.equal(0);
    });
  });

  describe('#tag', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.tag = "tag").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.tag).to.be.undefined;
    });
  });

  describe('#type', function() {
    it('should throw when trying to set', function () {
      const node = newNode();
      expect(() => node.type = "enabled").to.throw();
    });

    it('should be undefined', function () {
      const node = newNode();
      expect(node.type).to.be.undefined;
    });
  });

  describe('#value', function() {
    it('should change the value when set', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
      node.value = "goodbye";
      expect(node.value).to.equal("goodbye");
    });

    it('should return the current value', function () {
      const node = newNode("hello");
      expect(node.value).to.equal("hello");
    });
  });

  describe('#addChildren()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addChildren()).to.throw();
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addChildren(newNode(), newNode())).to.throw();
    });
  });

  describe('#addClones()', function() {
    it('should throw when no children are given', function () {
      const node = newNode();
      expect(() => node.addClones()).to.throw();
    });

    it('should throw when children are given', function () {
      const node = newNode();
      expect(() => node.addClones(newNode(), newNode())).to.throw();
    });
  });

  describe('#clone()', function() {
    it('should return a new node with the same comment as this one', function () {
      const node = newNode();
      expect(node.value).to.equal("Comment");
      const clone = node.clone();
      expect(clone.value).to.equal("Comment");
    });

    it('should not mutate the original', function () {
      const node = newNode();
      const clone = node.clone();
      expect(node.value).to.equal("Comment");
      expect(clone.value).to.equal("Comment");
      clone.value = "Hello World";
      expect(node.value).to.equal("Comment");
      expect(clone.value).to.equal("Hello World");
    });
  });

  describe('#deepSort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.deepSort()).to.throw();
    });
  });

  describe('#sort()', function() {
    it('should throw', function () {
      const node = newNode();
      expect(() => node.sort()).to.throw();
    });
  });

  describe('#toXml()', function() {
    it('should not indent if the given number is 0', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('<!--Comment-->');
    });

    it('should use a default indentation of 2 spaces', function () {
      const node = newNode();
      expect(node.toXml({ indents: 1 })).to.equal('  <!--Comment-->');
    });

    it('should use the number of spaces that are provided', function () {
      const node = newNode();
      expect(node.toXml({
        indents: 1,
        spacesPerIndent: 4
      })).to.equal('    <!--Comment-->');
    });

    it('should wrap value in XML comment syntax', function () {
      const node = newNode();
      expect(node.toXml()).to.equal('<!--Comment-->');
    });
  });
});
