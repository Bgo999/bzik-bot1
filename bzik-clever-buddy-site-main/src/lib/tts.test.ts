import { describe, it, expect } from 'vitest';
import { sanitizeForTTS } from './tts';

describe('sanitizeForTTS', () => {
  it('removes emojis and surrogate-pair emoji', () => {
    const input = 'Hello 👋🙂🔥 world';
    const out = sanitizeForTTS(input);
    expect(out).toBe('Hello world');
  });

  it('removes markdown and emoticons', () => {
    const input = '**Bold** _italic_ `code` :-) :D';
    const out = sanitizeForTTS(input);
    expect(out).toBe('Bold italic code');
  });

  it('collapses whitespace and trims', () => {
    const input = '  This   is\n\n spaced   ';
    const out = sanitizeForTTS(input);
    expect(out).toBe('This is spaced');
  });

  it('removes decorative symbols', () => {
    const input = 'Great job! ★☆ ✓ →';
    const out = sanitizeForTTS(input);
    // punctuation like '!' is preserved and should remain adjacent to the word
    expect(out).toBe('Great job!');
  });
});
