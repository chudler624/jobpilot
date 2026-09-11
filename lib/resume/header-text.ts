function formatMonthYear(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = formatMonthYear(startDate);
  const end = endDate ? formatMonthYear(endDate) : "Present";
  return `${start} – ${end}`;
}

export function experienceHeaderText(experience: {
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
}): string {
  const titleLine = `${experience.title} — ${experience.company}`;
  const location = experience.location ? ` | ${experience.location}` : "";
  return `${titleLine}${location} (${formatDateRange(experience.start_date, experience.end_date)})`;
}

export function projectHeaderText(project: {
  name: string;
  start_date: string | null;
  end_date: string | null;
}): string {
  if (!project.start_date) return project.name;
  return `${project.name} (${formatDateRange(project.start_date, project.end_date)})`;
}
