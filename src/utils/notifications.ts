import type { Reminder } from '../db'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendReminderNotification(reminder: Reminder, time: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const body = reminder.dosage
    ? `${time} · ${reminder.dosage}`
    : `到了 ${time}`

  const notif = new Notification(`⏰ ${reminder.title}`, {
    body,
    icon: '/favicon.svg',
    tag: `reminder-${reminder.id}-${time}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
  })

  notif.onclick = () => {
    window.focus()
    notif.close()
  }
}

// Check all enabled reminders and notify for any that are due
export function checkAndNotify(reminders: Reminder[]) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const reminder of reminders) {
    if (!reminder.enabled) continue
    for (const time of reminder.times) {
      const [h, m] = time.split(':').map(Number)
      const schedMinutes = h * 60 + m
      // Notify if within 2 minutes of scheduled time
      if (Math.abs(currentMinutes - schedMinutes) <= 2) {
        sendReminderNotification(reminder, time)
      }
    }
  }
}

// Schedule periodic checks
export function startNotificationPolling(
  getReminders: () => Reminder[],
  intervalMs = 60000
): () => void {
  const interval = setInterval(() => {
    checkAndNotify(getReminders())
  }, intervalMs)
  return () => clearInterval(interval)
}
