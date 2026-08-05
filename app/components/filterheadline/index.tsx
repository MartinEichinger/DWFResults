import { Box, Button, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import type { ReactNode } from "react";

type ResponsiveOffset = Record<string, string | number>;

interface FilterHeadlineProps {
  title: string;
  subtitle?: string;
  filterOn: boolean;
  onToggleFilter: () => void;
  children: ReactNode;
  titleVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  subtitleVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  titleColor?: string;
  topOffset?: string | number | ResponsiveOffset;
}

const debug = 1;

const FilterHeadline = ({
  title,
  subtitle,
  filterOn,
  onToggleFilter,
  children,
  titleVariant = "h4",
  subtitleVariant = "h5",
  titleColor = "white",
  topOffset = { lg: "120px", xs: "72px" },
}: FilterHeadlineProps) => {
  if (debug > 0) console.log("FilterHeadline: ", filterOn);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        flexWrap: "nowrap",
        justifyContent: "space-between",
        marginBottom: "8px",
        bgcolor: "primary.light",
        borderRadius: "4px",
        width: "100%",
        minWidth: 0,
        height: { xs: "auto", lg: "90px" },
        position: "sticky",
        top: topOffset,
        zIndex: "1",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          flex: "0 0 auto",
          minWidth: 0,
          justifyContent: "space-between",
          width: { xs: "100%", md: "auto" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          <Typography
            variant={titleVariant}
            sx={{
              color: titleColor,
              padding: "4px 24px 4px 8px",
              fontSize: { xs: "1.5rem", sm: "2.5rem" },
              overflowWrap: "break-word",
            }}
          >
            {title}
          </Typography>
          <Typography
            variant={subtitleVariant}
            sx={{
              color: titleColor,
              padding: "2px 24px 4px 8px",
              fontSize: { xs: "0.75rem", sm: "1rem" },
              overflowWrap: "break-word",
            }}
          >
            {subtitle}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={onToggleFilter}
          sx={{
            color: "white",
            border: "none",
            flex: "0 0 auto",
            whiteSpace: "nowrap",
            "&:hover": {
              border: "none",
              backgroundColor: "rgba(255,255,255,0.1)",
            },
            margin: "8px",
            textTransform: "none",
            display: { xs: "flex", lg: "none" },
          }}
          endIcon={filterOn ? <FilterListOffIcon /> : <FilterListIcon />}
        >
          Filter
        </Button>
      </Box>
      <Box
        sx={
          filterOn
            ? {
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignContent: "center",
                justifyContent: "flex-end",
                flex: "0 1 auto",
                minWidth: 0,
              }
            : {
                display: { xs: "none", lg: "flex" },
                flexDirection: "row",
                flexWrap: "wrap",
                alignContent: "center",
                justifyContent: "flex-end",
                flex: "0 1 auto",
                minWidth: 0,
              }
        }
      >
        {children}
      </Box>
    </Box>
  );
};

export default FilterHeadline;
