import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { formatTime } from "@/app/utilities/formatTime";

interface ResultEntry {
  rank?: number;
  athlete_name: string;
  athlete_club?: string;
  score?: number;
  difficulty?: number;
  execution?: number;
}

interface ResultCardProps {
  index: number;
  title: string;
  completionTime: string;
  entries: ResultEntry[];
}

export default function ResultCard({ index, title, completionTime, entries }: ResultCardProps) {
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
      <CardContent sx={{ padding: "8px" }}>
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <Avatar
            sx={{
              marginRight: "16px",
              bgcolor: "primary.main",
            }}
          >
            <EmojiEventsIcon />
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
                color: "text.secondary",
                fontSize: "0.8rem",
              }}
            >
              {formatTime(completionTime)}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            padding: "4px 16px",
          }}
        >
          {entries.map((entry, idx) => (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "8px 0px",
                padding: "8px",
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
                  {entry.rank || "-"}
                </Avatar>
                <Box>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      fontWeight: "500",
                    }}
                  >
                    {entry.athlete_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.8rem",
                    }}
                  >
                    {entry.athlete_club || "-"}
                  </Typography>
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
                {(entry.difficulty !== undefined || entry.execution !== undefined) && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.7rem",
                    }}
                  >
                    {entry.difficulty !== undefined && `S: ${entry.difficulty.toFixed(2)}`}
                    {entry.difficulty !== undefined && entry.execution !== undefined && " | "}
                    {entry.execution !== undefined && `A: ${entry.execution.toFixed(2)}`}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
