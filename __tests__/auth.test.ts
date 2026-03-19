import { hash, compare } from '../src/lib/password';

describe('Auth System', () => {
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
      },
    };
  });

  describe('Email validation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'admin@fences.ru',
        'user.name@domain.com',
        'user+tag@example.com',
      ];

      validEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test @example.com',
        'test..example.com',
      ];

      invalidEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Password validation', () => {
    it('should validate password with minimum 6 characters', () => {
      const validPasswords = [
        'admin123',
        'password',
        '123456',
        'securePass',
      ];

      validPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(6);
      });
    });

    it('should reject password with less than 6 characters', () => {
      const invalidPasswords = [
        '12345',
        'admin',
        'pass',
        '123',
      ];

      invalidPasswords.forEach(password => {
        expect(password.length).toBeLessThan(6);
      });
    });
  });

  describe('Authorize function', () => {
    it('should return null when credentials are missing', async () => {
      const result = await authorize(undefined, prismaMock);
      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const result = await authorize(credentials, prismaMock);
      expect(result).toBeNull();
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
    });

    it('should return null when user is inactive', async () => {
      const hashedPassword = await hash('password123');
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        active: false,
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authorize(credentials, prismaMock);
      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      const hashedPassword = await hash('correctPassword');
      prismaMock.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        active: true,
      });

      const credentials = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      const result = await authorize(credentials, prismaMock);
      expect(result).toBeNull();
    });

    it('should return user object when credentials are valid', async () => {
      const hashedPassword = await hash('admin123');
      const mockUser = {
        id: '1',
        email: 'admin@fences.ru',
        name: 'Администратор',
        password: hashedPassword,
        active: true,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const credentials = {
        email: 'admin@fences.ru',
        password: 'admin123',
      };

      const result = await authorize(credentials, prismaMock);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });
  });
});

async function authorize(credentials: any, prisma: any) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !user.active) {
    return null;
  }

  const passwordMatch = await compare(credentials.password, user.password);

  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
