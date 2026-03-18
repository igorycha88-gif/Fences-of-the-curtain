import { hash, compare, isHashed, DEFAULT_COST } from '../../src/lib/password';

describe('password utilities', () => {
  describe('hash()', () => {
    it('should return bcrypt hash with correct format', async () => {
      const result = await hash('password123');
      expect(result).toMatch(/^\$2b\$10\$.{53}$/);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hash('password123');
      const hash2 = await hash('password123');
      expect(hash1).not.toBe(hash2);
    });

    it('should use custom cost factor', async () => {
      const result = await hash('password123', 12);
      expect(result).toMatch(/^\$2b\$12\$.{53}$/);
    });

    it('should use DEFAULT_COST when cost not provided', async () => {
      const result = await hash('password123');
      expect(result).toMatch(new RegExp(`^\\$2b\\$${DEFAULT_COST}\\$.{53}$`));
    });
  });

  describe('compare()', () => {
    it('should return true for correct password', async () => {
      const hashed = await hash('password123');
      const result = await compare('password123', hashed);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const hashed = await hash('password123');
      const result = await compare('wrongpassword', hashed);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hashed = await hash('password123');
      const result = await compare('', hashed);
      expect(result).toBe(false);
    });
  });

  describe('isHashed()', () => {
    it('should return true for valid bcrypt hash', async () => {
      const hashed = await hash('password123');
      expect(isHashed(hashed)).toBe(true);
    });

    it('should return true for valid bcrypt hash format', () => {
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMy.MwrjmL8m5Or0BxP5G5FkK5FkK5FkK5F';
      expect(isHashed(hash)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(isHashed('admin123')).toBe(false);
      expect(isHashed('password')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isHashed('')).toBe(false);
    });

    it('should return false for partial bcrypt format', () => {
      expect(isHashed('$2b$10$short')).toBe(false);
    });
  });
});
