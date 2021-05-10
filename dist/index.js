"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnavailabilityCalculator = void 0;
var luxon_1 = require("luxon");
var UnavailabilityCalculator = /** @class */ (function () {
    function UnavailabilityCalculator(buffer, timeZone) {
        this.buffer = buffer;
        this.timeZone = timeZone;
    }
    UnavailabilityCalculator.create = function (buffer, timeZone) {
        return new UnavailabilityCalculator(buffer, timeZone);
    };
    UnavailabilityCalculator.prototype.unavailabilityForInterval = function (inputInterval, input) {
        var bufferedInterval = luxon_1.Interval.fromDateTimes(inputInterval.start.minus(this.buffer), inputInterval.end.plus(this.buffer));
        var overlaps = input.intervals
            .filter(function (_a) {
            var interval = _a.interval;
            return interval.overlaps(bufferedInterval);
        })
            .reduce(function (acc, cur) {
            return __spreadArray(__spreadArray([], __read(acc)), __read(cur.identifiers));
        }, []);
        var uniq = new Set(overlaps);
        var list = __spreadArray([], __read(uniq));
        list.sort();
        return list;
    };
    UnavailabilityCalculator.prototype.getPercentUnavailable = function (input, count) {
        if (input.totalUniqueIdentifiers <= 0) {
            return 0;
        }
        return count / input.totalUniqueIdentifiers;
    };
    UnavailabilityCalculator.prototype.hourlyUnavailabilityForDay = function (dateTime, input) {
        var _this = this;
        var dayStart = dateTime.setZone(this.timeZone).startOf("day");
        var dayEnd = dayStart.plus({ days: 1 });
        var dayInterval = luxon_1.Interval.fromDateTimes(dayStart, dayEnd);
        var hours = dayInterval.splitBy(luxon_1.Duration.fromObject({ hours: 1 }));
        return hours.map(function (hour) {
            var identifiers = _this.unavailabilityForInterval(hour, input);
            var percentUnavailable = _this.getPercentUnavailable(input, identifiers.length);
            return { hour: hour, identifiers: identifiers, percentUnavailable: percentUnavailable };
        });
    };
    UnavailabilityCalculator.prototype.dailyUnavailabilityForMonth = function (dateTime, input) {
        var _this = this;
        var monthStart = dateTime.setZone(this.timeZone).startOf("month");
        var monthEnd = monthStart.plus({ months: 1 }).startOf("month");
        var monthInterval = luxon_1.Interval.fromDateTimes(monthStart, monthEnd);
        var days = monthInterval.splitBy(luxon_1.Duration.fromObject({ days: 1 }));
        return days.map(function (day) {
            var hourly = _this.hourlyUnavailabilityForDay(day.start, input);
            var percentUnavailable = _this.getPercentUnavailable(input, hourly.reduce(function (acc, cur) { return acc + cur.identifiers.length; }, 0) / 24);
            return { day: day, hourly: hourly, percentUnavailable: percentUnavailable };
        });
    };
    return UnavailabilityCalculator;
}());
exports.UnavailabilityCalculator = UnavailabilityCalculator;
