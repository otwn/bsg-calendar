export const CONFIG = {
  // Your Google Calendar embed URL (public calendar)
  googleCalendarUrl: '',

  // App name shown in header
  appName: 'BSG Calendar',

  // Shift / calendar grey-out rules. Days-of-week use 0=Sun … 6=Sat.
  // Weeks are Sunday-start (week 1 = day-of-month 1–7, week 2 = 8–14, …).
  shiftRules: {
    // Weekdays that have shifts. All other weekdays are non-shift (white).
    // BSG only schedules Sundays; Saturday is used occasionally but is not
    // pre-coloured (any day stays clickable so a one-off Saturday can be
    // assigned).
    shiftWeekdays: [0],                 // Sun

    // District meeting week (Sun-Sat). The Sunday is always a no-shift day.
    // districtSaturdayStart is unused here (Saturday is already non-shift).
    districtMeetingWeekOfMonth: 3,
    districtSaturdayStart: '2026-05',

    // Sunday in this week-of-month (non-January) is the KRG day — needs
    // extra staff. January 1st always substitutes as January's KRG day.
    krgSundayWeekOfMonth: 1,

    // Year-end holiday block: from this day of December through Dec 31.
    yearEndBlockStartDay: 24,

    // Shift start/end times shown in the post-assign reminder, keyed by
    // weekday (0=Sun … 6=Sat). Days without an entry have no fixed time.
    shiftTimes: {
      0: '8:30am - 12:30pm',  // Sun
    },

    // Note appended to the reminder on KRG days (need to arrive earlier).
    krgNote: 'Note that you may need to be there earlier for KRG prep',
  },
}
