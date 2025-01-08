'use strict';

import { mergePatches } from './merge';

describe('merge', function () {
  it('should merge 2 patches with different attributes', function () {
    expect(mergePatches({ a: 'b' }, { b: 'c' })).toStrictEqual({
      a: 'b',
      b: 'c',
    });
  });

  it('should merge take last patch attributes for rewriting', function () {
    expect(mergePatches({ a: 'b' }, { a: 'c' })).toStrictEqual({ a: 'c' });
  });

  it('should merge take last patch attributes for rewriting and keep other attributes', function () {
    expect(mergePatches({ a: 'b', b: 'd' }, { a: 'c' })).toStrictEqual({
      a: 'c',
      b: 'd',
    });
  });

  it('should keep null attributes for deleting', function () {
    expect(mergePatches({ a: null }, { b: 'c' })).toStrictEqual({
      a: null,
      b: 'c',
    });
  });

  it('should replace null with newer attribute', function () {
    expect(mergePatches({ a: null }, { a: 'b' })).toStrictEqual({ a: 'b' });
  });

  it('should replace an attribute with null if newer', function () {
    expect(mergePatches({ a: 'b' }, { a: null })).toStrictEqual({ a: null });
  });

  it('should replace an array with an object', function () {
    expect(mergePatches([], { a: 'b' })).toStrictEqual({ a: 'b' });
  });

  it('should replace an object with an array', function () {
    expect(mergePatches({ a: 'b' }, [])).toStrictEqual([]);
  });

  it('should merge sub objects', function () {
    expect(
      mergePatches({ a: { b: { c: 'd' } }, d: 'e' }, { a: { b: 'a' } })
    ).toStrictEqual({ a: { b: 'a' }, d: 'e' });
  });

  it('should merge recursively', function () {
    expect(
      mergePatches({ a: { b: { c: 'd' }, d: 'e' } }, { a: { b: { c: 'e' } } })
    ).toStrictEqual({ a: { b: { c: 'e' }, d: 'e' } });
  });

  it('should replace object with with null value', function () {
    expect(mergePatches({ a: 'b' }, null)).toStrictEqual(null);
  });
});
