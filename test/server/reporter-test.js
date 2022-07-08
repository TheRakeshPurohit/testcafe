const chai                            = require('chai');
const { expect }                      = chai;
const { chunk, random, noop, sortBy } = require('lodash');
const Reporter                        = require('../../lib/reporter');
const ReporterPluginMethod            = require('../../lib/reporter/plugin-methods');
const Task                            = require('../../lib/runner/task');
const MessageBus                      = require('../../lib/utils/message-bus');
const Videos                          = require('../../lib/video-recorder/videos');
const delay                           = require('../../lib/utils/delay');
const { ReporterPluginError }         = require('../../lib/errors/runtime');
const WarningLog                      = require('../../lib/notifications/warning-log');


describe('Reporter', () => {
    const screenshotDir = '/screenshots/1445437598847';

    const browserMocks = [
        {
            alias:     'Chrome',
            userAgent: 'Chrome',
            headless:  false,
        },
        {
            alias:     'Firefox',
            userAgent: 'Firefox',
            headless:  false,
        },
    ];

    const browserConnectionMocks = [
        {
            userAgent:      'Chrome',
            connectionInfo: 'Chrome',

        },
        {
            userAgent:      'Firefox',
            connectionInfo: 'Firefox',
        },
    ];

    const fixtureMocks = [
        {
            id:   'fid1',
            name: 'fixture1',
            path: './file1.js',
            meta: {
                run: 'run-001',
            },
        },
        {
            id:   'fid2',
            name: 'fixture2',
            path: './file1.js',
            meta: {
                run: 'run-002',
            },
        },
        {
            id:   'fid3',
            name: 'fixture3',
            path: './file2.js',
            meta: null,
        },
    ];

    const testMocks = [
        {
            id:          'idf1t1',
            name:        'fixture1test1',
            pageUrl:     'urlf1t1',
            fixture:     fixtureMocks[0],
            skip:        false,
            screenshots: [{
                testRunId:         'idf1t1-1',
                screenshotPath:    'screenshot1.png',
                thumbnailPath:     'thumbnail1.png',
                userAgent:         'chrome',
                takenOnFail:       false,
                quarantineAttempt: 2,
            }],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
        {
            id:          'idf1t2',
            name:        'fixture1test2',
            pageUrl:     'urlf1t2',
            fixture:     fixtureMocks[0],
            skip:        false,
            screenshots: [{
                testRunId:         'idf1t2-1',
                screenshotPath:    'screenshot1.png',
                thumbnailPath:     'thumbnail1.png',
                userAgent:         'chrome',
                takenOnFail:       false,
                quarantineAttempt: null,
            }, {
                testRunId:         'idf1t2-2',
                screenshotPath:    'screenshot2.png',
                thumbnailPath:     'thumbnail2.png',
                userAgent:         'chrome',
                takenOnFail:       true,
                quarantineAttempt: null,
            }],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
        {
            id:            'idf1t3',
            name:          'fixture1test3',
            pageUrl:       'urlf1t3',
            skip:          false,
            fixture:       fixtureMocks[0],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
        {
            id:            'idf2t1',
            name:          'fixture2test1',
            pageUrl:       'urlf2t1',
            skip:          false,
            fixture:       fixtureMocks[1],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
        {
            id:            'idf2t2',
            name:          'fixture2test2',
            pageUrl:       'urlf2t2',
            skip:          false,
            fixture:       fixtureMocks[1],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
        {
            id:            'idf3t1',
            name:          'fixture3test1',
            pageUrl:       'urlf3t1',
            skip:          false,
            fixture:       fixtureMocks[2],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
        {
            id:            'idf3t2',
            name:          'fixture3test2',
            pageUrl:       'urlf3t2',
            skip:          true,
            fixture:       fixtureMocks[2],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
        {
            id:            'idf3t3',
            name:          'fixture3test3',
            pageUrl:       'urlf3t3',
            skip:          false,
            fixture:       fixtureMocks[2],
            clientScripts: [],
            meta:          {
                run: 'run-001',
            },
        },
    ];

    // Test run mocks
    const chromeTestRunMocks = [
        //fixture1test1
        {
            id:                'f1t1',
            test:              testMocks[0],
            unstable:          true,
            browserConnection: browserConnectionMocks[0],
            errs:              [],
            warningLog:        { messages: [] },
            quarantine:        {
                attempts: [
                    { testRunId: 'firstRunId', errors: ['1', '2'] },
                    { testRunId: 'secondRunId', errors: [] },
                ],
            },
            browser: browserMocks[0],
        },

        //fixture1test2
        {
            id:                'f1t2',
            test:              testMocks[1],
            unstable:          false,
            browserConnection: browserConnectionMocks[0],
            warningLog:        { messages: [] },
            browser:           browserMocks[0],

            errs: [
                { text: 'err1' },
                { text: 'err2' },
            ],
        },

        //fixture1test3
        {
            id:                'f1t3',
            test:              testMocks[2],
            unstable:          false,
            browserConnection: browserConnectionMocks[0],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[0],
        },

        //fixture2test1
        {
            id:                'f2t1',
            test:              testMocks[3],
            unstable:          false,
            browserConnection: browserConnectionMocks[0],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[0],
        },

        //fixture2test2
        {
            id:                'f2t2',
            test:              testMocks[4],
            unstable:          false,
            browserConnection: browserConnectionMocks[0],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[0],
        },

        //fixture3test1
        {
            id:                'f3t1',
            test:              testMocks[5],
            unstable:          false,
            browserConnection: browserConnectionMocks[0],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[0],
        },

        //fixture3test2
        {
            id:                'f3t2',
            test:              testMocks[6],
            unstable:          true,
            browserConnection: browserConnectionMocks[0],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[0],
        },

        //fixture3test3
        {
            id:                'f3t3',
            test:              testMocks[7],
            unstable:          true,
            browserConnection: browserConnectionMocks[0],
            errs:              [],
            warningLog:        { messages: ['warning2'] },
            browser:           browserMocks[0],
        },
    ];

    const firefoxTestRunMocks = [
        //fixture1test1
        {
            id:                'f1t1ff',
            test:              testMocks[0],
            unstable:          true,
            browserConnection: browserConnectionMocks[1],
            errs:              [],
            warningLog:        { messages: [] },
            quarantine:        {
                attempts: [
                    { testRunId: 'firstRunId', errors: ['1', '2'] },
                    { testRunId: 'secondRunId', errors: [] },
                ],
            },
            browser: browserMocks[1],
        },

        // 'fixture1test2
        {
            id:                'f1t2ff',
            test:              testMocks[1],
            unstable:          false,
            browserConnection: browserConnectionMocks[1],
            errs:              [{ text: 'err1' }],
            warningLog:        { messages: [] },
            browser:           browserMocks[1],
        },

        //fixture1test3
        {
            id:                'f1t3ff',
            test:              testMocks[2],
            unstable:          false,
            browserConnection: browserConnectionMocks[1],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[1],
        },

        //fixture2test1
        {
            id:                'f2t1ff',
            test:              testMocks[3],
            unstable:          false,
            browserConnection: browserConnectionMocks[1],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[1],
        },

        //fixture2test2
        {
            id:                'f2t2ff',
            test:              testMocks[4],
            unstable:          false,
            browserConnection: browserConnectionMocks[1],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[1],
        },

        //fixture3test1
        {
            id:                'f3t1ff',
            test:              testMocks[5],
            unstable:          true,
            browserConnection: browserConnectionMocks[1],
            errs:              [{ text: 'err1' }],
            warningLog:        { messages: ['warning1'] },
            browser:           browserMocks[1],
        },

        //fixture3test2
        {
            id:                'f3t2ff',
            test:              testMocks[6],
            unstable:          true,
            browserConnection: browserConnectionMocks[1],
            errs:              [],
            warningLog:        { messages: [] },
            browser:           browserMocks[1],
        },

        //fixture3test3
        {
            id:                'f3t3ff',
            test:              testMocks[7],
            unstable:          true,
            browserConnection: browserConnectionMocks[1],
            errs:              [],
            warningLog:        { messages: ['warning2', 'warning3'] },
            browser:           browserMocks[1],
        },
    ];

    chromeTestRunMocks.concat(firefoxTestRunMocks).forEach(testRunMock => {
        testRunMock.errs.forEach(err => {
            err.userAgent = testRunMock.browserConnection.userAgent;
        });
    });

    class ScreenshotsMock {
        constructor () {}

        getScreenshotsInfo (testMock) {
            return testMock.screenshots;
        }

        hasCapturedFor (testMock) {
            return this.getScreenshotsInfo(testMock);
        }

        getPathFor () {
            return screenshotDir;
        }
    }

    class VideosMock extends Videos {
        constructor (testVideoInfos) {
            super([], { videoPath: '' });


            this.testVideoInfos = testVideoInfos;
        }
    }

    const taskOptions = {
        disableMultipleWindows: false,
        appInitDelay:           1000,
        assertionTimeout:       3000,
        browsers:               ['chrome', 'firefox'],
        concurrency:            1,
        debugMode:              false,
        debugOnFail:            false,
        developmentMode:        false,
        disablePageCaching:     false,
        disablePageReloads:     false,
        disableScreenshots:     false,
        hostname:               'localhost',
        pageLoadTimeout:        3000,
        port1:                  1337,
        port2:                  1338,
        quarantineMode:         false,
        reporter:               [{ name: 'customReporter' }],
        retryTestPages:         false,
        screenshots:            { path: '/path/to/screenshots' },
        selectorTimeout:        10000,
        skipJsErrors:           false,
        skipUncaughtErrors:     false,
        speed:                  1,
        src:                    ['test.js'],
        stopOnFirstFail:        false,
        takeScreenshotsOnFails: false,
        dashboardUrl:           'https://example.com/path',
    };

    class TaskMock extends Task {
        constructor () {
            super({
                tests:                   testMocks,
                browserConnectionGroups: chunk(browserConnectionMocks, 1),
                proxy:                   {},
                opts:                    taskOptions,
                runnerWarningLog:        new WarningLog(),
                messageBus:              new MessageBus(),
            });

            this.screenshots = new ScreenshotsMock();

            this.warningLog = {
                messages: [
                    'warning1',
                    'warning2',
                    'warning3',
                ],
            };

            this.startTime = new Date('1970-01-01T00:00:00.000Z');
        }

        _createBrowserJobs () {
            return [];
        }
    }

    let log = [];

    // Browser job emulation
    function randomDelay () {
        return delay(random(100, 500));
    }

    function emulateBrowserJob (taskMock, testRunMocks) {
        return testRunMocks.reduce((chain, testRun) => {
            return chain
                .then(() => taskMock._messageBus.emit('test-run-start', testRun))
                .then(() => log.push('test-run-start resolved'))
                .then(randomDelay)
                .then(() => taskMock._messageBus.emit('test-run-done', testRun))
                .then(() => log.push('test-run-done resolved'))
                .then(randomDelay);
        }, randomDelay());
    }

    beforeEach(() => {
        log = [];
    });

    it('MessageBus events', () => {
        function createReporter (messageBus) {
            return new Reporter({}, messageBus);
        }

        const messageBus = new MessageBus();

        createReporter(messageBus);

        expect(messageBus.listenerCount()).eql(7);
        expect(messageBus.listenerCount('warning-add')).eql(1);
        expect(messageBus.listenerCount('start')).eql(1);
        expect(messageBus.listenerCount('test-run-start')).eql(1);
        expect(messageBus.listenerCount('test-run-done')).eql(1);
        expect(messageBus.listenerCount('test-action-start')).eql(1);
        expect(messageBus.listenerCount('test-action-done')).eql(1);
        expect(messageBus.listenerCount('done')).eql(1);
    });

    it('Should analyze task progress and call appropriate plugin methods', function () {
        this.timeout(30000);

        const taskMock = new TaskMock();

        function createReporter () {
            return new Reporter({
                reportTaskStart: function (...args) {
                    expect(args[0]).to.be.a('date');

                    // NOTE: replace startTime
                    args[0] = new Date('Thu Jan 01 1970 00:00:00 UTC');

                    return delay(1000)
                        .then(() => log.push({ method: 'reportTaskStart', args: args }));
                },

                reportFixtureStart: function () {
                    return delay(1000)
                        .then(() => log.push({ method: 'reportFixtureStart', args: Array.prototype.slice.call(arguments) }));
                },

                reportTestStart: function (...args) {
                    expect(args[0]).to.be.an('string');
                    expect(args[2].startTime).to.be.a('date');

                    args[2].testRunIds = args[2].testRunIds.sort();

                    // NOTE: replace startTime
                    args[2].startTime = new Date('Thu Jan 01 1970 00:00:00 UTC');

                    return delay(1000)
                        .then(() => log.push({ method: 'reportTestStart', args: args }));
                },

                reportTestDone: function (...args) {
                    expect(args[1].durationMs).to.be.an('number');

                    // NOTE: replace durationMs
                    args[1].durationMs = 74000;
                    args[1].browsers = sortBy(args[1].browsers, ['alias']);

                    return delay(1000)
                        .then(() => log.push({ method: 'reportTestDone', args: args }));
                },

                reportTaskDone: function (...args) {
                    expect(args[0]).to.be.a('date');

                    // NOTE: replace endTime
                    args[0] = new Date('Thu Jan 01 1970 00:15:25 UTC');

                    return delay(1000)
                        .then(() => log.push({ method: 'reportTaskDone', args: args }));
                },
            }, taskMock._messageBus);
        }

        const expectedLog = [
            {
                method: 'reportTaskStart',
                args:   [
                    new Date('1970-01-01T00:00:00.000Z'),
                    [
                        'Chrome',
                        'Firefox',
                    ],
                    7,
                    [
                        {
                            fixture: {
                                id:    'fid1',
                                name:  'fixture1',
                                tests: [
                                    {
                                        id:   'idf1t1',
                                        name: 'fixture1test1',
                                        skip: false,
                                    },
                                    {
                                        id:   'idf1t2',
                                        name: 'fixture1test2',
                                        skip: false,
                                    },
                                    {
                                        id:   'idf1t3',
                                        name: 'fixture1test3',
                                        skip: false,
                                    },
                                ],
                            },
                        },
                        {
                            fixture: {
                                id:    'fid2',
                                name:  'fixture2',
                                tests: [
                                    {
                                        id:   'idf2t1',
                                        name: 'fixture2test1',
                                        skip: false,
                                    },
                                    {
                                        id:   'idf2t2',
                                        name: 'fixture2test2',
                                        skip: false,
                                    },
                                ],
                            },
                        },
                        {
                            fixture: {
                                id:    'fid3',
                                name:  'fixture3',
                                tests: [
                                    {
                                        id:   'idf3t1',
                                        name: 'fixture3test1',
                                        skip: false,
                                    },
                                    {
                                        id:   'idf3t2',
                                        name: 'fixture3test2',
                                        skip: true,
                                    },
                                    {
                                        id:   'idf3t3',
                                        name: 'fixture3test3',
                                        skip: false,
                                    },
                                ],
                            },
                        },
                    ],
                    // NOTE: task properties
                    {
                        configuration: {
                            disableMultipleWindows: false,
                            appInitDelay:           1000,
                            assertionTimeout:       3000,
                            browsers:               ['chrome', 'firefox'],
                            concurrency:            1,
                            dashboardUrl:           'https://example.com/path',
                            debugMode:              false,
                            debugOnFail:            false,
                            developmentMode:        false,
                            disablePageCaching:     false,
                            disablePageReloads:     false,
                            disableScreenshots:     false,
                            hostname:               'localhost',
                            pageLoadTimeout:        3000,
                            port1:                  1337,
                            port2:                  1338,
                            quarantineMode:         false,
                            reporter:               [{ name: 'customReporter' }],
                            retryTestPages:         false,
                            screenshots:            { path: '/path/to/screenshots' },
                            selectorTimeout:        10000,
                            skipJsErrors:           false,
                            skipUncaughtErrors:     false,
                            speed:                  1,
                            src:                    ['test.js'],
                            stopOnFirstFail:        false,
                            takeScreenshotsOnFails: false,
                        },

                        dashboardUrl: 'https://example.com/path',
                    },
                ],
            },
            {
                method: 'reportFixtureStart',
                args:   [
                    'fixture1',
                    './file1.js',
                    {
                        run: 'run-001',
                    },
                ],
            },
            'task-start resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture1test1',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf1t1',
                        testRunIds: [
                            'f1t1',
                            'f1t1ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   false,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture1test1',
                    {
                        errs:       [],
                        warnings:   [],
                        durationMs: 74000,
                        unstable:   true,
                        skipped:    false,
                        quarantine: {
                            1:             { passed: false },
                            2:             { passed: true },
                            'firstRunId':  { passed: false, errors: ['1', '2'] },
                            'secondRunId': { passed: true, errors: [] },
                        },
                        screenshotPath: '/screenshots/1445437598847',
                        screenshots:    [{
                            testRunId:         'idf1t1-1',
                            screenshotPath:    'screenshot1.png',
                            thumbnailPath:     'thumbnail1.png',
                            userAgent:         'chrome',
                            takenOnFail:       false,
                            quarantineAttempt: 2,
                        }],
                        videos:   [],
                        testId:   'idf1t1',
                        browsers: [
                            {
                                alias:                        'Chrome',
                                userAgent:                    'Chrome',
                                headless:                     false,
                                testRunId:                    'f1t1',
                                quarantineAttemptsTestRunIds: [
                                    'firstRunId',
                                    'secondRunId',
                                ],
                            },
                            {
                                alias:                        'Firefox',
                                userAgent:                    'Firefox',
                                headless:                     false,
                                testRunId:                    'f1t1ff',
                                quarantineAttemptsTestRunIds: [
                                    'firstRunId',
                                    'secondRunId',
                                ],
                            },
                        ],
                        fixture: {
                            id:   'fid1',
                            name: 'fixture1',
                            path: './file1.js',
                            meta: {
                                run: 'run-001',
                            },
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture1test2',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf1t2',
                        testRunIds: [
                            'f1t2',
                            'f1t2ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   false,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture1test2',
                    {
                        errs: [
                            {
                                text:      'err1',
                                userAgent: 'Chrome',
                            },
                            {
                                text:      'err2',
                                userAgent: 'Chrome',
                            },
                            {
                                text:      'err1',
                                userAgent: 'Firefox',
                            },
                        ],

                        warnings:       [],
                        durationMs:     74000,
                        unstable:       false,
                        skipped:        false,
                        quarantine:     null,
                        screenshotPath: '/screenshots/1445437598847',
                        screenshots:    [{
                            testRunId:         'idf1t2-1',
                            screenshotPath:    'screenshot1.png',
                            thumbnailPath:     'thumbnail1.png',
                            userAgent:         'chrome',
                            takenOnFail:       false,
                            quarantineAttempt: null,
                        }, {
                            testRunId:         'idf1t2-2',
                            screenshotPath:    'screenshot2.png',
                            thumbnailPath:     'thumbnail2.png',
                            userAgent:         'chrome',
                            takenOnFail:       true,
                            quarantineAttempt: null,
                        }],
                        videos:   [],
                        testId:   'idf1t2',
                        browsers: [
                            {
                                alias:     'Chrome',
                                userAgent: 'Chrome',
                                headless:  false,
                                testRunId: 'f1t2',
                            },
                            {
                                alias:     'Firefox',
                                userAgent: 'Firefox',
                                headless:  false,
                                testRunId: 'f1t2ff',
                            },
                        ],
                        fixture: {
                            id:   'fid1',
                            name: 'fixture1',
                            path: './file1.js',
                            meta: {
                                run: 'run-001',
                            },
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture1test3',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf1t3',
                        testRunIds: [
                            'f1t3',
                            'f1t3ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   false,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture1test3',
                    {
                        errs:           [],
                        warnings:       [],
                        durationMs:     74000,
                        unstable:       false,
                        skipped:        false,
                        quarantine:     null,
                        screenshotPath: null,
                        screenshots:    [],
                        videos:         [],
                        testId:         'idf1t3',
                        browsers:       [
                            {
                                alias:     'Chrome',
                                userAgent: 'Chrome',
                                headless:  false,
                                testRunId: 'f1t3',
                            },
                            {
                                alias:     'Firefox',
                                userAgent: 'Firefox',
                                headless:  false,
                                testRunId: 'f1t3ff',
                            },
                        ],
                        fixture: {
                            id:   'fid1',
                            name: 'fixture1',
                            path: './file1.js',
                            meta: {
                                run: 'run-001',
                            },
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            {
                method: 'reportFixtureStart',
                args:   [
                    'fixture2',
                    './file1.js',
                    {
                        run: 'run-002',
                    },
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture2test1',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf2t1',
                        testRunIds: [
                            'f2t1',
                            'f2t1ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   false,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture2test1',
                    {
                        errs:           [],
                        warnings:       [],
                        durationMs:     74000,
                        unstable:       false,
                        skipped:        false,
                        quarantine:     null,
                        screenshotPath: null,
                        screenshots:    [],
                        videos:         [],
                        testId:         'idf2t1',
                        browsers:       [
                            {
                                alias:     'Chrome',
                                userAgent: 'Chrome',
                                headless:  false,
                                testRunId: 'f2t1',
                            },
                            {
                                alias:     'Firefox',
                                userAgent: 'Firefox',
                                headless:  false,
                                testRunId: 'f2t1ff',
                            },
                        ],
                        fixture: {
                            id:   'fid2',
                            name: 'fixture2',
                            path: './file1.js',
                            meta: {
                                run: 'run-002',
                            },
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture2test2',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf2t2',
                        testRunIds: [
                            'f2t2',
                            'f2t2ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   false,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture2test2',
                    {
                        errs:           [],
                        warnings:       [],
                        durationMs:     74000,
                        unstable:       false,
                        skipped:        false,
                        quarantine:     null,
                        screenshotPath: null,
                        screenshots:    [],
                        videos:         [],
                        testId:         'idf2t2',
                        browsers:       [
                            {
                                alias:     'Chrome',
                                userAgent: 'Chrome',
                                headless:  false,
                                testRunId: 'f2t2',
                            },
                            {
                                alias:     'Firefox',
                                userAgent: 'Firefox',
                                headless:  false,
                                testRunId: 'f2t2ff',
                            },
                        ],
                        fixture: {
                            id:   'fid2',
                            name: 'fixture2',
                            path: './file1.js',
                            meta: {
                                run: 'run-002',
                            },
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            {
                method: 'reportFixtureStart',
                args:   [
                    'fixture3',
                    './file2.js',
                    null,
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture3test1',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf3t1',
                        testRunIds: [
                            'f3t1',
                            'f3t1ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   false,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture3test1',
                    {
                        errs: [
                            {
                                text:      'err1',
                                userAgent: 'Firefox',
                            },
                        ],

                        warnings:       ['warning1'],
                        durationMs:     74000,
                        unstable:       true,
                        skipped:        false,
                        quarantine:     null,
                        screenshotPath: null,
                        screenshots:    [],
                        videos:         [],
                        testId:         'idf3t1',
                        browsers:       [
                            {
                                alias:     'Chrome',
                                userAgent: 'Chrome',
                                headless:  false,
                                testRunId: 'f3t1',
                            },
                            {
                                alias:     'Firefox',
                                userAgent: 'Firefox',
                                headless:  false,
                                testRunId: 'f3t1ff',
                            },
                        ],
                        fixture: {
                            id:   'fid3',
                            name: 'fixture3',
                            path: './file2.js',
                            meta: null,
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture3test2',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf3t2',
                        testRunIds: [
                            'f3t2',
                            'f3t2ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   true,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture3test2',
                    {
                        errs:           [],
                        warnings:       [],
                        durationMs:     74000,
                        unstable:       true,
                        skipped:        true,
                        quarantine:     null,
                        screenshotPath: null,
                        screenshots:    [],
                        videos:         [],
                        testId:         'idf3t2',
                        browsers:       [
                            {
                                alias:     'Chrome',
                                userAgent: 'Chrome',
                                headless:  false,
                                testRunId: 'f3t2',
                            },
                            {
                                alias:     'Firefox',
                                userAgent: 'Firefox',
                                headless:  false,
                                testRunId: 'f3t2ff',
                            },
                        ],
                        fixture: {
                            id:   'fid3',
                            name: 'fixture3',
                            path: './file2.js',
                            meta: null,
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTestStart',
                args:   [
                    'fixture3test3',
                    {
                        run: 'run-001',
                    },
                    {
                        testId:     'idf3t3',
                        testRunIds: [
                            'f3t3',
                            'f3t3ff',
                        ],
                        startTime: new Date('1970-01-01T00:00:00.000Z'),
                        skipped:   false,
                    },
                ],
            },
            'test-run-start resolved',
            'test-run-start resolved',
            {
                method: 'reportTestDone',
                args:   [
                    'fixture3test3',
                    {
                        errs:           [],
                        warnings:       ['warning2', 'warning3'],
                        durationMs:     74000,
                        unstable:       true,
                        skipped:        false,
                        quarantine:     null,
                        screenshotPath: null,
                        screenshots:    [],
                        videos:         [],
                        testId:         'idf3t3',
                        browsers:       [
                            {
                                alias:     'Chrome',
                                userAgent: 'Chrome',
                                headless:  false,
                                testRunId: 'f3t3',
                            },
                            {
                                alias:     'Firefox',
                                userAgent: 'Firefox',
                                headless:  false,
                                testRunId: 'f3t3ff',
                            },
                        ],
                        fixture: {
                            id:   'fid3',
                            name: 'fixture3',
                            path: './file2.js',
                            meta: null,
                        },
                    },
                    {
                        run: 'run-001',
                    },
                ],
            },
            'test-run-done resolved',
            'test-run-done resolved',
            {
                method: 'reportTaskDone',
                args:   [
                    new Date('1970-01-01T00:15:25.000Z'),
                    5,
                    ['warning1', 'warning2', 'warning3'],
                    { passedCount: 5, failedCount: 2, skippedCount: 1 },
                ],
            },
            'task-done resolved',
        ];

        createReporter(taskMock);

        return taskMock._messageBus
            .emit('start', taskMock)
            .then(() => {
                log.push('task-start resolved');
                return Promise.all([
                    emulateBrowserJob(taskMock, chromeTestRunMocks),
                    emulateBrowserJob(taskMock, firefoxTestRunMocks),
                ]);
            })
            .then(() => taskMock._messageBus.emit('done'))
            .then(() => {
                log.push('task-done resolved');

                expect(log).eql(expectedLog);
            });
    });

    it('Should disable colors if plugin has "noColors" flag', () => {
        const taskMock = new TaskMock();
        const reporter = new Reporter({ noColors: true }, taskMock._messageBus);

        expect(reporter.plugin.chalk.enabled).to.be.false;
    });

    it('Should provide videos info to the reporter', function () {
        this.timeout(3000);

        const videoLog = [];
        const taskMock = new TaskMock();

        taskMock.videos = new VideosMock({
            'idf1t1': {
                recordings: [{
                    testRunId: 'f1t1-id1',
                    videoPath: 'f1t1-path1',
                }, {
                    testRunId: 'f1t1-id2',
                    videoPath: 'f1t1-path2',
                }],
            },
            'idf1t2': {
                recordings: [{
                    testRunId: 'f1t2-id1',
                    videoPath: 'f1t2-path1',
                }, {
                    testRunId: 'f1t2-id2',
                    videoPath: 'f1t2-path2',
                }],
            },
        });

        function createReporter () {
            return new Reporter({
                reportTaskStart:    noop,
                reportTaskDone:     noop,
                reportFixtureStart: noop,
                reportTestStart:    noop,
                reportTestDone:     (name, testRunInfo) => {
                    videoLog.push(testRunInfo.videos);
                },
            }, taskMock._messageBus);
        }

        createReporter();

        return taskMock._messageBus.emit('start', taskMock)
            .then(() => {
                return Promise.all([
                    emulateBrowserJob(taskMock, chromeTestRunMocks.slice(0, 2)),
                    emulateBrowserJob(taskMock, firefoxTestRunMocks.slice(0, 2)),
                ]);
            })
            .then(() => {
                expect(videoLog).eql([
                    [
                        { testRunId: 'f1t1-id1', videoPath: 'f1t1-path1' },
                        { testRunId: 'f1t1-id2', videoPath: 'f1t1-path2' },
                    ],
                    [
                        { testRunId: 'f1t2-id1', videoPath: 'f1t2-path1' },
                        { testRunId: 'f1t2-id2', videoPath: 'f1t2-path2' },
                    ]]
                );
            });
    });

    it('Should dispatch uncaught exception from any plugin method to Task `error` event', async () => {
        function createBrokenReporter (task) {
            const reporterObject = {};

            for (const method of Object.values(ReporterPluginMethod)) {
                reporterObject[method] = () => {
                    throw new Error(`oops`);
                };
            }

            return new Reporter(reporterObject, task._messageBus, null, 'customReporter');
        }

        const taskMock = new TaskMock();

        taskMock.on('error', e => log.push(e));

        const reporter = createBrokenReporter(taskMock);

        for (const method of Object.values(ReporterPluginMethod)) {
            await reporter.dispatchToPlugin({ method, initialObject: taskMock });

            const lastErr = log.pop();

            expect(lastErr).instanceOf(ReporterPluginError);
            expect(lastErr.message).startsWith(`The "${method}" method of the "customReporter" reporter produced an uncaught error. Error details:\nError: oops`);
        }
    });
});
