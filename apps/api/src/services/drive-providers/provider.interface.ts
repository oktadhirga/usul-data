export interface UploadFileOptions {
  nip: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface UploadFileResult {
  fileId: string;
  webViewLink: string;
  fileName: string;
  nip: string;
}

export interface DriveStorageProvider {
  uploadFile(options: UploadFileOptions): Promise<UploadFileResult>;
  trashFile(fileId: string): Promise<boolean>;
}

