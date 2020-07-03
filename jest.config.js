/* eslint-disable @typescript-eslint/no-var-requires */
const pkg = require('./package.json');
const tsconfig = require('./tsconfig.json');
const tsconfigPaths = require('tsconfig-paths-jest');

module.exports = {
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(css|styl|less|sass|scss|png|jpg|ttf)$': 'jest-transform-stub',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        ...(tsconfig.compilerOptions.paths ? tsconfigPaths(tsconfig) : {}),
    },
    reporters: [
        'default',
        [
            './node_modules/jest-html-reporter',
            {
                pageTitle: `${pkg.name}-${pkg.version}`,
                outputPath: './report/test-report.html',
                includeFailureMsg: true,
                includeConsoleLog: true,
            },
        ],
    ],
    collectCoverage: true,
    coverageDirectory: './report/coverage',
    collectCoverageFrom: [
        'src/app/**/*.{ts,tsx,js,jsx}',
        'src/shared/**/*.{ts,tsx,js,jsx}',
        '!<rootDir>/node_modules/',
        '!<rootDir>/src/**/*.constant.ts',
    ],
};
