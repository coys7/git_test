jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);
