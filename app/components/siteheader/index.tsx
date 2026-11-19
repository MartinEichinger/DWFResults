"use client";

import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

const LOGO_SIZE = 40;

// Header in the style of www.wushudwf.de: dark bar with the DWF logo on the left and the centered title.
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
          display: "grid",
          gridTemplateColumns: `${LOGO_SIZE}px 1fr ${LOGO_SIZE}px`,
          alignItems: "center",
          minHeight: { xs: "56px", md: "64px" },
          gap: "16px",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <Image src="/DWFLogoalpha.png" alt="Deutsche Wushu Federation e.V." width={LOGO_SIZE} height={LOGO_SIZE} priority />
        </Link>
        <Link href="/" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
          <Typography component="span" sx={{ fontWeight: 600, fontSize: { xs: "15px", sm: "17px" }, color: "#ffffff" }}>
            DWF Wettkampfergebnisse
          </Typography>
        </Link>
        <Box />
      </Container>
    </Box>
  );
}
