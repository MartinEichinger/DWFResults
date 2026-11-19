import type { Metadata } from "next";
import "./globals.css";
import MuiThemeProvider from "./ThemeProvider";
import StoreProvider from "./StoreProvider";
import SiteHeader from "./components/siteheader";
import SiteFooter from "./components/sitefooter";

export const metadata: Metadata = {
  title: "DWF Wushu Competition Results",
  description: "View Wushu competition results",
  icons: {
    icon: "/DWFLogoalpha.png",
    apple: "/DWFLogoalpha.png",
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
          <MuiThemeProvider>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
              <SiteHeader />
              <main style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>{children}</main>
              <SiteFooter />
            </div>
          </MuiThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
