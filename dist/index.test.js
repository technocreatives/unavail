"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var luxon_1 = require("luxon");
var index_1 = require("./index");
test("buffering works how I think it does", function () {
    var inputInterval = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T13:00:00Z").toUTC());
    var buffer = luxon_1.Duration.fromObject({ minutes: 30 });
    var bufferedInterval = luxon_1.Interval.fromDateTimes(inputInterval.start.minus(buffer), inputInterval.end.plus(buffer));
    expect(bufferedInterval.start.toISO({
        suppressMilliseconds: true,
    })).toBe("2020-01-01T11:30:00Z");
    expect(bufferedInterval.end.toISO({
        suppressMilliseconds: true,
    })).toBe("2020-01-01T13:30:00Z");
});
test("overlapping works how I think it does", function () {
    var inputInterval = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T13:00:00Z").toUTC());
    var buffer = luxon_1.Duration.fromObject({ minutes: 30 });
    var bufferedInterval = luxon_1.Interval.fromDateTimes(inputInterval.start.minus(buffer), inputInterval.end.plus(buffer));
    var prevInterval = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T11:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T12:00:00Z").toUTC());
    var nextInterval = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T13:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T14:00:00Z").toUTC());
    expect(prevInterval.overlaps(inputInterval)).toBe(false);
    expect(prevInterval.overlaps(bufferedInterval)).toBe(true);
    expect(nextInterval.overlaps(inputInterval)).toBe(false);
    expect(nextInterval.overlaps(bufferedInterval)).toBe(true);
});
test("it works at all", function () {
    var a = index_1.UnavailabilityCalculator.create(luxon_1.Duration.fromObject({ seconds: 0 }), "Utc");
    expect(a.hourlyUnavailabilityForDay(luxon_1.DateTime.now().toUTC(), {
        intervals: [],
        totalUniqueIdentifiers: 0,
    })).toHaveLength(24);
});
test("hours are handled", function () {
    var testIntervalA = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T02:00:00Z").toUTC());
    var testIntervalB = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T04:00:00Z").toUTC());
    var testIntervalC = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T22:00:00Z").toUTC());
    var testIntervalD = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-02T01:00:00Z").toUTC());
    var unavailData = {
        intervals: [
            {
                interval: testIntervalA,
                identifiers: ["test-a"],
            },
            {
                interval: testIntervalB,
                identifiers: ["test-a", "test-b", "test-c"],
            },
            {
                interval: testIntervalC,
                identifiers: ["test-a", "test-b"],
            },
            {
                interval: testIntervalD,
                identifiers: ["test-a"],
            },
        ],
        totalUniqueIdentifiers: 3,
    };
    var a = index_1.UnavailabilityCalculator.create(luxon_1.Duration.fromObject({ seconds: 0 }), "Utc");
    var data = a.hourlyUnavailabilityForDay(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(), unavailData);
    var expectations = {
        0: ["test-a"],
        1: ["test-a"],
        2: [],
        3: ["test-a", "test-b", "test-c"],
        4: [],
        5: [],
        6: [],
        7: [],
        8: [],
        9: [],
        10: [],
        11: [],
        12: ["test-a", "test-b"],
        13: ["test-a", "test-b"],
        14: ["test-a", "test-b"],
        15: ["test-a", "test-b"],
        16: ["test-a", "test-b"],
        17: ["test-a", "test-b"],
        18: ["test-a", "test-b"],
        19: ["test-a", "test-b"],
        20: ["test-a", "test-b"],
        21: ["test-a", "test-b"],
        22: [],
        23: ["test-a"],
    };
    var result = __assign({}, data.map(function (x) { return x.identifiers; }));
    expect(result).toEqual(expectations);
    expect(data[3].percentUnavailable).toBe(1);
    expect(data[21].percentUnavailable).toBe(0.6666666666666666);
    expect(data[22].percentUnavailable).toBe(0);
    expect(data[23].percentUnavailable).toBe(0.3333333333333333);
});
test("hours are handled with buffer", function () {
    var testIntervalA = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T02:00:00Z").toUTC());
    var testIntervalB = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T04:00:00Z").toUTC());
    var testIntervalC = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T22:00:00Z").toUTC());
    var testIntervalD = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-02T01:00:00Z").toUTC());
    var unavailData = {
        intervals: [
            {
                interval: testIntervalA,
                identifiers: ["test-a"],
            },
            {
                interval: testIntervalB,
                identifiers: ["test-a", "test-b", "test-c"],
            },
            {
                interval: testIntervalC,
                identifiers: ["test-a", "test-b"],
            },
            {
                interval: testIntervalD,
                identifiers: ["test-a"],
            },
        ],
        totalUniqueIdentifiers: 3,
    };
    var a = index_1.UnavailabilityCalculator.create(luxon_1.Duration.fromObject({ minutes: 30 }), "Utc");
    var data = a.hourlyUnavailabilityForDay(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(), unavailData);
    var expectations = {
        0: ["test-a"],
        1: ["test-a"],
        2: ["test-a", "test-b", "test-c"],
        3: ["test-a", "test-b", "test-c"],
        4: ["test-a", "test-b", "test-c"],
        5: [],
        6: [],
        7: [],
        8: [],
        9: [],
        10: [],
        11: ["test-a", "test-b"],
        12: ["test-a", "test-b"],
        13: ["test-a", "test-b"],
        14: ["test-a", "test-b"],
        15: ["test-a", "test-b"],
        16: ["test-a", "test-b"],
        17: ["test-a", "test-b"],
        18: ["test-a", "test-b"],
        19: ["test-a", "test-b"],
        20: ["test-a", "test-b"],
        21: ["test-a", "test-b"],
        22: ["test-a", "test-b"],
        23: ["test-a"],
    };
    var result = __assign({}, data.map(function (x) { return x.identifiers; }));
    expect(result).toEqual(expectations);
});
test("hours are handled with timezone", function () {
    var testIntervalA = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T02:00:00Z").toUTC());
    var testIntervalB = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T04:00:00Z").toUTC());
    var testIntervalC = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T22:00:00Z").toUTC());
    var testIntervalD = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-02T01:00:00Z").toUTC());
    var unavailData = {
        intervals: [
            {
                interval: testIntervalA,
                identifiers: ["test-a"],
            },
            {
                interval: testIntervalB,
                identifiers: ["test-a", "test-b", "test-c"],
            },
            {
                interval: testIntervalC,
                identifiers: ["test-a", "test-b"],
            },
            {
                interval: testIntervalD,
                identifiers: ["test-a"],
            },
        ],
        totalUniqueIdentifiers: 3,
    };
    var a = index_1.UnavailabilityCalculator.create(luxon_1.Duration.fromObject({ minutes: 30 }), "Europe/Stockholm");
    var data = a.hourlyUnavailabilityForDay(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z")
        .toUTC()
        .setZone("Europe/Stockholm"), unavailData);
    var expectations = {
        0: ["test-a"],
        1: ["test-a"],
        2: ["test-a"],
        3: ["test-a", "test-b", "test-c"],
        4: ["test-a", "test-b", "test-c"],
        5: ["test-a", "test-b", "test-c"],
        6: [],
        7: [],
        8: [],
        9: [],
        10: [],
        11: [],
        12: ["test-a", "test-b"],
        13: ["test-a", "test-b"],
        14: ["test-a", "test-b"],
        15: ["test-a", "test-b"],
        16: ["test-a", "test-b"],
        17: ["test-a", "test-b"],
        18: ["test-a", "test-b"],
        19: ["test-a", "test-b"],
        20: ["test-a", "test-b"],
        21: ["test-a", "test-b"],
        22: ["test-a", "test-b"],
        23: ["test-a", "test-b"],
    };
    var result = __assign({}, data.map(function (x) { return x.identifiers; }));
    expect(result).toEqual(expectations);
});
test("buffers are handled with interesting patterns", function () {
    var testIntervalA = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T02:00:00Z").toUTC());
    var testIntervalB = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T04:00:00Z").toUTC());
    var testIntervalC = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-01T22:00:00Z").toUTC());
    var testIntervalD = luxon_1.Interval.fromDateTimes(luxon_1.DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(), luxon_1.DateTime.fromISO("2020-01-02T01:00:00Z").toUTC());
    var unavailData = {
        intervals: [
            {
                interval: testIntervalA,
                identifiers: ["test-a"],
            },
            {
                interval: testIntervalB,
                identifiers: ["test-c"],
            },
            {
                interval: testIntervalC,
                identifiers: ["test-a", "test-c"],
            },
            {
                interval: testIntervalD,
                identifiers: ["test-b"],
            },
        ],
        totalUniqueIdentifiers: 3,
    };
    var a = index_1.UnavailabilityCalculator.create(luxon_1.Duration.fromObject({ minutes: 30 }), "Europe/Stockholm");
    var data = a.hourlyUnavailabilityForDay(luxon_1.DateTime.fromISO("2020-01-01T00:00:00Z")
        .toUTC()
        .setZone("Europe/Stockholm"), unavailData);
    var expectations = {
        0: ["test-a"],
        1: ["test-a"],
        2: ["test-a"],
        3: ["test-a", "test-c"],
        4: ["test-c"],
        5: ["test-c"],
        6: [],
        7: [],
        8: [],
        9: [],
        10: [],
        11: [],
        12: ["test-a", "test-c"],
        13: ["test-a", "test-c"],
        14: ["test-a", "test-c"],
        15: ["test-a", "test-c"],
        16: ["test-a", "test-c"],
        17: ["test-a", "test-c"],
        18: ["test-a", "test-c"],
        19: ["test-a", "test-c"],
        20: ["test-a", "test-c"],
        21: ["test-a", "test-c"],
        22: ["test-a", "test-c"],
        23: ["test-a", "test-b", "test-c"],
    };
    var result = __assign({}, data.map(function (x) { return x.identifiers; }));
    expect(result).toEqual(expectations);
});
