"use client";

import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

// Header in the style of www.wushudwf.de: dark bar with the DWF logo on the left.
export default function SiteHeader() {
  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#000000",
        boxShadow: "0 0 3px 0 rgba(0, 0, 0, 0.22)",
        color: "#ffffff",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: { xs: "56px", md: "64px" },
          gap: "16px",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}>
          <Image src="/DWFLogoalpha.png" alt="Deutsche Wushu Federation e.V." width={40} height={40} priority />
          <Typography component="span" sx={{ fontWeight: 600, fontSize: { xs: "15px", sm: "17px" }, color: "#ffffff" }}>
            DWF Wettkampfergebnisse
          </Typography>
        </Link>
        <Box
          component="a"
          href="https://wushudwf.de"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: { xs: "none", sm: "inline" },
            color: "#cccccc",
            fontSize: "14px",
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          wushudwf.de
        </Box>
      </Container>
    </Box>
  );
}
