const sharedCoverageExcludes = [
  '!src/**/*.d.ts',
  '!src/**/*.stories.{js,jsx,ts,tsx}',
  '!src/**/__tests__/**',
  '!src/middleware.ts',
  '!src/app/**/layout.tsx',
  '!src/app/**/metadata.tsx',
  '!src/app/**/page.tsx',
  '!src/app/**/robots.ts',
  '!src/app/**/sitemap.ts',
  '!src/app/**/not-found.tsx',
  '!src/types/**',
  '!src/lib/prisma.ts',
  '!src/app/api/**',
];

const coverageThreshold = {
  global: {
    branches: 60,
    functions: 80,
    lines: 80,
    statements: 80,
  },
};

module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      roots: ['<rootDir>/__tests__'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^cloakbrowser$': '<rootDir>/__tests__/__mocks__/cloakbrowser.ts',
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        ...sharedCoverageExcludes,
      ],
      coverageThreshold,
    },
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/__tests__'],
      testMatch: ['**/__tests__/**/*.test.tsx'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': '<rootDir>/__tests__/__mocks__/styleMock.js',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
            module: 'esnext',
            moduleResolution: 'bundler',
          },
        }],
      },
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        ...sharedCoverageExcludes,
      ],
      coverageThreshold,
    },
  ],
};
