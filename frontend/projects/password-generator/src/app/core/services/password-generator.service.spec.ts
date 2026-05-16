import { TestBed } from '@angular/core/testing';
import { PasswordGeneratorService, buildCharset } from './password-generator.service';
import { DEFAULT_OPTIONS, GenerateOptions } from '../models/options.model';

describe('buildCharset', () => {
  it('returns empty string when no toggles are active', () => {
    const charset = buildCharset({
      length: 16,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
      excludeSimilar: false,
    });
    expect(charset).toBe('');
  });

  it('includes only uppercase when only uppercase is active', () => {
    const charset = buildCharset({
      length: 16,
      uppercase: true,
      lowercase: false,
      numbers: false,
      symbols: false,
      excludeSimilar: false,
    });
    expect(charset).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });

  it('combines all character sets when all toggles are on', () => {
    const charset = buildCharset({ ...DEFAULT_OPTIONS });
    expect(charset).toContain('A');
    expect(charset).toContain('z');
    expect(charset).toContain('0');
    expect(charset).toContain('!');
  });

  it('excludes 1 l I 0 O when excludeSimilar is on', () => {
    const charset = buildCharset({ ...DEFAULT_OPTIONS, excludeSimilar: true });
    expect(charset).not.toContain('1');
    expect(charset).not.toContain('l');
    expect(charset).not.toContain('I');
    expect(charset).not.toContain('0');
    expect(charset).not.toContain('O');
    // sanity: other letters still there
    expect(charset).toContain('A');
    expect(charset).toContain('z');
    expect(charset).toContain('2');
  });
});

describe('PasswordGeneratorService.generate', () => {
  let service: PasswordGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PasswordGeneratorService);
  });

  it('returns a string of the requested length', () => {
    const pw = service.generate({ ...DEFAULT_OPTIONS, length: 16 });
    expect(pw).toHaveLength(16);
  });

  it('honors a length of 64', () => {
    const pw = service.generate({ ...DEFAULT_OPTIONS, length: 64 });
    expect(pw).toHaveLength(64);
  });

  it('returns empty string when no charset is selected', () => {
    const pw = service.generate({
      length: 16,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
      excludeSimilar: false,
    });
    expect(pw).toBe('');
  });

  it('uses only characters from the active charset', () => {
    const opts: GenerateOptions = {
      length: 200,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
      excludeSimilar: false,
    };
    const pw = service.generate(opts);
    expect(pw).toMatch(/^[0-9]+$/);
  });

  it('respects excludeSimilar across many generations', () => {
    const opts: GenerateOptions = { ...DEFAULT_OPTIONS, length: 500, excludeSimilar: true };
    const pw = service.generate(opts);
    expect(pw).not.toMatch(/[1lI0O]/);
  });

  it('produces different passwords on consecutive calls (randomness sanity)', () => {
    const a = service.generate({ ...DEFAULT_OPTIONS, length: 32 });
    const b = service.generate({ ...DEFAULT_OPTIONS, length: 32 });
    expect(a).not.toBe(b);
  });

  it('covers the entire charset over many generations (no obvious bias)', () => {
    // Generate a long sequence using only lowercase; every letter should appear.
    const opts: GenerateOptions = {
      length: 2000,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
      excludeSimilar: false,
    };
    const pw = service.generate(opts);
    const seen = new Set(pw);
    expect(seen.size).toBe(26);
  });
});
