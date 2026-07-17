import RNFS from 'react-native-fs';
import { launchImageLibrary } from 'react-native-image-picker';

const PERSISTED_PHOTO_PATH = `${RNFS.DocumentDirectoryPath}/reminder-photo.jpg`;

/**
 * Opens the system photo picker and copies the chosen image into the app's
 * own document directory so it keeps working even after the picker's cache
 * is cleared or the device restarts. Returns a stable `file://` uri, or
 * null if the user cancelled.
 */
export async function pickAndPersistPhoto(): Promise<string | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
  });

  if (result.didCancel || !result.assets || result.assets.length === 0) {
    return null;
  }

  const sourceUri = result.assets[0].uri;
  if (!sourceUri) {
    return null;
  }

  if (await RNFS.exists(PERSISTED_PHOTO_PATH)) {
    await RNFS.unlink(PERSISTED_PHOTO_PATH);
  }
  await RNFS.copyFile(sourceUri, PERSISTED_PHOTO_PATH);

  // Cache-bust the file uri so <Image> and notifee reload the new photo
  // instead of reusing a previously decoded copy at the same path.
  return `file://${PERSISTED_PHOTO_PATH}?t=${Date.now()}`;
}

export function stripCacheBuster(uri: string): string {
  return uri.split('?')[0];
}
