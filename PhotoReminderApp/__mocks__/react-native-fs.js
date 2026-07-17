module.exports = {
  DocumentDirectoryPath: '/mock/documents',
  exists: jest.fn(async () => false),
  unlink: jest.fn(async () => undefined),
  copyFile: jest.fn(async () => undefined),
};
