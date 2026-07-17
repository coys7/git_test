module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@notifee|react-native-fs|react-native-image-picker|react-native-safe-area-context|@react-native-async-storage)/)',
  ],
};
