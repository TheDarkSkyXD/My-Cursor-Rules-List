// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
module.exports = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Ensure this is uncommented
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      // Add diagnostics: false to potentially ignore spurious TS errors during transformation
      diagnostics: false,
      // Explicitly state JSX handling (though tsconfig.jest.json should cover it)
      // jsx: 'react-jsx' 
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!jose)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!<rootDir>/out/**',
    '!<rootDir>/.next/**',
    '!<rootDir>/*.config.js',
    '!<rootDir>/coverage/**',
    '!<rootDir>/prisma/**', // Exclude Prisma generated files
    '!<rootDir>/scripts/**', // Exclude scripts
    '!<rootDir>/__tests__/**', // Exclude test files themselves
    '!<rootDir>/tests/**', // Exclude test files themselves
    '!<rootDir>/src/__tests__/**', // Exclude test files themselves
    '!<rootDir>/app/api/auth/[...nextauth]/route.ts', // Exclude NextAuth route
    '!<rootDir>/app/layout.tsx', // Exclude root layout
    '!<rootDir>/app/providers.tsx', // Exclude providers file
    '!<rootDir>/lib/authOptions.ts', // Exclude auth options file
    '!<rootDir>/middleware.ts', // Exclude middleware until tested separately
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  // Add any other necessary Jest configurations below
};