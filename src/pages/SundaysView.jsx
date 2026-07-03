import { format } from 'date-fns'
import { getSundayEntries } from './scheduleRules'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function SundaysView({ year, month, shifts, onDateClick, onPrevMonth, onNextMonth }) {
  const entries = getSundayEntries(year, month)
  const title = `${MONTH_NAMES[month]} ${year}`

  return (
    <div>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
        >
          Prev
        </button>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <button
          onClick={onNextMonth}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
        >
          Next
        </button>
      </div>

      {/* Sunday entries list */}
      <div className="space-y-3">
        {entries.map(entry => {
          const assigned = shifts.filter(s => s.shift_date === entry.dateStr)
          const assignedCount = assigned.length
          const dateLabel = format(entry.date, 'EEE, MMM d')

          return (
            <button
              key={entry.dateStr}
              type="button"
              onClick={() => onDateClick(entry.dateStr)}
              className={`w-full text-left rounded-xl p-4 border transition-all hover:shadow-md ${
                entry.isKRG
                  ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                  : entry.isNoShift
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              {/* Date + Badge row */}
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold ${entry.isKRG ? 'text-amber-800' : 'text-slate-800'}`}>
                  {dateLabel}
                </span>

                {/* Status pill */}
                {entry.isNoShift ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
                    No shift
                  </span>
                ) : assignedCount >= entry.needed ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    Covered ({assignedCount})
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                    Needs members ({assignedCount}/{entry.needed})
                  </span>
                )}
              </div>

              {/* Badge for KRG or no-shift */}
              {entry.isKRG && (
                <p className="text-sm font-medium text-amber-700 mb-2">
                  ★ KRG — needs 4+
                </p>
              )}
              {entry.isNoShift && (
                <p className="text-xs text-slate-500 mb-2">
                  {entry.date.getMonth() === 11 ? 'No shift (Year-end)' : 'No shift (District Meeting)'}
                </p>
              )}

              {/* Assigned member chips */}
              {assigned.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assigned.map(s => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-full px-2.5 py-1"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.bsg_members?.color || '#6366f1' }}
                      />
                      {s.bsg_members?.name || 'Unknown'}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
