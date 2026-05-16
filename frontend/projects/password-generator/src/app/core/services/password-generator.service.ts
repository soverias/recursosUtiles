import { Injectable } from '@angular/core';
import { GenerateOptions } from '../models/options.model';

const SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers:   '0123456789',
  symbols:   '!@#$%^&*()-_=+[]{};:,.<>?/',
};

const SIMILAR = /[1lI0O]/g;

export function buildCharset(opts: GenerateOptions): string {
  let chars = '';
  if (opts.uppercase) chars += SETS.uppercase;
  if (opts.lowercase) chars += SETS.lowercase;
  if (opts.numbers)   chars += SETS.numbers;
  if (opts.symbols)   chars += SETS.symbols;
  if (opts.excludeSimilar) chars = chars.replace(SIMILAR, '');
  return chars;
}

@Injectable({ providedIn: 'root' })
export class PasswordGeneratorService {
  generate(opts: GenerateOptions): string {
    const charset = buildCharset(opts);
    if (charset.length === 0) return '';

    const len = Math.max(1, Math.floor(opts.length));
    // Unbiased rejection sampling: only accept bytes within the largest
    // multiple of `charset.length` that fits in [0,256).
    const maxValid = Math.floor(256 / charset.length) * charset.length;
    const out: string[] = [];
    const buf = new Uint8Array(len * 2);
    let needed = len;
    while (needed > 0) {
      crypto.getRandomValues(buf);
      for (let i = 0; i < buf.length && needed > 0; i++) {
        if (buf[i] < maxValid) {
          out.push(charset[buf[i] % charset.length]);
          needed--;
        }
      }
    }
    return out.join('');
  }
}
