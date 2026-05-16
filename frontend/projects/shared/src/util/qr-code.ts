import { qrcodegen } from './qrcodegen';

export type EccLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrSvgOptions {
  text: string;
  ecc?: EccLevel;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generates an SVG string representing the QR Code for the given text.
 *
 * The SVG has no fixed pixel size — it uses `viewBox` so it scales to fit
 * its container. Width/height attributes are intentionally omitted; the
 * consumer applies CSS sizing.
 *
 * Throws if the text cannot fit even in the largest QR Code (version 40)
 * at the chosen ECC level. ~2950 bytes at ECC level L, less for higher ECC.
 */
export function generateQrSvg(opts: QrSvgOptions): string {
  const ecc = mapEcc(opts.ecc ?? 'M');
  const qr = qrcodegen.QrCode.encodeText(opts.text, ecc);

  const border    = Math.max(0, opts.margin ?? 4);
  const darkColor = opts.darkColor  ?? '#000000';
  const lightColor = opts.lightColor ?? '#ffffff';

  const dim = qr.size + border * 2;
  const path: string[] = [];

  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) {
        path.push(`M${x + border},${y + border}h1v1h-1z`);
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" ` +
    `shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="${lightColor}"/>` +
    `<path d="${path.join('')}" fill="${darkColor}"/>` +
    `</svg>`
  );
}

function mapEcc(level: EccLevel): qrcodegen.QrCode.Ecc {
  switch (level) {
    case 'L': return qrcodegen.QrCode.Ecc.LOW;
    case 'M': return qrcodegen.QrCode.Ecc.MEDIUM;
    case 'Q': return qrcodegen.QrCode.Ecc.QUARTILE;
    case 'H': return qrcodegen.QrCode.Ecc.HIGH;
  }
}
