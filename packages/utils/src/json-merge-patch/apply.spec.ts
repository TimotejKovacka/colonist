import { applyPatch } from './apply';

describe('apply', function () {
  it('should replace an attribute', function () {
    expect(applyPatch({ a: 'b' }, { a: 'c' })).toStrictEqual({ a: 'c' });
  });

  it('should add an attribute', function () {
    expect(applyPatch({ a: 'b' }, { b: 'c' })).toStrictEqual({
      a: 'b',
      b: 'c',
    });
  });

  it('should delete attribute', function () {
    expect(applyPatch({ a: 'b' }, { a: null })).toStrictEqual({});
  });

  it('should delete attribute without affecting others', function () {
    expect(applyPatch({ a: 'b', b: 'c' }, { a: null })).toStrictEqual({
      b: 'c',
    });
  });

  it('should replace array with a string', function () {
    expect(applyPatch({ a: ['b'] }, { a: 'c' })).toStrictEqual({ a: 'c' });
  });

  it('should replace an string with an array', function () {
    expect(applyPatch({ a: 'c' }, { a: ['b'] })).toStrictEqual({ a: ['b'] });
  });

  it('should apply recursively', function () {
    expect(
      applyPatch({ a: { b: 'c' } }, { a: { b: 'd', c: null } })
    ).toStrictEqual({
      a: { b: 'd' },
    });
  });

  it('should replace an object array with a number array', function () {
    expect(applyPatch({ a: [{ b: 'c' }] }, { a: [1] })).toStrictEqual({
      a: [1],
    });
  });

  it('should replace an array', function () {
    expect(applyPatch(['a', 'b'], ['c', 'd'])).toStrictEqual(['c', 'd']);
  });

  it('should replace an object with an array', function () {
    expect(applyPatch({ a: 'b' }, ['c'])).toStrictEqual(['c']);
  });

  it('should replace an object with null', function () {
    expect(applyPatch({ a: 'foo' }, null)).toStrictEqual(null);
  });

  it('should replace with an object implementing toJSON() method', function () {
    expect(
      applyPatch({ a: 'foo' }, { a: new Date('2020-05-09T00:00:00.000Z') })
    ).toStrictEqual({
      a: '2020-05-09T00:00:00.000Z',
    });
  });

  it('should replace an object with a string', function () {
    expect(applyPatch({ a: 'foo' }, 'bar')).toStrictEqual('bar');
  });

  it('should not change null attributes', function () {
    expect(applyPatch({ e: null }, { a: 1 })).toStrictEqual({ e: null, a: 1 });
  });

  it('should not set an attribute to null', function () {
    expect(applyPatch([1, 2], { a: 'b', c: null })).toStrictEqual({ a: 'b' });
  });

  it('should not set an attribute to null in a sub object', function () {
    expect(applyPatch({}, { a: { bb: { ccc: null } } })).toStrictEqual({
      a: { bb: {} },
    });
  });
});
