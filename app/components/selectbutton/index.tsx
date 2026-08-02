"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type SelectButtonProps = {
  listdata: {
    label: string;
    values: string[] | undefined;
  };
  setFilter: (value: string) => void;
};

const SelectButton: React.FC<SelectButtonProps> = ({ listdata, setFilter }) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value: string) => {
    setFilter(value);
    handleClose();
  };

  const options = listdata.values?.filter((v) => v !== "") ?? [];

  return (
    <>
      <Button
        ref={buttonRef}
        variant="outlined"
        onClick={handleClick}
        endIcon={<ExpandMoreIcon />}
        sx={{
          color: "white",
          border: "none",
          "&:hover": {
            border: "none",
            backgroundColor: "rgba(255,255,255,0.1)",
          },
          margin: "8px",
          textTransform: "none",
        }}
      >
        {listdata.label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              minWidth: buttonRef.current?.offsetWidth ?? 0,
            },
          },
        }}
      >
        {options.map((item) => (
          <MenuItem key={item} onClick={() => handleSelect(item)}>
            {item}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default SelectButton;
