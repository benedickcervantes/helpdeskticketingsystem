/** Min 8, 1 uppercase, 1 number, 1 special character. */
export const PASSWORD_RULE_MESSAGE =
  'Use 8+ characters with at least one uppercase letter, one number, and one special character.';

export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

export function isStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password ?? '');
}

export function getPasswordError(password: string): string | null {
  if (!password) return 'Password is required';
  if (!isStrongPassword(password)) return PASSWORD_RULE_MESSAGE;
  return null;
}
