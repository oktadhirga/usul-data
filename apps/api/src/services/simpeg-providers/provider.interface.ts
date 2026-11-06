export interface SimpegUnorItem {
  kodeUnor: string;
  namaUnor: string;
}

export interface SimpegPegawaiItem {
  nip: string;
  nama: string;
  jabatan: string;
  kodeUnor: string;
  namaUnor?: string;
}

export interface SimpegProvider {
  fetchUnor(): Promise<SimpegUnorItem[]>;
  fetchPegawai(options?: { offset?: number; limit?: number }): Promise<SimpegPegawaiItem[]>;
}
