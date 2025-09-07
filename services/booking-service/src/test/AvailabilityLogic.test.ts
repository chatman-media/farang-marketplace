import { describe, it, expect } from "vitest"

describe("Availability Service Logic", () => {
  describe("Time Slot Generation", () => {
    it("should generate correct time slots", () => {
      const slots = []

      for (let hour = 9; hour < 18; hour++) {
        slots.push({
          start: `${hour.toString().padStart(2, "0")}:00`,
          end: `${(hour + 1).toString().padStart(2, "0")}:00`,
        })
      }

      expect(slots).toHaveLength(9) // 9 AM to 6 PM = 9 slots
      expect(slots[0]).toEqual({ start: "09:00", end: "10:00" })
      expect(slots[8]).toEqual({ start: "17:00", end: "18:00" })
    })
  })

  describe("Date Range Calculations", () => {
    it("should calculate date ranges correctly", () => {
      const startDate = new Date("2024-02-01")
      const endDate = new Date("2024-02-03")

      const calendar = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        calendar.push({
          date: currentDate.toISOString().split("T")[0],
          available: true,
          conflicts: [],
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }

      expect(calendar).toHaveLength(3)
      expect(calendar[0].date).toBe("2024-02-01")
      expect(calendar[2].date).toBe("2024-02-03")
    })
  })

  describe("Duration Calculations", () => {
    it("should convert duration to hours correctly", () => {
      const convertDurationToHours = (duration: { value: number; unit: string }): number => {
        switch (duration.unit) {
          case "minutes":
            return duration.value / 60
          case "hours":
            return duration.value
          case "days":
            return duration.value * 8 // 8 working hours per day
          case "weeks":
            return duration.value * 40 // 40 working hours per week
          case "months":
            return duration.value * 160 // ~160 working hours per month
          default:
            return duration.value
        }
      }

      expect(convertDurationToHours({ value: 30, unit: "minutes" })).toBe(0.5)
      expect(convertDurationToHours({ value: 2, unit: "hours" })).toBe(2)
      expect(convertDurationToHours({ value: 1, unit: "days" })).toBe(8)
    })

    it("should calculate end time correctly", () => {
      const calculateEndTime = (
        startTime: Date,
        duration: { value: number; unit: string }
      ): Date => {
        const endTime = new Date(startTime)

        switch (duration.unit) {
          case "minutes":
            endTime.setMinutes(endTime.getMinutes() + duration.value)
            break
          case "hours":
            endTime.setHours(endTime.getHours() + duration.value)
            break
          case "days":
            endTime.setDate(endTime.getDate() + duration.value)
            break
        }

        return endTime
      }

      const startTime = new Date("2024-02-01T10:00:00Z")
      const endTime = calculateEndTime(startTime, { value: 2, unit: "hours" })

      expect(endTime.toISOString()).toBe("2024-02-01T12:00:00.000Z")
    })
  })

  describe("Conflict Detection", () => {
    it("should detect overlapping time periods", () => {
      const checkOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
        return start1 < end2 && start2 < end1
      }

      const booking1 = {
        start: new Date("2024-02-01T10:00:00Z"),
        end: new Date("2024-02-01T12:00:00Z"),
      }

      const booking2 = {
        start: new Date("2024-02-01T11:00:00Z"),
        end: new Date("2024-02-01T13:00:00Z"),
      }

      const booking3 = {
        start: new Date("2024-02-01T13:00:00Z"),
        end: new Date("2024-02-01T15:00:00Z"),
      }

      expect(checkOverlap(booking1.start, booking1.end, booking2.start, booking2.end)).toBe(true)
      expect(checkOverlap(booking1.start, booking1.end, booking3.start, booking3.end)).toBe(false)
    })
  })

  describe("Time Parsing", () => {
    it("should parse time slots correctly", () => {
      const parseTimeSlot = (date: Date, timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(":").map(Number)
        const result = new Date(date)
        result.setHours(hours, minutes, 0, 0)
        return result
      }

      const date = new Date("2024-02-01")
      const timeSlot = parseTimeSlot(date, "10:30")

      expect(timeSlot.getHours()).toBe(10)
      expect(timeSlot.getMinutes()).toBe(30)
      expect(timeSlot.toISOString().split("T")[0]).toBe("2024-02-01")
    })
  })

  describe("Availability Windows", () => {
    it("should create availability windows correctly", () => {
      const createAvailabilityWindow = (
        date: string,
        available: boolean,
        conflicts: any[] = []
      ) => {
        return {
          date,
          available,
          conflicts: conflicts.map((conflict) => ({
            type: conflict.type,
            reason: conflict.reason,
          })),
        }
      }

      const window1 = createAvailabilityWindow("2024-02-01", true)
      const window2 = createAvailabilityWindow("2024-02-02", false, [
        { type: "booking", reason: "Existing booking" },
      ])

      expect(window1.available).toBe(true)
      expect(window1.conflicts).toHaveLength(0)

      expect(window2.available).toBe(false)
      expect(window2.conflicts).toHaveLength(1)
      expect(window2.conflicts[0].type).toBe("booking")
    })
  })
})
