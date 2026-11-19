"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

// Footer in the style of www.wushudwf.de: dark background with a muted copyright line.
export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#252525",
        color: "#cccccc",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: "8px",
          paddingY: "24px",
        }}
      >
        <Typography sx={{ color: "#777777", fontSize: "12px" }}>© {new Date().getFullYear()} Deutsche Wushu Federation e.V.</Typography>
        <Box
          component="a"
          href="https://wushudwf.de"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "#cccccc",
            fontSize: "12px",
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          www.wushudwf.de
        </Box>
      </Container>
    </Box>
  );
}
