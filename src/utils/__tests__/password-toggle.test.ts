import { describe, it, expect } from 'vitest';
import { setupPasswordToggle } from '../password-toggle';

describe('password-toggle', () => {
  it('should toggle input type and update button SVG icon', () => {
    // Setup simulated DOM elements
    const input = document.createElement('input');
    input.type = 'password';
    
    const button = document.createElement('button');
    button.innerHTML = 'eye-open-icon'; // Initial layout representation

    // Register event listener
    setupPasswordToggle(input, button);

    // Initial check
    expect(input.type).toBe('password');

    // Click 1: Toggle to text (show password)
    button.click();
    expect(input.type).toBe('text');
    expect(button.innerHTML).toContain('M3 3l18 18'); // Eye-slash line path

    // Click 2: Toggle back to password (hide password)
    button.click();
    expect(input.type).toBe('password');
    expect(button.innerHTML).toContain('M15 12'); // Eye path
  });
});
