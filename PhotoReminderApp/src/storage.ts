import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGE_KEY = 'reminder:message';
const PHOTO_KEY = 'reminder:photoUri';
const ENABLED_KEY = 'reminder:enabled';

export interface ReminderState {
  message: string;
  photoUri: string | null;
  enabled: boolean;
}

export async function loadReminderState(): Promise<ReminderState> {
  const values = await AsyncStorage.getMany([MESSAGE_KEY, PHOTO_KEY, ENABLED_KEY]);

  return {
    message: values[MESSAGE_KEY] ?? '',
    photoUri: values[PHOTO_KEY] || null,
    enabled: values[ENABLED_KEY] === 'true',
  };
}

export async function saveReminderState(state: ReminderState): Promise<void> {
  await AsyncStorage.setMany({
    [MESSAGE_KEY]: state.message,
    [PHOTO_KEY]: state.photoUri ?? '',
    [ENABLED_KEY]: state.enabled ? 'true' : 'false',
  });
}
