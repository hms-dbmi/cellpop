import { scaleLinear } from "@visx/scale";
import React, { useLayoutEffect, useRef } from "react";

import { useTheme } from "@mui/material/styles";
import { useColorScale } from "../../contexts/ColorScaleContext";
import {
  useColumns,
  useData,
  useFractionDataMap,
  useRowMaxes,
  useRows,
} from "../../contexts/DataContext";
import { useHeatmapDimensions } from "../../contexts/DimensionsContext";
import { useSelectedValues } from "../../contexts/ExpandedValuesContext";
import { useNormalization } from "../../contexts/NormalizationContext";
import { useXScale, useYScale } from "../../contexts/ScaleContext";
import { useSelectedDimension } from "../../contexts/SelectedDimensionContext";
import { useSetTooltipData } from "../../contexts/TooltipDataContext";
import DragOverlayContainer from "./DragOverlay";

function CanvasHeatmapRenderer() {
  const { width, height } = useHeatmapDimensions();
  const rows = useRows();
  const columns = useColumns();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const xScale = useXScale();
  const yScale = useYScale();
  const selectedValues = useSelectedValues((s) => s.selectedValues);

  const { scale: globalScale, percentageScale, heatmapTheme } = useColorScale();
  const normalization = useNormalization((s) => s.normalization);
  const dataMap = useFractionDataMap(normalization);
  const rowMaxes = useRowMaxes();
  const theme = useTheme();

  const { closeTooltip } = useSetTooltipData();

  useLayoutEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, width, height);
    const cellWidth = Math.ceil(xScale.scale.bandwidth());
    rows.forEach((row) => {
      const cellHeight = Math.ceil(yScale.scale.bandwidth(row));
      if (selectedValues.has(row)) {
        // draw bar graph
        const max = rowMaxes[row];

        const inlineYScale = scaleLinear({
          domain: [0, max],
          range: [0, cellHeight],
          nice: true,
        });
        columns.forEach((col) => {
          const key = `${row}-${col}`;
          const value = dataMap[key as keyof typeof dataMap];
          const x = xScale.scale(col);
          const yBackground = yScale.scale(row);
          const barHeight = inlineYScale(value);
          const yBar = yBackground + cellHeight - barHeight;
          ctx.fillStyle = theme.palette.background.default;
          ctx.fillRect(x, yBackground, cellWidth, cellHeight);
          ctx.fillStyle = theme.palette.text.primary;
          ctx.fillRect(x, yBar, cellWidth, barHeight);
        });
      } else {
        // draw heatmap cells
        columns.forEach((col) => {
          const colors =
            normalization !== "None" ? percentageScale : globalScale;
          const value = dataMap[`${row}-${col}` as keyof typeof dataMap];
          ctx.fillStyle = colors(value);
          ctx.strokeStyle = colors(colors.domain()[1] / 2);
          ctx.strokeRect(
            xScale.scale(col),
            yScale.scale(row),
            Math.ceil(cellWidth),
            Math.ceil(cellHeight),
          );
          ctx.fillRect(
            xScale.scale(col),
            yScale.scale(row),
            Math.ceil(cellWidth),
            Math.ceil(cellHeight),
          );
        });
      }
    });
  }, [
    xScale,
    yScale,
    dataMap,
    rowMaxes,
    selectedValues,
    normalization,
    heatmapTheme,
  ]);

  return (
    <canvas
      onMouseOut={closeTooltip}
      ref={canvasRef}
      width={width}
      height={height}
      className="heatmap"
    />
  );
}

export default function Heatmap() {
  const { selectedDimension } = useSelectedDimension();
  const rows = useRows();
  const columns = useColumns();

  const items = selectedDimension === "X" ? columns : rows;

  const { setItems, resetSort } = useData((store) => ({
    setItems:
      selectedDimension === "X" ? store.setColumnOrder : store.setRowOrder,
    resetSort:
      selectedDimension === "X"
        ? store.clearColumnSortOrder
        : store.clearRowSortOrder,
  }));

  return (
    <DragOverlayContainer
      items={items}
      setItems={setItems}
      resetSort={resetSort}
    >
      <CanvasHeatmapRenderer />
    </DragOverlayContainer>
  );
}
