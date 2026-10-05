import { describe, it, expect } from 'vitest';
import { parseCsv, csvToObjects, toCsv } from '@/lib/csv';

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('normalises CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('honours quoted fields containing commas', () => {
    expect(parseCsv('name,note\n"Sharma, Ravi","likes, works"')).toEqual([
      ['name', 'note'],
      ['Sharma, Ravi', 'likes, works'],
    ]);
  });

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([['a'], ['say "hi"']]);
  });

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsv('a,b\n"line1\nline2",2')).toEqual([
      ['a', 'b'],
      ['line1\nline2', '2'],
    ]);
  });

  it('drops fully blank rows', () => {
    expect(parseCsv('a,b\n\n1,2\n   \n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('csvToObjects', () => {
  it('maps rows onto header keys and trims values', () => {
    const res = csvToObjects('name,state\nAsha, Maharashtra \n');
    expect(res.errors).toEqual([]);
    expect(res.headers).toEqual(['name', 'state']);
    expect(res.rows).toEqual([{ name: 'Asha', state: 'Maharashtra' }]);
  });

  it('reports a row with the wrong column count and skips it', () => {
    const res = csvToObjects('a,b,c\n1,2\n3,4,5');
    expect(res.rows).toEqual([{ a: '3', b: '4', c: '5' }]);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatch(/Row 2: expected 3 columns, found 2/);
  });

  it('returns an error when there is no data row', () => {
    const res = csvToObjects('a,b\n');
    expect(res.rows).toEqual([]);
    expect(res.errors[0]).toMatch(/header row and at least one data row/);
  });
});

describe('toCsv', () => {
  it('quotes fields containing commas, quotes or newlines', () => {
    const out = toCsv(['a', 'b'], [{ a: 'x,y', b: 'say "hi"' }]);
    expect(out).toBe('a,b\n"x,y","say ""hi"""');
  });

  it('renders null and undefined as empty strings', () => {
    expect(toCsv(['a', 'b', 'c'], [{ a: null, b: undefined, c: 0 }])).toBe('a,b,c\n,,0');
  });

  it('round-trips through csvToObjects', () => {
    const rows = [
      { name: 'Ravi', note: 'a, b' },
      { name: 'Asha', note: 'plain' },
    ];
    const parsed = csvToObjects(toCsv(['name', 'note'], rows));
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual(rows);
  });
});
