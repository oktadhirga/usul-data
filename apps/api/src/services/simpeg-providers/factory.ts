import type { SimpegProvider } from './provider.interface';
import { MockSimpegProvider } from './mock.provider';
import { HttpSimpegProvider } from './http.provider';

export function createSimpegProvider(): SimpegProvider {
  const isMock = process.env.MOCK_SIMPEG === 'true';
  if (isMock) {
    return new MockSimpegProvider();
  }

  return new HttpSimpegProvider({
    baseUrl: process.env.SIMPEG_API_URL,
    unorUrl: process.env.SIMPEG_UNOR_URL,
    pegawaiUrl: process.env.SIMPEG_PEGAWAI_URL,
    authUser: process.env.SIMPEG_AUTH_USER,
    authPass: process.env.SIMPEG_AUTH_PASS,
    apiToken: process.env.SIMPEG_API_TOKEN
  });
}

