
import { describe, it, expect } from 'vitest';
import { CATEGORIES } from '../categories';

describe('Categories mapping and translation', () => {
  it('has valid categories', () => {
    expect(CATEGORIES.evenement.en).toBe('Event');
  });
});

