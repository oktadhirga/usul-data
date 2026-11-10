import type { DriveStorageProvider, UploadFileOptions, UploadFileResult } from './provider.interface';

export interface StoredMockFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  nip: string;
  trashed: boolean;
  buffer: Buffer;
  createdAt: Date;
}

export class MockDriveProvider implements DriveStorageProvider {
  private files: Map<string, StoredMockFile> = new Map();
  private folders: Set<string> = new Set();

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    const fileId = `mock_drive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.folders.add(options.nip);

    const mockFile: StoredMockFile = {
      fileId,
      fileName: options.fileName,
      mimeType: options.mimeType,
      nip: options.nip,
      trashed: false,
      buffer: options.buffer,
      createdAt: new Date()
    };

    this.files.set(fileId, mockFile);

    return {
      fileId,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      fileName: options.fileName,
      nip: options.nip
    };
  }

  async trashFile(fileId: string): Promise<boolean> {
    const file = this.files.get(fileId);
    if (!file) {
      return false;
    }
    file.trashed = true;
    return true;
  }

  getFile(fileId: string): StoredMockFile | undefined {
    return this.files.get(fileId);
  }

  hasFolder(nip: string): boolean {
    return this.folders.has(nip);
  }

  clear(): void {
    this.files.clear();
    this.folders.clear();
  }
}

