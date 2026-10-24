export function pgSslOptions(
  connectionString: string | undefined,
): { ssl: { rejectUnauthorized: false } } | Record<string, never> {
  const disabled = /[?&]sslmode=disable(&|$)/i.test(connectionString ?? '')
  return disabled ? {} : { ssl: { rejectUnauthorized: false } }
}
