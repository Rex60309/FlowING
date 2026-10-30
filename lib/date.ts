export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysUntil(date: string, from = localDateString()) {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = date.split("-").map(Number);
  return Math.round((new Date(toYear, toMonth - 1, toDay).getTime() - new Date(fromYear, fromMonth - 1, fromDay).getTime()) / 86_400_000);
}
