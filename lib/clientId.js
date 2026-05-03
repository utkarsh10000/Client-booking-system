// lib/clientId.js

/**
 * Derives a 3-character project code from the project name.
 * Rule: take the first letter of each word (uppercase).
 *       If fewer than 3 words, left-pad with zeros.
 * Examples:
 *   "Haute World City"    -> "HWC"
 *   "Haute Grand City"    -> "HGC"
 *   "Expressway Residency"-> "0ER"
 *   "Elysium"             -> "00E"
 */
export function getProjectCode(projectName) {
  if (!projectName) return '000';
  const words   = projectName.trim().split(/\s+/);
  const letters = words.map((w) => w[0].toUpperCase()).join('');
  // Pad to exactly 3 chars with leading zeros
  return letters.slice(0, 3).padStart(3, '0');
}

/**
 * Builds the full client ID string.
 * Format: HD + projectCode (3 chars) + sequentialNumber (4 digits, zero-padded)
 * Example: HDHWC0001
 */
export function buildClientId(projectCode, seq) {
  const num = String(seq).padStart(4, '0');
  return `HD${projectCode}${num}`;
}