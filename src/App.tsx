import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useReminderStore } from './stores/reminderStore'
import { useHabitStore } from './stores/habitStore'
import { startNotificationPolling, requestNotificationPermission } from './utils/notifications'
import BottomNav from './components/layout/BottomNav'
import HomePage from './pages/HomePage'
import RemindersPage from './pages/RemindersPage'
import HabitsPage from './pages/HabitsPage'
import HabitDetailPage from './pages/HabitDetailPage'
import BowelDetailPage from './pages/BowelDetailPage'
import BeautyPage from './pages/BeautyPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const reminders = useReminderStore((s) => s.reminders)
  const loadReminders = useReminderStore((s) => s.loadReminders)
  const loadTodayLogs = useReminderStore((s) => s.loadTodayLogs)
  const loadHabits = useHabitStore((s) => s.loadHabits)
  const loadTodayHabitLogs = useHabitStore((s) => s.loadTodayHabitLogs)

  useEffect(() => {
    loadReminders()
    loadTodayLogs()
    loadHabits()
    loadTodayHabitLogs()
    requestNotificationPermission()
  }, [])

  // Start notification polling
  useEffect(() => {
    const stop = startNotificationPolling(() => reminders, 60000)
    return stop
  }, [reminders])

  return (
    <div className="min-h-dvh bg-bg pb-20">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/habits/bowel" element={<BowelDetailPage />} />
        <Route path="/habits/:id" element={<HabitDetailPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/beauty" element={<BeautyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
