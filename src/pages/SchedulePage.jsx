import { useState, useEffect, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { format, parseISO, addMonths, subMonths } from 'date-fns'
import { supabase } from '../supabase'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import { getDayCellClasses, getShiftTimeReminder } from './scheduleRules'
import SundaysView from './SundaysView'

export default function SchedulePage() {
  const [members, setMembers] = useState([])
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [existingShifts, setExistingShifts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  const [cancelReasons, setCancelReasons] = useState({})
  const [reminder, setReminder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('month')
  const [viewDate, setViewDate] = useState(new Date())
  const calendarRef = useRef(null)

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, shiftsRes] = await Promise.all([
        supabase.from('bsg_active_members').select('*').order('name'),
        supabase.from('bsg_shifts').select('*, bsg_members(*)'),
      ])

      if (membersRes.data) setMembers(membersRes.data)
      if (shiftsRes.data) setShifts(shiftsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    const shiftsSubscription = supabase
      .channel('bsg-shifts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bsg_shifts' }, fetchData)
      .subscribe()

    return () => {
      shiftsSubscription.unsubscribe()
    }
  }, [fetchData])

  // Sync FullCalendar to viewDate when switching back to month view
  useEffect(() => {
    if (viewMode === 'month' && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(viewDate)
    }
  }, [viewMode, viewDate])

  const events = shifts.map(shift => ({
    id: shift.id,
    title: shift.bsg_members?.name || 'Unknown',
    date: shift.shift_date,
    backgroundColor: shift.bsg_members?.color || '#6366f1',
    borderColor: shift.bsg_members?.color || '#6366f1',
    extendedProps: { shift },
  }))

  const handleDateClick = (info) => {
    const dateStr = info.dateStr
    const existing = shifts.filter(s => s.shift_date === dateStr)

    setSelectedDate(dateStr)
    setExistingShifts(existing)
    setSelectedMember('')
    setCancelReasons({})
    setIsModalOpen(true)
  }

  const handleAssign = async () => {
    if (!selectedMember || !selectedDate) return

    try {
      const { data: newShift } = await supabase.from('bsg_shifts').insert({
        member_id: selectedMember,
        shift_date: selectedDate,
      }).select('*, bsg_members(*)').single()

      const member = members.find(m => m.id === selectedMember)
      await supabase.from('bsg_history').insert({
        member_id: selectedMember,
        member_name: member?.name || 'Unknown',
        shift_date: selectedDate,
        action: 'assigned',
      })

      setSelectedMember('')
      setIsModalOpen(false)
      setReminder(getShiftTimeReminder(parseISO(selectedDate)))
      fetchData()
    } catch (error) {
      console.error('Error assigning shift:', error)
    }
  }

  const handleCancel = async (shift) => {
    if (!shift) return

    try {
      await supabase.from('bsg_shifts').delete().eq('id', shift.id)

      await supabase.from('bsg_history').insert({
        member_id: shift.member_id,
        member_name: shift.bsg_members?.name || 'Unknown',
        shift_date: selectedDate,
        action: 'cancelled',
        reason: cancelReasons[shift.id] || null,
      })

      setExistingShifts(prev => prev.filter(s => s.id !== shift.id))
      setCancelReasons(prev => {
        const updated = { ...prev }
        delete updated[shift.id]
        return updated
      })
      fetchData()
    } catch (error) {
      console.error('Error cancelling shift:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        {/* View mode toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex gap-1 rounded-lg p-1 bg-slate-100">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('sundays')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'sundays'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sundays
            </button>
          </div>
        </div>

        {viewMode === 'month' ? (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            eventClick={(info) => handleDateClick({ dateStr: info.event.startStr })}
            datesSet={(arg) => setViewDate(arg.view.currentStart)}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            height="auto"
            dayMaxEvents={3}
            dayCellClassNames={(arg) => getDayCellClasses(arg.date)}
          />
        ) : (
          <SundaysView
            year={viewDate.getFullYear()}
            month={viewDate.getMonth()}
            shifts={shifts}
            onDateClick={(dateStr) => handleDateClick({ dateStr })}
            onPrevMonth={() => setViewDate(prev => subMonths(prev, 1))}
            onNextMonth={() => setViewDate(prev => addMonths(prev, 1))}
          />
        )}
      </div>

      {/* Legend & Hours */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="space-y-1 mb-3">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-700">Hours:</span>{' '}
            <span className="font-bold">Sun 8:30am-12:30pm</span>. No shift 3rd Sun (District Mtg).
          </p>
          <p className="text-sm" style={{ color: '#f59e0b' }}>
            <span className="font-medium">⚑ 1st Sunday (except Jan):</span>{' '}
            Requires more than 3 for KRG.
          </p>
        </div>
        <div className="border-t border-slate-200 pt-3 space-y-3">
          {[
            { label: 'Young Women — Byakuren', tags: ['b'] },
            { label: 'Young Men — Sokahan / Gajokai', tags: ['s', 'g', 's/g'] },
          ].map(group => {
            const groupMembers = members.filter(m => group.tags.includes(m.group_tag))
            if (groupMembers.length === 0) return null
            return (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-4">
                  {groupMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                      <span className="text-sm text-slate-600">
                        {member.name}{member.group_tag ? ` (${member.group_tag})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Assign/Cancel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDate ? format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy') : 'Select Date'}
      >
        <div className="space-y-4">
          {/* Currently assigned members */}
          {existingShifts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Currently assigned</p>
              {existingShifts.map(shift => (
                <div key={shift.id} className="bg-slate-50 rounded-lg p-4">
                  <p className="font-medium text-slate-800 flex items-center gap-2 mb-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: shift.bsg_members?.color }}
                    />
                    {shift.bsg_members?.name}
                  </p>
                  <input
                    type="text"
                    value={cancelReasons[shift.id] || ''}
                    onChange={(e) => setCancelReasons(prev => ({ ...prev, [shift.id]: e.target.value }))}
                    placeholder="Cancel reason (optional)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all mb-2"
                  />
                  <button
                    onClick={() => handleCancel(shift)}
                    className="w-full py-2 text-sm bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-all"
                  >
                    Cancel Shift
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Divider if there are existing shifts */}
          {existingShifts.length > 0 && members.filter(m => !existingShifts.some(s => s.member_id === m.id)).length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Add another</span>
              </div>
            </div>
          )}

          {/* Add new assignment - only show members not already assigned */}
          {(() => {
            const availableMembers = members.filter(m => !existingShifts.some(s => s.member_id === m.id))
            if (availableMembers.length === 0) return null
            return (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign to
                  </label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Select a person...</option>
                    {availableMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAssign}
                  disabled={!selectedMember}
                  className="w-full py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Assign Shift
                </button>
              </>
            )
          })()}
        </div>
      </Modal>

      {/* Time reminder after assigning */}
      <Modal
        isOpen={!!reminder}
        onClose={() => setReminder(null)}
        title="Shift confirmed"
      >
        <div className="space-y-4">
          <p className="text-slate-700">{reminder}</p>
          <button
            onClick={() => setReminder(null)}
            className="w-full py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-all"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}
