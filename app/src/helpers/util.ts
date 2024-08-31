/**
 * @returns The specified environment variable if set, otherwise throws an exception. Ensures missing variables are detected in testing.
 */
export function env(name: string, fallback?: string): string {
  const result = process.env[name];
  if (!result) throw new Error(`Missing environment variable: ${name}`);
  return result;
}
