import { describe, it, expect } from 'bun:test';
import { users, unor, pegawai } from './schema';

describe('Shared Schema', () => {
  it('should define users table with proper columns', () => {
    expect(users).toBeDefined();
    expect(users.id).toBeDefined();
    expect(users.username).toBeDefined();
    expect(users.passwordHash).toBeDefined();
    expect(users.role).toBeDefined();
    expect(users.kodeUnor).toBeDefined();
  });

  it('should define unor table with proper columns', () => {
    expect(unor).toBeDefined();
    expect(unor.id).toBeDefined();
    expect(unor.kodeUnor).toBeDefined();
    expect(unor.namaUnor).toBeDefined();
  });

  it('should define pegawai table with proper columns', () => {
    expect(pegawai).toBeDefined();
    expect(pegawai.id).toBeDefined();
    expect(pegawai.nip).toBeDefined();
    expect(pegawai.nama).toBeDefined();
    expect(pegawai.jabatan).toBeDefined();
    expect(pegawai.kodeUnor).toBeDefined();
  });
});

