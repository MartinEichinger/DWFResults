import type { Metadata } from "next";
import "./globals.css";
import MuiThemeProvider from "./ThemeProvider";
import StoreProvider from "./StoreProvider";

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
      <body>
        <StoreProvider>
          <MuiThemeProvider>{children}</MuiThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
