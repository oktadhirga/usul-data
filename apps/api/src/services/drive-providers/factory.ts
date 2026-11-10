import type { DriveStorageProvider } from './provider.interface';
import { MockDriveProvider } from './mock.provider';
import { GoogleDriveProvider } from './google.provider';
import { LocalStorageProvider } from './local.provider';

export function createDriveProvider(): DriveStorageProvider {
  const driver = (process.env.STORAGE_DRIVER || 'gdrive').toLowerCase();

  // Mode penyimpanan disk lokal
  if (driver === 'local') {
    return new LocalStorageProvider();
  }

  // Mode penyimpanan Google Drive (Cloud)
  const isMock =
    process.env.MOCK_GDRIVE === 'true' ||
    !process.env.GDRIVE_CLIENT_ID ||
    !process.env.GDRIVE_REFRESH_TOKEN;

  if (isMock) {
    return new MockDriveProvider();
  }

  return new GoogleDriveProvider({
    clientId: process.env.GDRIVE_CLIENT_ID!,
    clientSecret: process.env.GDRIVE_CLIENT_SECRET || '',
    refreshToken: process.env.GDRIVE_REFRESH_TOKEN!,
    rootFolderId: process.env.GDRIVE_ROOT_FOLDER_ID || 'root'
  });
}
