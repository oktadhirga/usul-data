import type { DriveStorageProvider, UploadFileOptions, UploadFileResult } from './provider.interface';
import path from 'node:path';
import fs from 'node:fs';

export function getLocalUploadDir(): string {
  const candidate1 = path.resolve(process.cwd(), 'uploads');
  const candidate2 = path.resolve(process.cwd(), 'apps/api/uploads');
  const candidate3 = path.resolve(import.meta.dir, '../../../uploads');

  if (fs.existsSync(candidate2)) return candidate2;
  if (fs.existsSync(candidate1)) return candidate1;
  if (fs.existsSync(candidate3)) return candidate3;

  fs.mkdirSync(candidate1, { recursive: true });
  return candidate1;
}

export class LocalStorageProvider implements DriveStorageProvider {
  private uploadDir: string;

  constructor(customUploadDir?: string) {
    this.uploadDir = customUploadDir || getLocalUploadDir();
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    const targetFilePath = path.join(this.uploadDir, options.fileName);
    await Bun.write(targetFilePath, options.buffer);

    return {
      fileId: `local_${options.fileName}`,
      webViewLink: `/uploads/${options.fileName}`,
      fileName: options.fileName,
      nip: options.nip
    };
  }

  async trashFile(fileId: string): Promise<boolean> {
    const fileName = fileId.startsWith('local_') ? fileId.slice(6) : fileId;
    const targetFilePath = path.join(this.uploadDir, fileName);

    if (fs.existsSync(targetFilePath)) {
      try {
        fs.unlinkSync(targetFilePath);
        return true;
      } catch (e) {
        console.error(`Gagal menghapus berkas lokal ${targetFilePath}:`, e);
        return false;
      }
    }

    return false;
  }
}
