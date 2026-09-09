import { describe, it, expect } from 'bun:test';
import { users } from './schema';

describe('Shared Schema', () => {
  it('should define users table with proper columns', () => {
    expect(users).toBeDefined();
    expect(users.id).toBeDefined();
    expect(users.username).toBeDefined();
    expect(users.passwordHash).toBeDefined();
    expect(users.role).toBeDefined();
    expect(users.kodeUnor).toBeDefined();
  });
});
