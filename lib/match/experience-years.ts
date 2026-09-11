const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

export function computeExperienceYears(
  startDate: string,
  endDate: string | null
): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return Math.max((end.getTime() - start.getTime()) / MS_PER_YEAR, 0);
}
