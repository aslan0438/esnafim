import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Calendar({ selectedDate, onDateSelect, appointments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getDayAppointments = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return appointments?.filter(ap => ap.appointment_date === dateStr) || []
  }

  const hasAppointments = (date) => {
    return getDayAppointments(date).length > 0
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-outline-variant/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-surface-container rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-on-surface" />
        </button>
        <h2 className="text-lg font-semibold text-on-surface">
          {format(currentMonth, 'MMMM yyyy', { locale: tr })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-surface-container rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-on-surface" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-on-surface-variant py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          const isCurrentMonth = isSameMonth(date, currentMonth)
          const isTodayDate = isToday(date)
          const dayAppointments = getDayAppointments(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              disabled={!isCurrentMonth}
              className={`
                relative aspect-square rounded-lg p-2 text-sm font-medium transition-all
                ${isSelected 
                  ? 'bg-primary text-white shadow-md' 
                  : isTodayDate 
                    ? 'bg-primary-container/20 text-primary border-2 border-primary/30'
                    : hasAppointments(date)
                      ? 'bg-secondary-container/10 text-on-surface hover:bg-secondary-container/20'
                      : 'text-on-surface-variant hover:bg-surface-container'
                }
                ${!isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="block">{format(date, 'd')}</span>
              {dayAppointments.length > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayAppointments.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-primary'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Seçili</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-secondary-container/50" />
          <span>Randevu var</span>
        </div>
      </div>
    </div>
  )
}
