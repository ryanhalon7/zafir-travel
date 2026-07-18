export function formatDate(date?: Date | null) {
  if (!date) {
    return "Dates not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatTime(date?: Date | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function dateInputValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function timeInputValue(date?: Date | null) {
  return date ? date.toISOString().slice(11, 16) : "";
}
