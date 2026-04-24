import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "DWF Wushu Competition Results",
	description: "View Wushu competition results",
	icons: {
		icon: "/logo.gif",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="de">
			<body>{children}</body>
		</html>
	);
}
