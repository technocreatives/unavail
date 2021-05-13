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

  private bufferedInterval(interval: Interval): Interval {
    return Interval.fromDateTimes(
      interval.start.minus(this.buffer),
      interval.end.plus(this.buffer)
    )
  }

  private unavailabilityForInterval(
    inputInterval: Interval,
    input: UnavailabilityInput
  ): Identifier[] {
    const bufferedInterval = this.bufferedInterval(inputInterval)
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

  private firstUnavailableDays(
    start: DateTime,
    input: UnavailabilityInput
  ): Record<string, Interval> {
    let total = 0
    const out: Record<string, Interval> = {}

    for (const range of input.intervals) {
      if (range.interval.isBefore(start)) {
        continue
      }

      for (const id of range.identifiers) {
        if (out[id] == null) {
          total += 1
          out[id] = this.bufferedInterval(range.interval)
        }
      }
      if (total >= input.totalUniqueIdentifiers) {
        break
      }
    }
    return out
  }

  private lastAvailableSlot(
    start: DateTime,
    input: UnavailabilityInput
  ): DateTime | null {
    const values = Object.values(this.firstUnavailableDays(start, input)).map(
      (x) => x.start
    )
    if (values.length === 0 || values.length < input.totalUniqueIdentifiers) {
      return null
    }

    values.sort((a: DateTime, b: DateTime) =>
      a.toMillis() < b.toMillis() ? 1 : -1
    )

    return values.filter((x) => x.toMillis() > start.toMillis())[0]
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

  availabilityIntervalForStartDateTime(
    startDateTime: DateTime,
    input: UnavailabilityInput
  ): Interval | null {
    const endDateTime = this.lastAvailableSlot(
      startDateTime.setZone(this.timeZone),
      input
    )
    if (endDateTime == null) {
      return null
    }
    return Interval.fromDateTimes(
      startDateTime.setZone(this.timeZone),
      endDateTime.minus(this.buffer).setZone(this.timeZone)
    )
  }
}
