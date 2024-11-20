import React, { ChangeEvent } from "react";
import {
  HEATMAP_THEMES,
  HeatmapTheme,
  useColorScale,
} from "../contexts/ScaleContext";

import { AppBar, Stack } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useEventCallback } from "@mui/material/utils";

import { useSetTheme } from "../contexts/CellPopThemeContext";
import { useFraction } from "../contexts/FractionContext";
import { useSelectedDimension } from "../contexts/SelectedDimensionContext";
import LabelledSwitch from "./LabelledSwitch";

export default function Controls() {
  const { setHeatmapTheme, heatmapTheme } = useColorScale();

  const handleThemeChange = useEventCallback((e: SelectChangeEvent) => {
    setHeatmapTheme(e.target.value as HeatmapTheme);
  });

  const { currentTheme, setTheme } = useSetTheme();
  const { setFraction } = useFraction();
  const { setSelectedDimension } = useSelectedDimension();

  const changeVisTheme = useEventCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newTheme = e.target.checked ? "dark" : "light";
      setTheme(newTheme);
    },
  );

  const changeFraction = useEventCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newFraction = Boolean(event.target.checked);
      setFraction(newFraction);
    },
  );

  const changeSelectedDimension = useEventCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newSelectedDimension = event.target.checked ? "Y" : "X";
      setSelectedDimension(newSelectedDimension);
    },
  );

  return (
    <AppBar
      color={currentTheme === "dark" ? "default" : "transparent"}
      position="static"
      elevation={0}
    >
      <Stack direction="row" spacing={5} p={1}>
        <FormControl sx={{ maxWidth: 300 }}>
          <InputLabel id="heatmap-theme-select-label">
            Heatmap Themes
          </InputLabel>
          <Select
            labelId="heatmap-theme-select-label"
            id="heatmap-theme-select"
            value={heatmapTheme}
            onChange={handleThemeChange}
            variant="outlined"
            label="Heatmap Themes"
            sx={{ textTransform: "capitalize", minWidth: 200 }}
          >
            {HEATMAP_THEMES.map((theme) => (
              <MenuItem
                key={theme}
                value={theme}
                sx={{ textTransform: "capitalize" }}
              >
                {theme}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <LabelledSwitch
          label="Graph Type"
          leftLabel="Count"
          rightLabel="Fraction"
          onChange={changeFraction}
        />
        <LabelledSwitch
          label="Selection Tool"
          leftLabel="Column"
          rightLabel="Row"
          onChange={changeSelectedDimension}
        />
        <LabelledSwitch
          label="Theme"
          leftLabel="Light"
          rightLabel="Dark"
          onChange={changeVisTheme}
        />
      </Stack>
    </AppBar>
  );
}
