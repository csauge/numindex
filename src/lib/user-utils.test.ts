import { describe, it, expect } from 'vitest';
import { combineAuthWithProfiles } from './user-utils';

describe('combineAuthWithProfiles', () => {
  it('should merge auth users with their profiles correctly', () => {
    const authUsers = [
      { id: '1', email: 'alice@test.com', created_at: '2021-01-01', last_sign_in_at: '2021-01-02' },
      { id: '2', email: 'bob@test.com', created_at: '2021-01-01', last_sign_in_at: null }
    ];
    const profiles = [
      { id: '1', full_name: 'Alice Smith', role: 'admin' },
      { id: '2', full_name: 'Bob Jones', role: 'user' }
    ];

    const result = combineAuthWithProfiles(authUsers, profiles);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: '1',
      email: 'alice@test.com',
      full_name: 'Alice Smith',
      role: 'admin',
      created_at: '2021-01-01',
      last_sign_in_at: '2021-01-02'
    });
    expect(result[1]).toEqual({
      id: '2',
      email: 'bob@test.com',
      full_name: 'Bob Jones',
      role: 'user',
      created_at: '2021-01-01',
      last_sign_in_at: null
    });
  });

  it('should use default values for missing profiles', () => {
    const authUsers = [
      { id: '3', email: 'charlie@test.com', created_at: '2021-01-01', last_sign_in_at: null }
    ];
    const profiles: any[] = [];

    const result = combineAuthWithProfiles(authUsers, profiles);

    expect(result[0]).toEqual({
      id: '3',
      email: 'charlie@test.com',
      full_name: null,
      role: 'user',
      created_at: '2021-01-01',
      last_sign_in_at: null
    });
  });
});
