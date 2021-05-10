import { DateTime, Interval, Duration } from "luxon";
export declare type UnavailabilityInterval = {
    interval: Interval;
    identifiers: Identifier[];
};
export declare type Identifier = string;
export declare type UnavailabilityInput = {
    totalUniqueIdentifiers: number;
    intervals: UnavailabilityInterval[];
};
export declare type HourlyUnavailability = {
    hour: Interval;
    identifiers: Identifier[];
    percentUnavailable: number;
};
export declare type DailyUnavailability = {
    day: Interval;
    hourly: HourlyUnavailability[];
    percentUnavailable: number;
};
export declare class UnavailabilityCalculator {
    readonly buffer: Duration;
    readonly timeZone: string;
    static create(buffer: Duration, timeZone: string): UnavailabilityCalculator;
    private constructor();
    private unavailabilityForInterval;
    private getPercentUnavailable;
    hourlyUnavailabilityForDay(dateTime: DateTime, input: UnavailabilityInput): HourlyUnavailability[];
    dailyUnavailabilityForMonth(dateTime: DateTime, input: UnavailabilityInput): DailyUnavailability[];
}
