"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatDate } from "./utilities/formatDate";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { TEvent } from "@/lib/db";
import { selectEvents } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchEvents } from "@/lib/store/eventsSlice";

export default function Home() {
  const dispatch = useAppDispatch();

  // The event list is held in the redux store, which mirrors the database.
  const { items: events, status } = useAppSelector(selectEvents);
  const loading = status === "idle" || (status === "loading" && events.length === 0);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Extract year from slug (format: YYYY-slug)
  const getEventUrl = (event: TEvent) => {
    const slugParts = event.slug.split("-");
    const year = slugParts[0];
    const slug = slugParts.slice(1).join("-");
    return `/events/${year}/${slug}`;
  };

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        padding: { xs: "16px", lg: "56px" },
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="lg" sx={{ padding: 0 }}>
        <Typography
          variant={isSm ? "h4" : "h3"}
          sx={{
            marginBottom: "32px",
            fontWeight: "bold",
          }}
        >
          DWF Wushu Competition Results
        </Typography>

        <Box sx={{ marginBottom: "32px" }}>
          <Typography variant="h5" sx={{ marginBottom: "16px", fontWeight: "600" }}>
            Veranstaltungen
          </Typography>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                padding: "32px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : events.length === 0 ? (
            <Card variant="outlined">
              <CardContent
                sx={{
                  padding: "32px",
                  textAlign: "center",
                }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ marginBottom: "16px" }}>
                  Noch keine Veranstaltungen vorhanden.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nutze die API (/api/import) um Daten zu importieren.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={getEventUrl(event)}
                  style={{
                    textDecoration: "none",
                  }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "primary.light",
                        transform: "translateY(-2px)",
                        boxShadow: 3,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        padding: "16px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "600",
                              color: "text.primary",
                            }}
                          >
                            {event.name}
                          </Typography>
                          {event.date && (
                            <Typography variant="body2" color="text.secondary">
                              Datum: {formatDate(event.date)}
                            </Typography>
                          )}
                          {event.location && (
                            <Typography variant="body2" color="text.secondary">
                              Ort: {event.location}
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: "bold",
                            color: "primary.main",
                          }}
                        >
                          {event.year}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
