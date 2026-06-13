export async function enableReminder() {
  if (!('Notification' in window)) {
    return { ok: false, reason: 'Notifications not supported in this browser.' }
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, reason: 'Permission denied. Enable notifications for Lectio in your browser settings.' }
  }
  try {
    const reg = await navigator.serviceWorker.ready
    if (!('periodicSync' in reg)) {
      return { ok: false, reason: 'Background reminders require Chrome on Android with Lectio installed on your home screen.' }
    }
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
    if (status.state !== 'granted') {
      return { ok: false, reason: 'Add Lectio to your home screen first, then set the reminder.' }
    }
    await reg.periodicSync.register('lectio-reminder', { minInterval: 24 * 60 * 60 * 1000 })
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e.message }
  }
}

export async function disableReminder() {
  try {
    const reg = await navigator.serviceWorker.ready
    if ('periodicSync' in reg) await reg.periodicSync.unregister('lectio-reminder')
  } catch {}
}

export async function getReminderStatus() {
  try {
    const reg = await navigator.serviceWorker.ready
    if (!('periodicSync' in reg)) return 'unsupported'
    const tags = await reg.periodicSync.getTags()
    return tags.includes('lectio-reminder') ? 'active' : 'inactive'
  } catch {
    return 'unsupported'
  }
}
