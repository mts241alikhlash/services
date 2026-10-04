const ADMISSION_TIME_ZONE = 'Asia/Jakarta'

export function admissionToday(now: Date = new Date()): Date {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: ADMISSION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return new Date(`${date}T00:00:00.000Z`)
}
