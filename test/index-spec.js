import { expect } from 'chai';

import { Table } from '../src/index';

function make3x3() {
  return Table.fromCSV([
    '1, 2, 3',
    '4, 5, 6',
    '7, 8, 9',
  ].join('\n'));
}

describe('Table', function() {
  it('can be constructed', function() {
    const t = new Table(2, 2);
  });
  it('can be constructed form a csv', function() {
    const t = Table.fromCSV([
      '1, 2',
      '3, 4'
    ].join('\n'));
    expect(t.getCell(0, 0)).to.equal('1');
    expect(t.getCell(1, 0)).to.equal('2');
    expect(t.getCell(0, 1)).to.equal('3');
    expect(t.getCell(1, 1)).to.equal('4');
    expect(t.width).to.equal(2);
    expect(t.height).to.equal(2);
  });
  it('can be constructed form a malformed, wide csv', function() {
    const t = Table.fromCSV([
      '1, 2, 3',
      '4'
    ].join('\n'));
    expect(t.getCell(0, 0)).to.equal('1');
    expect(t.getCell(1, 0)).to.equal('2');
    expect(t.getCell(2, 0)).to.equal('3');
    expect(t.getCell(0, 1)).to.equal('4');
    expect(t.getCell(1, 1)).to.be.undefined;
    expect(t.getCell(2, 1)).to.be.undefined;
    expect(t.width).to.equal(3);
    expect(t.height).to.equal(2);
  });

  describe('slice', function() {
    it('can get sub table', function() {
      const t = make3x3();
      const u = t.slice(1,1);
      expect(u.getCell(0, 0)).to.equal('5');
      expect(u.getCell(1, 0)).to.equal('6');
      expect(u.getCell(0, 1)).to.equal('8');
      expect(u.getCell(1, 1)).to.equal('9');
    });
    it('can reverse get sub table', function() {
      const t = make3x3();
      const u = t.slice(-2,-2);
      expect(u.getCell(0, 0)).to.equal('5');
      expect(u.getCell(1, 0)).to.equal('6');
      expect(u.getCell(0, 1)).to.equal('8');
      expect(u.getCell(1, 1)).to.equal('9');
    });
    it('barfs out of bounds', function() {
      const t = make3x3();
      expect(() => t.slice(2,2,3,3)).to.throw(Error);
    });
    it('fetch 1', function() {
      const t = make3x3();
      const u = t.slice(2,2);
      expect(u.width).to.equal(1);
      expect(u.height).to.equal(1);
      expect(u.getCell(0,0)).to.equal('9');
    });
    it('reverse fetch 1', function() {
      const t = make3x3();
      const u = t.slice(-1,-1);
      expect(u.width).to.equal(1);
      expect(u.height).to.equal(1);
      expect(u.getCell(0,0)).to.equal('9');
    });
    it('can get bounded', function() {
      const t = make3x3();
      const u = t.slice(0,0,-1,-1);
      expect(u.width).to.equal(2);
      expect(u.height).to.equal(2);
      expect(u.getCell(0, 0)).to.equal('1');
      expect(u.getCell(1, 0)).to.equal('2');
      expect(u.getCell(0, 1)).to.equal('4');
      expect(u.getCell(1, 1)).to.equal('5');
    });
  });

  describe('setCell', function() {
    it('can set a value', function() {
      const t = make3x3().setCell(1, 1, 'a');
      expect(t.getCell(0, 0)).to.equal('1');
      expect(t.getCell(1, 1)).to.equal('a');
    });
    it('can set a table', function() {
      let t = make3x3();
      const u = t.slice(1,1);
      t = t.setCell(0, 0, u);
      expect(u.getCell(0, 0)).to.equal('5', 'u');
      expect(t.getCell(0, 0)).to.equal('5', 't');
      expect(t.getCell(1, 0)).to.equal('6');
      expect(t.getCell(0, 1)).to.equal('8');
      expect(t.getCell(1, 1)).to.equal('9');
      expect(t.getCell(2, 1)).to.equal('6');
      expect(t.getCell(1, 2)).to.equal('8');
      expect(t.getCell(2, 2)).to.equal('9');
    });
    it('barfs out of bounds', function() {
      const t = make3x3();
      expect(() => t.setCell(3,3, 0)).to.throw(Error);
    });
  });

  describe('getCell', function() {
    it('can get a value', function() {
      const t = make3x3();
      expect(t.getCell(0, 0)).to.equal('1');
      expect(t.getCell(1, 1)).to.equal('5');
    });
    it('barfs out of bounds', function() {
      const t = make3x3();
      expect(() => t.getCell(3,3)).to.throw(Error);
    });
  });

  describe('equals', function() {
    it('can detect same', function() {
      expect(make3x3().equals(make3x3())).to.be.true;
    });
    it('can detect different (same starting point)', function() {
      const t = make3x3();
      const u = make3x3().setCell(2,2,-1);
      expect(t.equals(u)).to.be.false;
    });
    it('can detect different (different sizes, same contents)', function() {
      const t = new Table(2,2);
      const u = new Table(1,1);
      expect(t.equals(u)).to.be.false;
    });
    it('can detect different (different size, different contents)', function() {
      const t = make3x3();
      const u = new Table(2,2);
      expect(t.equals(u)).to.be.false;
    });
  });

  describe('toJSON/makeReviver', function() {
    it('serialization round trip', function() {
      const t = make3x3();
      const serialized = JSON.stringify(t);
      expect(serialized).to.be.a('string');

      const u = JSON.parse(serialized, Table.makeReviver());
      expect(t.equals(u)).to.be.true;
    });
  });

  describe('setIn', function() {
    it('returns table type', function() {
      const t = make3x3();
      expect(t.setIn(['data', 0, 0], 'test')).to.be.an.instanceof(Table);
      expect(t.setIn(['data', 0, 0], 'test').setCell).to.not.be.undefined;
    });
  });

  describe('toString', function() {
    it('returns a *friendly* string representation of the Table', function() {
      const t = make3x3();
      expect(t.toString().indexOf('Table')).to.equal(0);
    });
  });
});
