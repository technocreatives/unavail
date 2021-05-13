import { DateTime, Interval, Duration } from "luxon"
import {
  UnavailabilityCalculator,
  Identifier,
  UnavailabilityInput,
} from "./index"

test("buffering works how I think it does", () => {
  const inputInterval = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T13:00:00Z").toUTC()
  )
  const buffer = Duration.fromObject({ minutes: 30 })
  const bufferedInterval = Interval.fromDateTimes(
    inputInterval.start.minus(buffer),
    inputInterval.end.plus(buffer)
  )

  expect(
    bufferedInterval.start.toISO({
      suppressMilliseconds: true,
    })
  ).toBe("2020-01-01T11:30:00Z")

  expect(
    bufferedInterval.end.toISO({
      suppressMilliseconds: true,
    })
  ).toBe("2020-01-01T13:30:00Z")
})

test("overlapping works how I think it does", () => {
  const inputInterval = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T13:00:00Z").toUTC()
  )
  const buffer = Duration.fromObject({ minutes: 30 })
  const bufferedInterval = Interval.fromDateTimes(
    inputInterval.start.minus(buffer),
    inputInterval.end.plus(buffer)
  )

  const prevInterval = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T11:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC()
  )

  const nextInterval = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T13:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T14:00:00Z").toUTC()
  )

  expect(prevInterval.overlaps(inputInterval)).toBe(false)
  expect(prevInterval.overlaps(bufferedInterval)).toBe(true)

  expect(nextInterval.overlaps(inputInterval)).toBe(false)
  expect(nextInterval.overlaps(bufferedInterval)).toBe(true)
})

test("it works at all", () => {
  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ seconds: 0 }),
    "Utc"
  )
  expect(
    a.hourlyUnavailabilityForDay(DateTime.now().toUTC(), {
      intervals: [],
      totalUniqueIdentifiers: 0,
    })
  ).toHaveLength(24)
})

test("hours are handled", () => {
  const testIntervalA = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T02:00:00Z").toUTC()
  )

  const testIntervalB = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC()
  )

  const testIntervalC = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T22:00:00Z").toUTC()
  )

  const testIntervalD = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-02T01:00:00Z").toUTC()
  )

  const unavailData: UnavailabilityInput = {
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
  }

  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ seconds: 0 }),
    "Utc"
  )
  const data = a.hourlyUnavailabilityForDay(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    unavailData
  )

  const expectations: { [key: string]: Identifier[] } = {
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
  }

  const result = { ...data.map((x) => x.identifiers) }
  expect(result).toEqual(expectations)

  expect(data[3].percentUnavailable).toBe(1)
  expect(data[21].percentUnavailable).toBe(0.6666666666666666)
  expect(data[22].percentUnavailable).toBe(0)
  expect(data[23].percentUnavailable).toBe(0.3333333333333333)
})

test("hours are handled with buffer", () => {
  const testIntervalA = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T02:00:00Z").toUTC()
  )

  const testIntervalB = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC()
  )

  const testIntervalC = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T22:00:00Z").toUTC()
  )

  const testIntervalD = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-02T01:00:00Z").toUTC()
  )

  const unavailData: UnavailabilityInput = {
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
  }

  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ minutes: 30 }),
    "Utc"
  )
  const data = a.hourlyUnavailabilityForDay(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    unavailData
  )

  const expectations: { [key: string]: Identifier[] } = {
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
  }

  const result = { ...data.map((x) => x.identifiers) }
  expect(result).toEqual(expectations)
})

test("hours are handled with timezone", () => {
  const testIntervalA = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T02:00:00Z").toUTC()
  )

  const testIntervalB = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC()
  )

  const testIntervalC = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T22:00:00Z").toUTC()
  )

  const testIntervalD = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-02T01:00:00Z").toUTC()
  )

  const unavailData: UnavailabilityInput = {
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
  }

  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ minutes: 30 }),
    "Europe/Stockholm"
  )
  const data = a.hourlyUnavailabilityForDay(
    DateTime.fromISO("2020-01-01T00:00:00Z")
      .toUTC()
      .setZone("Europe/Stockholm"),
    unavailData
  )

  const expectations: { [key: string]: Identifier[] } = {
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
  }

  const result = { ...data.map((x) => x.identifiers) }
  expect(result).toEqual(expectations)
})

