import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { formatTime } from "@/app/utilities/formatTime";
import { Result } from "@/app/events/[year]/[slug]/page";

/* interface ResultEntry {
  rank?: number;
  athlete_name: string;
  athlete_club?: string;
  score?: number;
  rating1: number | null;
  rating2: number | null;
  rating3: number | null;
  rating4: number | null;
  rating5: number | null;
  rating6: number | null;
  rating7: number | null;
  rating8: number | null;
  standarddeviation: number;
} */

interface ResultCardProps {
  index: number;
  title: string;
  startingPlace: string;
  completionTime: string;
  startTime: string;
  entries: Result[];
}

function displayRatings(entries: Result) {
  console.log("displayRatings: ", entries);
  return [
    ["HS", entries.rating1],
    ["S1", entries.rating2],
    ["S2", entries.rating3],
    ["S3", entries.rating4],
    ["S4", entries.rating5],
    ["S5", entries.rating6],
    ["S6", entries.rating7],
    ["S7", entries.rating8],
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
        minWidth: { xs: "375px", md: "425px" },
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
            {completionTime !== null ? <EmojiEventsIcon /> : `${startingPlace}`}
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
              {completionTime !== null ? `Abschluss: ${formatTime(completionTime)} Uhr` : `Geplanter Start: ${formatTime(startTime)} Uhr`}
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
          {entries.map((entry, idx) => (
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
                    bgcolor: entry.rank === 1 ? "gold" : entry.rank === 2 ? "silver" : entry.rank === 3 ? "#cd7f32" : "primary.light",
                    color: entry.rank && entry.rank <= 3 ? "black" : "white",
                    fontWeight: "bold",
                  }}
                >
                  {completionTime ? entry.rank : <PersonOutlineOutlinedIcon />}
                </Avatar>
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      fontWeight: "500",
                    }}
                  >
                    {entry.athlete_name} - {entry.athlete_club}
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
                  alignItems: "flex-end",
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
                  {entry.score?.toFixed(2) || "-"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
