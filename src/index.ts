import { DateTime, Interval, Duration } from "luxon"

export type UnavailabilityInterval = {
  /// Interval of time where an item is unavailable.
  interval: Interval

  /// The opaque identifiers for the items that are presently unavailable.
  ///
  /// Invariants: this list must be considered a set. Duplicates may not be present.
  identifiers: Identifier[]
}

export type Identifier = string

export type UnavailabilityInput = {
  /// This is how many items are in scope for the availability check.
  totalUniqueIdentifiers: number

  /// These are the actual intervals of time where a given set of items are unavailable.
  ///
  /// Invariants: this list must be ordered by interval time. Intervals may not overlap.
  ///             It must be safe to binary search this list.
  intervals: UnavailabilityInterval[]
}

export type HourlyUnavailability = {
  hour: Interval
  identifiers: Identifier[]
  percentUnavailable: number
}

export type DailyUnavailability = {
  day: Interval
  hourly: HourlyUnavailability[]
  percentUnavailable: number
}

export class UnavailabilityCalculator {
  /// The mandatory buffer between bookings
  readonly buffer: Duration

  /// The timezone to coerce all values to for calculation
  readonly timeZone: string

  static create(buffer: Duration, timeZone: string): UnavailabilityCalculator {
    return new UnavailabilityCalculator(buffer, timeZone)
  }

  private constructor(buffer: Duration, timeZone: string) {
    this.buffer = buffer
    this.timeZone = timeZone
  }

  private unavailabilityForInterval(
    inputInterval: Interval,
    input: UnavailabilityInput
  ): Identifier[] {
    const bufferedInterval = Interval.fromDateTimes(
      inputInterval.start.minus(this.buffer),
      inputInterval.end.plus(this.buffer)
    )
    const overlaps = input.intervals
      .filter(({ interval }) => interval.overlaps(bufferedInterval))
      .reduce((acc: Identifier[], cur) => {
        return [...acc, ...cur.identifiers]
      }, [])

    const uniq = new Set(overlaps)
    const list = [...uniq]
    list.sort()

    return list
  }

  private getPercentUnavailable(input: UnavailabilityInput, count: number) {
    if (input.totalUniqueIdentifiers <= 0) {
      return 0
    }

    return count / input.totalUniqueIdentifiers
  }

  hourlyUnavailabilityForDay(
    dateTime: DateTime,
    input: UnavailabilityInput
  ): HourlyUnavailability[] {
    const dayStart = dateTime.setZone(this.timeZone).startOf("day")
    const dayEnd = dayStart.plus({ days: 1 })
    const dayInterval = Interval.fromDateTimes(dayStart, dayEnd)
    const hours = dayInterval.splitBy(Duration.fromObject({ hours: 1 }))
    return hours.map((hour) => {
      const identifiers = this.unavailabilityForInterval(hour, input)
      const percentUnavailable = this.getPercentUnavailable(
        input,
        identifiers.length
      )
      return { hour, identifiers, percentUnavailable }
    })
  }

  dailyUnavailabilityForMonth(
    dateTime: DateTime,
    input: UnavailabilityInput
  ): DailyUnavailability[] {
    const monthStart = dateTime.setZone(this.timeZone).startOf("month")
    const monthEnd = monthStart.plus({ months: 1 }).startOf("month")
    const monthInterval = Interval.fromDateTimes(monthStart, monthEnd)
    const days = monthInterval.splitBy(Duration.fromObject({ days: 1 }))
    return days.map((day) => {
      const hourly = this.hourlyUnavailabilityForDay(day.start, input)
      const percentUnavailable = this.getPercentUnavailable(
        input,
        hourly.reduce((acc, cur) => acc + cur.identifiers.length, 0) / 24
      )
      return { day, hourly, percentUnavailable }
    })
  }
}