test("buffers are handled with interesting patterns", () => {
  const testIntervalA = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T02:00:00Z").toUTC()
  )

  const testIntervalB = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T03:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC()
  )

  const testIntervalC = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T22:00:00Z").toUTC()
  )

  const testIntervalD = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T23:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-02T01:00:00Z").toUTC()
  )

  const unavailData: UnavailabilityInput = {
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
  }

  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ minutes: 30 }),
    "Europe/Stockholm"
  )
  const data = a.hourlyUnavailabilityForDay(
    DateTime.fromISO("2020-01-01T00:00:00Z")
      .toUTC()
      .setZone("Europe/Stockholm"),
    unavailData
  )

  const expectations: { [key: string]: Identifier[] } = {
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
  }

  const result = { ...data.map((x) => x.identifiers) }
  expect(result).toEqual(expectations)
})

test("can find first available time period for given start date", () => {
  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ minutes: 30 }),
    "Europe/Stockholm"
  )

  const testIntervalA = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC()
  )
  const testIntervalB = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T02:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T06:00:00Z").toUTC()
  )
  const testIntervalC = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T08:00:00Z").toUTC()
  )

  const unavailData: UnavailabilityInput = {
    intervals: [
      {
        interval: testIntervalA,
        identifiers: ["test-a"],
      },
      {
        interval: testIntervalB,
        identifiers: ["test-b"],
      },
      {
        interval: testIntervalC,
        identifiers: ["test-c"],
      },
    ],
    totalUniqueIdentifiers: 3,
  }

  const interval = a.availabilityIntervalForStartDateTime(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    unavailData
  )

  expect(interval).not.toBeNull()

  expect(interval!.start.toUTC().toISO()).toBe(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC().toISO()
  )
  expect(interval!.end.toUTC().toISO()).toBe(
    DateTime.fromISO("2020-01-01T03:00:00Z").toUTC().toISO()
  )
})

test("can find first available time period for given start date 2", () => {
  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ minutes: 30 }),
    "Europe/Stockholm"
  )

  const testIntervalA = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC()
  )
  const testIntervalB = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T23:00:00Z").toUTC()
  )
  const testIntervalC = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T11:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T19:00:00Z").toUTC()
  )

  const unavailData: UnavailabilityInput = {
    intervals: [
      {
        interval: testIntervalA,
        identifiers: ["test-a"],
      },
      {
        interval: testIntervalB,
        identifiers: ["test-b"],
      },
      {
        interval: testIntervalC,
        identifiers: ["test-c"],
      },
    ],
    totalUniqueIdentifiers: 3,
  }

  const interval = a.availabilityIntervalForStartDateTime(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    unavailData
  )

  expect(interval).not.toBeNull()

  expect(interval!.start.toUTC().toISO()).toBe(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC().toISO()
  )
  expect(interval!.end.toUTC().toISO()).toBe(
    DateTime.fromISO("2020-01-01T11:00:00Z").toUTC().toISO()
  )
})

test("that if there's not 100% coverage for identifiers, that the interval is null", () => {
  const a = UnavailabilityCalculator.create(
    Duration.fromObject({ minutes: 30 }),
    "Europe/Stockholm"
  )

  const testIntervalA = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T04:00:00Z").toUTC()
  )
  const testIntervalB = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T12:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T23:00:00Z").toUTC()
  )
  const testIntervalC = Interval.fromDateTimes(
    DateTime.fromISO("2020-01-01T11:00:00Z").toUTC(),
    DateTime.fromISO("2020-01-01T19:00:00Z").toUTC()
  )

  const unavailData: UnavailabilityInput = {
    intervals: [
      {
        interval: testIntervalA,
        identifiers: ["test-a"],
      },
      {
        interval: testIntervalB,
        identifiers: ["test-b"],
      },
      {
        interval: testIntervalC,
        identifiers: ["test-c"],
      },
    ],
    totalUniqueIdentifiers: 100,
  }

  const interval = a.availabilityIntervalForStartDateTime(
    DateTime.fromISO("2020-01-01T00:00:00Z").toUTC(),
    unavailData
  )

  expect(interval).toBeNull()
})
