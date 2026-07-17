import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidStyle,
  AndroidVisibility,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

export const REMINDER_HOUR = 9;
export const REMINDER_MINUTE = 25;

// JS Date.getDay() convention: 0 = Sunday ... 6 = Saturday.
// Monday (1) through Friday (5).
const WEEKDAYS = [1, 2, 3, 4, 5] as const;

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
};

const CHANNEL_ID = 'weekday-photo-reminder';

function notificationIdForDay(day: number) {
  return `weekday-reminder-${day}`;
}

export function allNotificationIds(): string[] {
  return WEEKDAYS.map(notificationIdForDay);
}

async function ensureChannel(): Promise<string> {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Daily Photo Reminder',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
  });
}

/** Requests the POST_NOTIFICATIONS runtime permission (Android 13+) and iOS permission. */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

/**
 * Checks whether the app can schedule exact alarms (Android 12+ special access).
 * Returns true if granted, false if the user needs to enable it manually.
 */
export async function isExactAlarmPermissionGranted(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const settings = await notifee.getNotificationSettings();
  return settings.android.alarm === AndroidNotificationSetting.ENABLED;
}

/** Opens the system settings screen where the user can grant exact-alarm access. */
export async function openAlarmPermissionSettings(): Promise<void> {
  await notifee.openAlarmPermissionSettings();
}

function nextOccurrence(targetDay: number, hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  let dayDiff = (targetDay - now.getDay() + 7) % 7;
  if (dayDiff === 0 && result.getTime() <= now.getTime()) {
    dayDiff = 7;
  }
  result.setDate(now.getDate() + dayDiff);
  return result;
}

/**
 * Cancels any previously scheduled weekday reminders.
 */
export async function cancelWeekdayReminders(): Promise<void> {
  await notifee.cancelTriggerNotifications(allNotificationIds());
}

/**
 * Schedules a recurring notification for every weekday (Mon-Fri) at 9:25am,
 * showing the given message and photo. Uses Android's AlarmManager in exact
 * mode so it fires on time even in Doze, and notifee's own boot receiver
 * re-registers all trigger notifications after the device restarts.
 */
export async function scheduleWeekdayReminders(
  message: string,
  photoUri: string,
): Promise<void> {
  await ensureChannel();
  await cancelWeekdayReminders();

  for (const day of WEEKDAYS) {
    const date = nextOccurrence(day, REMINDER_HOUR, REMINDER_MINUTE);

    await notifee.createTriggerNotification(
      {
        id: notificationIdForDay(day),
        title: 'Reminder',
        body: message,
        android: {
          channelId: CHANNEL_ID,
          largeIcon: photoUri,
          style: {
            type: AndroidStyle.BIGPICTURE,
            picture: photoUri,
          },
          pressAction: {
            id: 'default',
          },
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.WEEKLY,
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        },
      },
    );
  }
}

export function describeSchedule(): string {
  const days = WEEKDAYS.map(d => WEEKDAY_LABELS[d]);
  const first = days.slice(0, -1).join(', ');
  const last = days[days.length - 1];
  const time = `${String(REMINDER_HOUR).padStart(2, '0')}:${String(
    REMINDER_MINUTE,
  ).padStart(2, '0')}`;
  return `${first} and ${last} at ${time}`;
}

export async function getActiveTriggerIds(): Promise<string[]> {
  const ids = await notifee.getTriggerNotificationIds();
  return ids.filter(id => allNotificationIds().includes(id));
}
