/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Required by notifee so the OS doesn't complain about missing background
// handling when a trigger notification fires while the app isn't running.
notifee.onBackgroundEvent(async () => {});

AppRegistry.registerComponent(appName, () => App);
