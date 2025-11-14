export function sanitizeForTTS(raw: string): string {
  if (!raw) return '';

  let s = raw;

  // Remove common markdown characters and formatting marks
  s = s.replace(/[\*`_>#~\[\]\(\)\-|=\*]{1,}/g, ' ');

  // Remove ASCII emoticons like :-) :( :D ;)
  s = s.replace(/[:;=8][\-~]?[)D(\/\\|pP]/g, '');

  // Remove leftover standalone colons/semicolons from emoticons or markdown
  s = s.replace(/[;:]+/g, ' ');

  // Remove supplementary-plane characters (common emoji surrogate pairs)
  s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');

  // Remove other miscellaneous symbols that commonly appear as decorative characters
  s = s.replace(/[©®™✓✕★☆•→←▲▼]/g, '');

  // Collapse multiple whitespace into single spaces and trim
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}
