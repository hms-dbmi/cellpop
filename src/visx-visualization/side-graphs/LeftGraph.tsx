import { useTheme } from "@mui/material/styles";
import { AxisBottom } from "@visx/axis";
import { formatPrefix, max } from "d3";
import React from "react";
import { useRowConfig } from "../../contexts/AxisConfigContext";
import { useMaxCount, useRowCounts } from "../../contexts/DataContext";
import { usePanelDimensions } from "../../contexts/DimensionsContext";
import { useSelectedValues } from "../../contexts/ExpandedValuesContext";
import { useFraction } from "../../contexts/FractionContext";
import { useYScale } from "../../contexts/ScaleContext";
import HeatmapYAxis from "../heatmap/HeatmapYAxis";
import Bars from "./Bars";
import Violins from "./Violin";
import { LEFT_MULTIPLIER } from "./constants";
import { useCountsScale } from "./hooks";

const useXAxisCountsScale = () => {
  const { width } = usePanelDimensions("left_middle");
  const rowCounts = useRowCounts();
  const upperBound = useMaxCount();
  const fraction = useFraction((s) => s.fraction);
  const { tickLabelSize } = useYScale();
  const domainMax = fraction ? upperBound : max(Object.values(rowCounts));
  return useCountsScale(
    [0, domainMax],
    [0, width - tickLabelSize * LEFT_MULTIPLIER],
  );
};

function LeftBar() {
  const { width } = usePanelDimensions("left_middle");
  const xScale = useXAxisCountsScale();
  // Use same y scale as the heatmap
  const { scale: yScale, nonExpandedSize } = useYScale();
  const selectedValues = useSelectedValues((s) => s.selectedValues);

  return (
    <g className="bar-graph-left">
      <Bars
        orientation="horizontal"
        categoricalScale={yScale}
        numericalScale={xScale}
        domainLimit={width}
        selectedValues={selectedValues}
        nonExpandedSize={nonExpandedSize}
      />
    </g>
  );
}

export function LeftGraphScale() {
  const { width, height } = usePanelDimensions("left_bottom");
  const xScale = useXAxisCountsScale();
  const { tickLabelSize } = useYScale();

  const axisScale = xScale.copy().range([width, tickLabelSize * 1.25]);
  const axisTotalWidth = width - tickLabelSize * LEFT_MULTIPLIER;

  const theme = useTheme();
  return (
    <svg
      width={width}
      height={height}
      style={{ borderTop: `1px solid ${theme.palette.text.primary}` }}
    >
      <AxisBottom
        scale={axisScale}
        hideZero
        hideAxisLine
        top={0}
        orientation="bottom"
        stroke={theme.palette.text.primary}
        tickLabelProps={{ fill: theme.palette.text.primary, className: "text" }}
        tickStroke={theme.palette.text.primary}
        tickFormat={(t) => formatPrefix(".0k", t as number)(t)}
        tickValues={axisTotalWidth > 150 ? undefined : [xScale.domain()[1]]}
      />
    </svg>
  );
}

function LeftViolin() {
  return <Violins side="left" />;
}

/**
 * Container component for the left graph.
 */
export default function LeftGraph() {
  const { width, height } = usePanelDimensions("left_middle");

  const { fraction } = useFraction();
  const flipAxisPosition = useRowConfig((store) => store.flipAxisPosition);
  return (
    <svg className="left-graph-container" height={height} width={width}>
      {fraction ? <LeftViolin /> : <LeftBar />}
      {flipAxisPosition && <HeatmapYAxis />}
    </svg>
  );
}
