"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
	palette: {
		primary: {
			main: "#1976d2",
			light: "#42a5f5",
		},
		secondary: {
			main: "#dc004e",
		},
		success: {
			main: "#4caf50",
		},
		background: {
			default: "#fafafa",
			paper: "#ffffff",
		},
	},
	typography: {
		fontFamily: "inherit",
	},
});

export default function MuiThemeProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
}
