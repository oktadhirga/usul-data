import type { SimpegProvider, SimpegUnorItem, SimpegPegawaiItem } from './provider.interface';

export class MockSimpegProvider implements SimpegProvider {
  private unorList: SimpegUnorItem[] = [
    {
      kodeUnor: 'UNOR-101',
      namaUnor: 'Dinas Komunikasi dan Informatika'
    },
    {
      kodeUnor: 'UNOR-102',
      namaUnor: 'Badan Kepegawaian Daerah'
    },
    {
      kodeUnor: 'UNOR-103',
      namaUnor: 'Dinas Kesehatan'
    },
    {
      kodeUnor: 'UNOR-104',
      namaUnor: 'Dinas Pendidikan'
    }
  ];

  private pegawaiList: SimpegPegawaiItem[] = [
    {
      nip: '198501012010011001',
      nama: 'Ahmad Fauzi, S.Kom, M.Cs',
      jabatan: 'Pranata Komputer Ahli Muda',
      kodeUnor: 'UNOR-101',
      namaUnor: 'Dinas Komunikasi dan Informatika'
    },
    {
      nip: '198802022012022002',
      nama: 'Siti Rahmawati, S.AP, M.Si',
      jabatan: 'Analis Kepegawaian Ahli Muda',
      kodeUnor: 'UNOR-102',
      namaUnor: 'Badan Kepegawaian Daerah'
    },
    {
      nip: '199003032015031003',
      nama: 'dr. Budi Setiawan, Sp.A',
      jabatan: 'Dokter Ahli Pertama',
      kodeUnor: 'UNOR-103',
      namaUnor: 'Dinas Kesehatan'
    },
    {
      nip: '199204042018041004',
      nama: 'Dewi Lestari, S.Pd',
      jabatan: 'Guru Ahli Pertama',
      kodeUnor: 'UNOR-104',
      namaUnor: 'Dinas Pendidikan'
    }
  ];

  async fetchUnor(): Promise<SimpegUnorItem[]> {
    return [...this.unorList];
  }

  async fetchPegawai(options?: { offset?: number; limit?: number }): Promise<SimpegPegawaiItem[]> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? this.pegawaiList.length;
    return this.pegawaiList.slice(offset, offset + limit);
  }
}
