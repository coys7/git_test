# Photo Reminder

A small React Native (Android) app that shows a scheduled push notification
every weekday (Mon-Fri) at **9:25am**, with a message and photo you set
yourself. The notification is scheduled with Android's `AlarmManager` in
exact mode, and it automatically re-schedules itself if the phone restarts.

- Pick a photo from your camera roll
- Type a custom message
- Tap **Save & Activate**
- Every weekday morning at 9:25am you'll get a notification with that photo
  and message — no server, no internet connection needed once it's scheduled.

Notification scheduling lives in `src/notifications.ts`, photo handling in
`src/photo.ts`, and local persistence in `src/storage.ts`. The UI is in
`App.tsx`.

---

## 1. Set up your computer (one-time)

You need a computer to build the app and push it to your phone. You do
**not** need the computer connected after that — see "standalone install"
below.

1. **Install Node.js** (v22+): https://nodejs.org
2. **Install a JDK** (17 or newer — Android Studio bundles one, see below).
3. **Install Android Studio**: https://developer.android.com/studio
   - During setup, let it install the **Android SDK**, **Android SDK
     Platform-Tools**, and an **Android Virtual Device** (you can skip the
     emulator if you're testing on a real phone).
   - Open Android Studio → **More Actions → SDK Manager** and make sure
     "Android SDK Platform 36" and "Android SDK Build-Tools 36" are checked
     under SDK Platforms/SDK Tools.
4. **Set environment variables** so the command line can find the SDK. Add
   to your shell profile (`~/.zshrc`, `~/.bashrc`, or Windows environment
   variables):

   ```sh
   export ANDROID_HOME=$HOME/Library/Android/sdk      # macOS
   # export ANDROID_HOME=$HOME/Android/Sdk            # Linux
   # On Windows: set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk

   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/emulator
   ```

   Restart your terminal, then confirm with:

   ```sh
   adb --version
   ```

5. Follow the official React Native "Set Up Your Environment" guide if
   anything above doesn't match what you see:
   https://reactnative.dev/docs/set-up-your-environment (choose **Android**
   → **React Native CLI**).

## 2. Get the project and install dependencies

```sh
git clone <this repo's URL>
cd git_test/PhotoReminderApp
npm install
```

## 3. Connect your Android phone

1. On your phone: **Settings → About phone** → tap **Build number** 7 times
   to unlock **Developer options**.
2. **Settings → Developer options** → enable **USB debugging**.
3. Plug your phone into your computer with a USB cable.
4. On the phone, accept the "Allow USB debugging?" popup (check "always
   allow from this computer").
5. Verify the computer sees it:

   ```sh
   adb devices
   ```

   You should see your device listed as `device` (not `unauthorized`).

## 4. Run it on your phone (development mode)

From `PhotoReminderApp/`:

```sh
npx react-native run-android
```

This builds a debug APK, installs it, and launches it on your phone. It
takes a few minutes the first time. In this mode the app talks to a local
Metro bundler on your computer over the USB cable, so **keep your phone
connected while testing**.

If you edit the code, just save the file — the app reloads automatically
(Fast Refresh).

## 5. Install it as a standalone app (recommended for daily use)

The dev-mode build above needs your computer connected to load the JS
bundle. For the notification to keep firing every weekday **without your
computer**, build a release APK, which bundles everything into the app
itself:

```sh
cd android
./gradlew assembleRelease
cd ..
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

This installs a standalone version of the app. You can now unplug your
phone entirely — the notification will keep firing on schedule.

(This build is signed with the auto-generated debug keystore, which is
fine for installing on your own phone. It's not suitable for the Play
Store — that requires a proper release keystore, which is out of scope
for personal use.)

## 6. Using the app

1. Open **Photo Reminder** on your phone.
2. Tap **Choose Photo** and pick a photo from your camera roll.
3. Type your message in the text box.
4. Tap **Save & Activate**.
   - You'll be asked to allow notifications — tap **Allow**.
   - You may then see an **"Allow exact alarms"** prompt. Tap **Open
     Settings**, then enable **"Allow setting alarms and reminders"** (this
     screen is called **Alarms & reminders** under Apps → Photo Reminder →
     Special app access). Come back to the app and tap **Save & Activate**
     again.
5. You should see a green **ACTIVE** badge and a confirmation alert. That's
   it — the app schedules five recurring alarms (one per weekday), each
   repeating weekly at 9:25am.

To change the photo or message later, just pick a new photo / edit the
text and tap **Save Changes** — it replaces the old schedule. Tap
**Deactivate** to turn the reminder off.

### Important: allow the app to run unrestricted in the background

Some Android phones (Samsung, Xiaomi, OnePlus, etc.) aggressively kill
background apps to save battery, which can prevent scheduled notifications
from firing. To make sure it's reliable:

- **Settings → Apps → Photo Reminder → Battery** → set to **Unrestricted**
  (not "Optimized" or "Restricted").
- If your phone has an additional "auto-start" or "background activity"
  toggle (common on Xiaomi/Huawei/Oppo), enable it for this app too.

## 7. Testing it without waiting until 9:25am

Easiest way: temporarily change your phone's system clock to a minute or
two before 9:25am on a weekday, then wait — the notification should appear
right on time. Set the clock back afterward.

## 8. Verifying it survives a reboot

1. With the reminder **ACTIVE**, restart your phone.
2. Don't reopen the app.
3. Wait for the next scheduled weekday time (or use the clock trick above).
4. The notification should still fire — the underlying library
   (`@notifee/react-native`) registers a boot receiver that re-arms all
   scheduled alarms automatically when Android finishes booting.

## How the scheduling works (for reference)

- `@notifee/react-native` creates 5 separate "trigger notifications" (one
  per weekday), each set to Android's `AlarmManager` in
  `SET_EXACT_AND_ALLOW_WHILE_IDLE` mode with `repeatFrequency: WEEKLY`, so
  each one fires at 9:25am on its specific weekday, every week, indefinitely
  — including through Doze/idle mode.
- The chosen photo is copied out of the camera roll into the app's private
  storage (`src/photo.ts`) so it keeps working even if the original photo is
  deleted or the picker's temp cache is cleared.
- Message, photo path, and active/inactive state are persisted with
  `@react-native-async-storage/async-storage` (`src/storage.ts`), so
  re-opening the app after a reboot shows your existing setup.

## Troubleshooting

- **`adb devices` shows nothing / "unauthorized"**: unplug and replug the
  USB cable, and re-accept the debugging popup on the phone.
- **Build fails with an SDK/licenses error**: run
  `sdkmanager --licenses` (bundled with Android Studio's SDK tools) and
  accept all licenses.
- **Notification never fires**: double-check the "Alarms & reminders"
  permission (step 6) and battery optimization setting (step 6) — these are
  the two most common causes on real devices.
- **General React Native environment issues**: see
  https://reactnative.dev/docs/troubleshooting
