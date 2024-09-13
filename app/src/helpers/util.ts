/**
 * @returns The specified environment variable if set, otherwise throws an exception. Ensures missing variables are detected in testing.
 */
export function env(name: string, fallback?: string): string {
  const result = process.env[name] || fallback;
  if (result === undefined) throw new Error(`Missing environment variable: ${name}`);
  return result;
}

/**
 * @returns A few random characters.
 */
export function random(): string {
  // Base 36 gives us numbers and letters but no special characters:
  return (Math.random() + 1).toString(36).substring(7);
}
