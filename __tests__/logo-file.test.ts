import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const LOGO_PATH = path.resolve(__dirname, '..', 'public', 'logo.png');

function pngWidth(buffer: Buffer): number {
  return buffer.readUInt32BE(16);
}

function pngHeight(buffer: Buffer): number {
  return buffer.readUInt32BE(20);
}

describe('public/logo.png (ЧТЗ SEO P0 1.1)', () => {
  it('should exist', () => {
    expect(fs.existsSync(LOGO_PATH)).toBe(true);
  });

  it('should be a valid PNG', () => {
    const buffer = fs.readFileSync(LOGO_PATH);

    expect(buffer.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  });

  it('should meet Google min size 112x112 in at least one dimension (600x60 horizontal)', () => {
    const buffer = fs.readFileSync(LOGO_PATH);

    expect(Math.max(pngWidth(buffer), pngHeight(buffer))).toBeGreaterThanOrEqual(112);
    expect(pngWidth(buffer)).toBe(600);
    expect(pngHeight(buffer)).toBe(60);
  });
});
