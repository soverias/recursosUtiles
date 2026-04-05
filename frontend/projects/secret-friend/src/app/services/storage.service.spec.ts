import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StorageService] });
    service = TestBed.inject(StorageService);
  });

  it('set stores value under the prefixed key', () => {
    service.set('key', { foo: 'bar' });
    const raw = localStorage.getItem('secret-friend:key');
    expect(raw).toBe(JSON.stringify({ foo: 'bar' }));
  });

  it('get returns the stored value typed correctly', () => {
    service.set('mykey', { name: 'Alice', age: 30 });
    const result = service.get<{ name: string; age: number }>('mykey');
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('get returns null for a missing key', () => {
    const result = service.get<string>('nonexistent');
    expect(result).toBeNull();
  });

  it('remove deletes the prefixed key', () => {
    service.set('removeMe', 42);
    service.remove('removeMe');
    expect(localStorage.getItem('secret-friend:removeMe')).toBeNull();
  });

  it('get returns null when localStorage contains corrupt JSON', () => {
    localStorage.setItem('secret-friend:corrupt', '{invalid json}}}');
    const result = service.get<object>('corrupt');
    expect(result).toBeNull();
  });

  it('prefix isolation: get does NOT read a value stored without the prefix', () => {
    localStorage.setItem('key', '"unprefixed value"');
    const result = service.get<string>('key');
    expect(result).toBeNull();
  });

  // TRIANGULATE
  it('TRIANGULATE: storing 0 — get returns 0 (not null)', () => {
    service.set('zero', 0);
    expect(service.get<number>('zero')).toBe(0);
  });

  it('TRIANGULATE: storing false — get returns false (not null)', () => {
    service.set('falsy', false);
    expect(service.get<boolean>('falsy')).toBe(false);
  });

  it('TRIANGULATE: storing null — get returns null', () => {
    service.set('nullval', null);
    expect(service.get<null>('nullval')).toBeNull();
  });

  it('TRIANGULATE: set called twice — second value wins', () => {
    service.set('overwrite', 'first');
    service.set('overwrite', 'second');
    expect(service.get<string>('overwrite')).toBe('second');
  });
});
