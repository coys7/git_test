/**
 * Weekday Photo Reminder
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { pickAndPersistPhoto, stripCacheBuster } from './src/photo';
import {
  cancelWeekdayReminders,
  describeSchedule,
  isExactAlarmPermissionGranted,
  openAlarmPermissionSettings,
  requestNotificationPermission,
  scheduleWeekdayReminders,
} from './src/notifications';
import { loadReminderState, saveReminderState } from './src/storage';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [message, setMessage] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const state = await loadReminderState();
      setMessage(state.message);
      setPhotoUri(state.photoUri);
      setEnabled(state.enabled);
      setLoading(false);
    })();
  }, []);

  const handlePickPhoto = async () => {
    try {
      const uri = await pickAndPersistPhoto();
      if (uri) {
        setPhotoUri(uri);
      }
    } catch (error) {
      Alert.alert('Could not select photo', String(error));
    }
  };

  const handleSaveActivate = async () => {
    if (!message.trim()) {
      Alert.alert('Add a message', 'Type the message you want the notification to show.');
      return;
    }
    if (!photoUri) {
      Alert.alert('Add a photo', 'Pick a photo from your camera roll first.');
      return;
    }

    setBusy(true);
    try {
      const notifGranted = await requestNotificationPermission();
      if (!notifGranted) {
        Alert.alert(
          'Notifications are disabled',
          'Enable notifications for this app in Android Settings, then try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const alarmGranted = await isExactAlarmPermissionGranted();
      if (!alarmGranted) {
        Alert.alert(
          'Allow exact alarms',
          'To fire at exactly 9:25am, this app needs the "Alarms & reminders" permission. You will be taken to Settings — please enable it, then come back and tap Save & Activate again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openAlarmPermissionSettings() },
          ],
        );
        return;
      }

      const cleanUri = stripCacheBuster(photoUri);
      await scheduleWeekdayReminders(message.trim(), cleanUri);
      await saveReminderState({ message: message.trim(), photoUri: cleanUri, enabled: true });
      setEnabled(true);
      Alert.alert('Activated', `Your reminder will fire every ${describeSchedule()}.`);
    } catch (error) {
      Alert.alert('Could not schedule notification', String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async () => {
    setBusy(true);
    try {
      await cancelWeekdayReminders();
      const state = await loadReminderState();
      await saveReminderState({ ...state, enabled: false });
      setEnabled(false);
    } catch (error) {
      Alert.alert('Could not cancel notification', String(error));
    } finally {
      setBusy(false);
    }
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    flex: 1,
  };

  if (loading) {
    return (
      <SafeAreaView style={[backgroundStyle, styles.centered]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          Weekday Photo Reminder
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Fires every {describeSchedule()}
        </Text>

        <View
          style={[
            styles.statusPill,
            enabled ? styles.statusActive : styles.statusInactive,
          ]}>
          <Text style={styles.statusText}>
            {enabled ? 'ACTIVE' : 'NOT ACTIVE'}
          </Text>
        </View>

        <TouchableOpacity style={styles.photoBox} onPress={handlePickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <Text style={styles.photoPlaceholder}>Tap to choose a photo</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handlePickPhoto}>
          <Text style={styles.secondaryButtonText}>
            {photoUri ? 'Change Photo' : 'Choose Photo'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Message</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={message}
          onChangeText={setMessage}
          placeholder="e.g. Good morning! Don't forget to..."
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          multiline
        />

        <TouchableOpacity
          style={[styles.primaryButton, busy && styles.buttonDisabled]}
          onPress={handleSaveActivate}
          disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {enabled ? 'Save Changes' : 'Save & Activate'}
            </Text>
          )}
        </TouchableOpacity>

        {enabled && (
          <TouchableOpacity
            style={[styles.dangerButton, busy && styles.buttonDisabled]}
            onPress={handleDeactivate}
            disabled={busy}>
            <Text style={styles.dangerButtonText}>Deactivate</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  subtitleDark: {
    color: '#aaa',
  },
  statusPill: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusActive: {
    backgroundColor: '#1e8e3e',
  },
  statusInactive: {
    backgroundColor: '#888',
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  photoBox: {
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    color: '#777',
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#3366ff',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  labelDark: {
    color: '#ddd',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  inputDark: {
    borderColor: '#444',
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: '#3366ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dangerButton: {
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d93025',
  },
  dangerButtonText: {
    color: '#d93025',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default App;
