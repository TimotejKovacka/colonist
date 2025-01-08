'use strict';

import { generatePatch } from './generate';

describe('generate', function () {
  it('should generate a patch replacing an attribute', function () {
    expect(generatePatch({ a: 'b' }, { a: 'c' })).toStrictEqual({ a: 'c' });
  });

  it('should generate a patch adding an attribute', function () {
    expect(generatePatch({ a: 'b' }, { a: 'b', b: 'c' })).toStrictEqual({
      b: 'c',
    });
  });

  it('should generate a patch deleting an attribute', function () {
    expect(generatePatch({ a: 'b' }, {})).toStrictEqual({ a: null });
  });

  it('should generate a patch deleting an attribute recursively', function () {
    expect(generatePatch({ a: { bb: { c: 'd' } } }, { a: {} })).toStrictEqual({
      a: { bb: null },
    });
  });

  it('should generate a patch deleting an attribute without affecting others', function () {
    expect(generatePatch({ a: 'b', b: 'c' }, { b: 'c' })).toStrictEqual({
      a: null,
    });
  });

  it('should generate a patch replacing an attribute if its an array', function () {
    expect(generatePatch({ a: ['b'] }, { a: 'c' })).toStrictEqual({ a: 'c' });
  });

  it('should generate a patch replacing the attribute with an array', function () {
    expect(generatePatch({ a: 'c' }, { a: ['b'] })).toStrictEqual({ a: ['b'] });
  });

  it('should generate a patch replacing an object array with a number array', function () {
    expect(generatePatch({ a: [{ b: 'c' }] }, { a: [1] })).toStrictEqual({
      a: [1],
    });
  });

  it('should generate a patch replacing whole array if one element has changed', function () {
    expect(generatePatch(['a', 'b'], ['c', 'd'])).toStrictEqual(['c', 'd']);
  });

  it('should generate a patch replacing whole array if one element has been deleted', function () {
    expect(generatePatch(['a', 'b'], ['a'])).toStrictEqual(['a']);
  });

  it('should generate a patch replacing with an array', function () {
    expect(generatePatch({ a: 'b' }, ['c'])).toStrictEqual(['c']);
  });

  it('should generate a patch replacing with null', function () {
    expect(generatePatch({ a: 'foo' }, null)).toStrictEqual(null);
  });

  it('should generate a patch replacing with a string', function () {
    expect(generatePatch({ a: 'foo' }, 'bar')).toStrictEqual('bar');
  });

  it('should generate a patch replacing with an object implementing toJSON() method', function () {
    expect(
      generatePatch({ a: 'foo' }, new Date('2020-05-09T00:00:00.000Z'))
    ).toStrictEqual('2020-05-09T00:00:00.000Z');
  });

  it('should generate a patch replacing a property with an object implementing toJSON() method', function () {
    expect(
      generatePatch({ a: 'foo' }, { a: new Date('2020-05-09T00:00:00.000Z') })
    ).toStrictEqual({ a: '2020-05-09T00:00:00.000Z' });
  });

  it('should generate a patch adding a property with an object implementing toJSON() method', function () {
    expect(
      generatePatch({}, { b: new Date('2020-05-09T00:00:00.000Z') })
    ).toStrictEqual({
      b: '2020-05-09T00:00:00.000Z',
    });
  });

  it('should generate a patch keeping null attributes', function () {
    expect(generatePatch({ e: null }, { e: null, a: 1 })).toStrictEqual({
      a: 1,
    });
  });

  it('should work recursively', function () {
    expect(generatePatch({}, { a: { bb: {} } })).toStrictEqual({
      a: { bb: {} },
    });
  });

  it('should return undefined if the object hasnt changed', function () {
    expect(generatePatch({ a: 'a' }, { a: 'a' })).toStrictEqual(undefined);
  });

  it('should return undefined if the object with sub attributes hasnt changed', function () {
    expect(generatePatch({ a: { b: 'c' } }, { a: { b: 'c' } })).toStrictEqual(
      undefined
    );
  });

  it('should return undefined if the array hasnt changed', function () {
    expect(generatePatch([1, 2, 3], [1, 2, 3])).toStrictEqual(undefined);
  });

  it('should understand props set to `undefined` as a deletion of that prop', function () {
    expect(
      generatePatch({ a: 'a1', b: 'b' }, { a: 'a2', b: undefined })
    ).toStrictEqual({ a: 'a2', b: null });
  });

  it('should skip explicit undefined props in the original object', function () {
    expect(generatePatch({ a: 'a', b: undefined }, { a: 'a' })).toStrictEqual(
      undefined
    );
  });

  it('should skip explicit undefined props in the changed object', function () {
    expect(generatePatch({ a: 'a' }, { a: 'a', b: undefined })).toStrictEqual(
      undefined
    );
  });
});
