import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('logger', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleDebugSpy: jest.SpiedFunction<typeof console.debug>;
  let consoleTraceSpy: jest.SpiedFunction<typeof console.trace>;

  beforeEach(() => {
    jest.resetModules();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    consoleTraceSpy = jest.spyOn(console, 'trace').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    consoleTraceSpy.mockRestore();
  });

  describe('default logger', () => {
    it('should log error messages', async () => {
      const logger = (await import('@/lib/logger')).default;
      logger.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      const msg = consoleErrorSpy.mock.calls[0][0];
      expect(msg).toContain('error');
      expect(msg).toContain('Test error message');
    });

    it('should log warn messages', async () => {
      const logger = (await import('@/lib/logger')).default;
      logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
      const msg = consoleWarnSpy.mock.calls[0][0];
      expect(msg).toContain('warn');
      expect(msg).toContain('Test warning');
    });

    it('should log info messages', async () => {
      const logger = (await import('@/lib/logger')).default;
      logger.info('Test info');
      expect(consoleLogSpy).toHaveBeenCalled();
      const msg = consoleLogSpy.mock.calls[0][0];
      expect(msg).toContain('info');
      expect(msg).toContain('Test info');
    });

    it('should include metadata when provided', async () => {
      const logger = (await import('@/lib/logger')).default;
      logger.info('Test with meta', { key: 'value' });
      const msg = consoleLogSpy.mock.calls[0][0];
      expect(msg).toContain('Test with meta');
      expect(msg).toContain('"key"');
      expect(msg).toContain('"value"');
    });

    it('should include PID in server environment', async () => {
      const logger = (await import('@/lib/logger')).default;
      logger.info('Server message');
      const msg = consoleLogSpy.mock.calls[0][0];
      expect(msg).toContain('PID');
    });
  });

  describe('with custom level', () => {
    it('should not log debug when level is INFO', async () => {
      const { default: AppLogger } = await import('@/lib/logger');
      // Import fresh to test constructor
      const LoggerModule = await import('@/lib/logger');
      const LoggerClass = Object.getPrototypeOf(LoggerModule.default).constructor;
      const logger = new LoggerClass({ level: 'info', environment: 'test' });

      logger.debug('Should not appear');
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      logger.info('Should appear');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug when level is DEBUG', async () => {
      const LoggerModule = await import('@/lib/logger');
      const LoggerClass = Object.getPrototypeOf(LoggerModule.default).constructor;
      const logger = new LoggerClass({ level: 'debug', environment: 'test' });

      logger.debug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('withContext', () => {
    it('should create a child logger with merged context', async () => {
      const LoggerModule = await import('@/lib/logger');
      const LoggerClass = Object.getPrototypeOf(LoggerModule.default).constructor;
      const logger = new LoggerClass({
        level: 'info',
        environment: 'test',
        context: { module: 'test-module' },
      });

      const child = logger.withContext({ userId: '123' });
      child.info('Child message');

      const msg = consoleLogSpy.mock.calls[0][0];
      expect(msg).toContain('test-module');
      expect(msg).toContain('123');
    });
  });

  describe('LOG_LEVEL env variable', () => {
    it('should respect LOG_LEVEL env variable', async () => {
      const origLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'error';

      const LoggerModule = await import('@/lib/logger');
      const LoggerClass = Object.getPrototypeOf(LoggerModule.default).constructor;
      const logger = new LoggerClass({ environment: 'test' });

      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      logger.error('Error message');
      expect(errSpy).toHaveBeenCalled();

      logger.info('Should be suppressed');
      expect(logSpy).not.toHaveBeenCalled();

      process.env.LOG_LEVEL = origLevel;
      logSpy.mockRestore();
      errSpy.mockRestore();
    });
  });
});
