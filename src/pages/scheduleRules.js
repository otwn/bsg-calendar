import { CONFIG } from '../config'

// Day-cell classification for the schedule calendar.
// dow: 0=Sun … 6=Sat. dom: 1-31. month: 0=Jan … 11=Dec.
// Weeks are Sunday-start: week n covers dom ((n-1)*7+1)..(n*7).
export function getDayCellClasses(date, rules = CONFIG.shiftRules) {
  const dow = date.getDay()
  const dom = date.getDate()
  const month = date.getMonth()

  // January 1st always substitutes as January's KRG day (the generic
  // krgSunday rule excludes January so January would otherwise have none).
  if (month === 0 && dom === 1) return ['first-sunday-krg']

  if (month === 11 && dom >= rules.yearEndBlockStartDay) return ['no-shift-day']

  const districtSunStart = (rules.districtMeetingWeekOfMonth - 1) * 7 + 1
  const districtSunEnd   = rules.districtMeetingWeekOfMonth * 7
  const isDistrictSunday = dow === 0 && dom >= districtSunStart && dom <= districtSunEnd

  // Saturday that ends the same Sun-Sat week as the district-meeting Sunday
  // is 6 days after the Sunday, so its dom shifts up by 6. Gated by a
  // YYYY-MM cutover so historical months retain their original behavior.
  const districtSatStart = districtSunStart + 6
  const districtSatEnd   = districtSunEnd + 6
  const ym = `${date.getFullYear()}-${String(month + 1).padStart(2, '0')}`
  const districtSaturdayActive = ym >= rules.districtSaturdayStart
  const isDistrictSaturday = districtSaturdayActive && dow === 6 && dom >= districtSatStart && dom <= districtSatEnd

  const isNoShiftWeekday = !rules.shiftWeekdays.includes(dow)

  const krgSunStart = (rules.krgSundayWeekOfMonth - 1) * 7 + 1
  const krgSunEnd   = rules.krgSundayWeekOfMonth * 7
  const isKrgSunday = dow === 0 && dom >= krgSunStart && dom <= krgSunEnd && month !== 0

  const classes = []
  if (isNoShiftWeekday || isDistrictSunday || isDistrictSaturday) classes.push('no-shift-day')
  if (isKrgSunday) classes.push('first-sunday-krg')
  return classes
}

// Returns an array of Sunday entries (plus Jan 1st when month===0) for the
// given year/month, sorted ascending by date.  Each entry carries classification
// flags derived from getDayCellClasses so the Sundays view can render badges and
// coverage status without re-implementing the rules.
export function getSundayEntries(year, month, rules = CONFIG.shiftRules) {
  const entries = []
  const seen = new Set()

  // Collect all Sundays in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    if (date.getDay() === 0) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const classes = getDayCellClasses(date, rules)
      const isKRG = classes.includes('first-sunday-krg')
      const isNoShift = classes.includes('no-shift-day')
      entries.push({ date, dateStr, isKRG, isNoShift, needed: isNoShift ? 0 : isKRG ? 4 : 1 })
      seen.add(dateStr)
    }
  }

  // January: ensure Jan 1st is present (it is the KRG substitute for January)
  if (month === 0) {
    const jan1Str = `${year}-01-01`
    if (!seen.has(jan1Str)) {
      const jan1 = new Date(year, 0, 1)
      const classes = getDayCellClasses(jan1, rules)
      const isKRG = classes.includes('first-sunday-krg')
      const isNoShift = classes.includes('no-shift-day')
      entries.push({ date: jan1, dateStr: jan1Str, isKRG, isNoShift, needed: isNoShift ? 0 : isKRG ? 4 : 1 })
    }
  }

  // Sort ascending by date
  entries.sort((a, b) => a.date - b.date)
  return entries
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Reminder shown after assigning a shift, e.g. "Sunday 8:30am - 12:30pm".
// On KRG days (first Sunday / Jan 1) the prep note is appended.
export function getShiftTimeReminder(date, rules = CONFIG.shiftRules) {
  const dow = date.getDay()
  const time = rules.shiftTimes[dow]
  let label = time ? `${DAY_NAMES[dow]} ${time}` : DAY_NAMES[dow]
  if (getDayCellClasses(date, rules).includes('first-sunday-krg')) {
    label += `. ${rules.krgNote}`
  }
  return label
}
