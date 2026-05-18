export const launch = jest.fn();
export const launchContext = jest.fn();
export const launchPersistentContext = jest.fn();
export const ensureBinary = jest.fn().mockResolvedValue('/fake/chromium');
export const clearCache = jest.fn();
export const binaryInfo = jest.fn().mockReturnValue({
  version: '0.0.0',
  platform: 'test',
  binaryPath: '/fake/chromium',
  installed: true,
  cacheDir: '/fake/cache',
  downloadUrl: '',
});
export const checkForUpdate = jest.fn().mockResolvedValue(null);
export const CHROMIUM_VERSION = '0.0.0';
export const getDefaultStealthArgs = jest.fn().mockReturnValue([]);
