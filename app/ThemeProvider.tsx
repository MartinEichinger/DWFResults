"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
	palette: {
		// Colors adapted from www.wushudwf.de
		primary: {
			main: "#e2001a",
			light: "#e8334a",
			dark: "#b00014",
			contrastText: "#ffffff",
		},
		secondary: {
			main: "#e4c23d",
			contrastText: "#252525",
		},
		success: {
			main: "#4caf50",
		},
		background: {
			default: "#eaeaea",
			paper: "#ffffff",
		},
		text: {
			primary: "#333333",
			secondary: "#676767",
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
