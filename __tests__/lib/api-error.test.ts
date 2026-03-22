import { ZodError, z } from 'zod';
import { validationError } from '../../src/lib/api-error';

describe('validationError', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });

  const createZodError = (): ZodError => {
    const schema = z.object({
      name: z.string(),
      price: z.number(),
    });
    try {
      schema.parse({ name: 123, price: 'invalid' });
    } catch (error) {
      return error as ZodError;
    }
    throw new Error('Should not reach here');
  };

  describe('in production', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
    });

    it('should return sanitized error message', () => {
      const error = createZodError();
      const response = validationError(error);

      expect(response.status).toBe(400);
    });

    it('should return generic validation failed message', async () => {
      const error = createZodError();
      const response = validationError(error);
      const body = await response.json();

      expect(body).toEqual({ error: 'Validation failed' });
    });

    it('should not expose ZodError details', async () => {
      const error = createZodError();
      const response = validationError(error);
      const body = await response.json();

      expect(body).not.toHaveProperty('errors');
      expect(body).not.toHaveProperty('details');
    });
  });

  describe('in development', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      });
    });

    it('should return detailed error information', async () => {
      const error = createZodError();
      const response = validationError(error);
      const body = await response.json();

      expect(body).toHaveProperty('error');
      expect(Array.isArray(body.error)).toBe(true);
    });

    it('should return HTTP 400 status', () => {
      const error = createZodError();
      const response = validationError(error);

      expect(response.status).toBe(400);
    });

    it('should expose ZodError errors array', async () => {
      const error = createZodError();
      const response = validationError(error);
      const body = await response.json();

      expect(body.error).toEqual(error.errors);
      expect(body.error.length).toBeGreaterThan(0);
    });

    it('should include error path information', async () => {
      const error = createZodError();
      const response = validationError(error);
      const body = await response.json();

      const firstError = body.error[0];
      expect(firstError).toHaveProperty('path');
      expect(Array.isArray(firstError.path)).toBe(true);
    });
  });

  describe('return type', () => {
    it('should return NextResponse instance', () => {
      const error = createZodError();
      const response = validationError(error);

      expect(response).toBeInstanceOf(Response);
    });

    it('should have json method', () => {
      const error = createZodError();
      const response = validationError(error);

      expect(typeof response.json).toBe('function');
    });
  });
});
