export const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
};
