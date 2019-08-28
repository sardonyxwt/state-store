module.exports = {
    testURL: 'http://localhost',
    moduleFileExtensions: ['js', 'ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    testRegex: '/test/.*\\.test\\.ts$',
    reporters: [
        'default',
        ['./node_modules/jest-html-reporter', {
            pageTitle: 'StateStore Test Report',
            outputPath: './report/test-report.html',
            includeFailureMsg: true,
            includeConsoleLog: true
        }]
    ],
    collectCoverage: true,
    coverageDirectory: './report/coverage',
    collectCoverageFrom: [
        'src/index.ts',
        '!<rootDir>/node_modules/'
    ]
};
