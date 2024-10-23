import * as d3 from "d3";

import {
  CountsMatrixValue,
  CountsTotalRowValue,
  CountsTotalColValue,
} from "../cellpop-schema";

// heatmap tooltip

// Add tooltip
export function defineTooltip() {
  d3.select("#cellpopvis")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "#FFFFFF")
    .attr("opacity", 0)
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .attr("pointer-events", "none")
    // .attr("visibility", "hidden")
    .style("position", "absolute");
}

export function addTooltip(event: MouseEvent, d: CountsMatrixValue) {
  d3.select(".tooltip")
    .html(`Row: ${d.row}<br>Column: ${d.col}<br>Value: ${d.value}`)
    .style("opacity", 0.8)
    .attr("visibility", "shown")
    .style("left", `${event.x + window.scrollX}px`)
    .style("top", `${event.y + window.scrollY}px`);
}

export function removeTooltip() {
  d3.select(".tooltip").html("").style("opacity", 0);
}

// Add tooltip
export function defineTooltipBarSide() {
  d3.select("#cellpopvis")
    .append("div")
    .attr("class", "tooltip-axis-y")
    .style("background-color", "#FFFFFF")
    .attr("opacity", 0)
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .attr("pointer-events", "none")
    // .attr("visibility", "hidden")
    .style("position", "absolute");
}

export function addTooltipBarSide(
  event: MouseEvent,
  d: CountsTotalRowValue,
  metadata: any,
) {
  const metadataTextArray = Object.keys(metadata).map(
    (k) => `${k}: ${metadata[k]}`,
  );
  const metadataText = metadataTextArray.join("<br>");

  d3.select(".tooltip-axis-y")
    .html(
      `Row: ${d.row}<br>Total count: ${d.countTotal}<br>Metadata:<br>${metadataText}`,
    )
    .style("opacity", 0.8)
    .attr("visibility", "shown")
    .style("left", `${event.x + window.scrollX}px`)
    .style("top", `${event.y + window.scrollY}px`);
}

export function removeTooltipBarSide() {
  d3.select(".tooltip-axis-y").html("").style("opacity", 0);
}

// Add tooltip
export function defineTooltipBarTop() {
  d3.select("#cellpopvis")
    .append("div")
    .attr("class", "tooltip-axis-x")
    .style("background-color", "#FFFFFF")
    .attr("opacity", 0)
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .attr("pointer-events", "none")
    // .attr("visibility", "hidden")
    .style("position", "absolute");
}

export function addTooltipBarTop(
  event: MouseEvent,
  d: CountsTotalColValue,
  metadata: any,
) {
  d3.select(".tooltip-axis-x")
    .html(`Column: ${d.col}<br>Total count: ${d.countTotal}`)
    .style("opacity", 0.8)
    .attr("visibility", "shown")
    .style("left", `${event.x + window.scrollX}px`)
    .style("top", `${event.y + window.scrollY}px`);
}

export function removeTooltipBarTop() {
  d3.select(".tooltip-axis-x").html("").style("opacity", 0);
}
