export const formatDate = (dateStr: string) =>
	new Date(dateStr).toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
