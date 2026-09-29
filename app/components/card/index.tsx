import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { formatTime } from "@/app/utilities/formatTime";
import { Result } from "@/app/events/[year]/[slug]/EventResultsClient";
import Badge from "@mui/material/Badge";

const debug = 0;

interface ResultCardProps {
  index: number;
  title: string;
  startingPlace: string | null;
  completionTime: string | null;
  startTime: string | null;
  entries: Result[];
}

function displayRatings(entries: Result) {
  return [
    ["HS", entries.rating1],
    ["S1", entries.rating2],
    ["S2", entries.rating3],
    ["S3", entries.rating4],
    ["S4", entries.rating5],
    ["S5", entries.rating6],
    ["S6", entries.rating7],
    ["S7", entries.rating8],
    [" / HS", entries.mainrefereedeductionjustification],
  ]
    .filter(([, rating]) => rating !== null)
    .map(([label, rating]) => `${label}: ${rating}`)
    .join(" - ");
}

export default function ResultCard({ index, title, startingPlace, startTime, completionTime, entries }: ResultCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: { xs: "350px", md: "425px" },
        maxWidth: "600px",
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        boxShadow: 3,
        flex: "1 1 0px",
      }}
    >
      <CardContent sx={{ padding: "0px" }}>
        <Box sx={{ display: "flex", flexDirection: "row", bgcolor: "primary.light", padding: "8px" }}>
          <Avatar
            sx={{
              marginRight: "16px",
              bgcolor: "primary.main",
            }}
          >
            {startingPlace}
          </Avatar>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="h6"
              sx={{
                color: "text.primary",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "primary.contrastText",
                fontSize: "0.8rem",
              }}
            >
              {completionTime !== null ? `Abschluss: ${formatTime(completionTime)} Uhr` : `Geplanter Start: ${formatTime(startTime ?? "")} Uhr`}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            padding: "8px 8px",
          }}
        >
          {entries.map((entry, idx) => {
            if (debug > 0)
              console.log(
                "ResultCard/entry: ",
                entry.mainrefereededuction,
                entry.mainrefereededuction && entry.mainrefereededuction > 0 ? entry.mainrefereededuction : "-",
              );
            return (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "0px",
                  padding: { xs: "4px 0px", md: "8px 16px" },
                  borderRadius: "4px",
                }}
                key={idx}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      marginRight: "12px",
                      border: "1px",
                      bgcolor: entry.placement === 1 ? "gold" : entry.placement === 2 ? "silver" : entry.placement === 3 ? "#cd7f32" : "primary.light",
                      color: entry.placement && entry.placement <= 3 ? "black" : "white",
                      fontWeight: "semibold",
                    }}
                  >
                    {completionTime !== null ? entry.notshowedup ? "nE" : entry.placement : <PersonOutlineOutlinedIcon />}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "text.primary",
                        fontWeight: "500",
                      }}
                    >
                      {entry.name} - {entry.club}
                    </Typography>
                    {completionTime !== null && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.8rem",
                        }}
                      >
                        {displayRatings(entry)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    minWidth: "45px",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                    }}
                  >
                    {entry.reasonForDecision !== undefined ? (
                      <Badge badgeContent={entry.reasonForDecision} color="primary">
                        {entry.finalscore?.toFixed(2)}
                      </Badge>
                    ) : (
                      entry.finalscore?.toFixed(2) || "-"
                    )}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
