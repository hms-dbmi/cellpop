import * as d3 from "d3";

import { wrapRowNames, wrapColNames } from "../dataLoading/dataWrangling";
import { renderCellPopVisualization } from "./index";
import { reorderArray } from "./util";

// Add context menu
export function defineContextMenu() {
	d3.select("#cellpopvis")
		.append("div")
		.attr("class", "context-menu")
		.style("background-color", "#FFFFFF")
		.attr("opacity", 0)
		.style("border", "solid")
		.style("border-width", "1px")
		.style("border-radius", "5px")
		.style("padding", "5px")
		.attr("pointer-events", "none")
		.style("position", "absolute")
}


export function addContextMenu(event, d, data, dimensions, fraction, themeColors, metadataField, y) {
	const menu = d3.select(".context-menu")
		.html(`Options:<br>`)
		.style("opacity", 1)
		.attr("visibility", "shown")
		.style("left", `${event.x + window.scrollX}px`)
		.style("top", `${event.y + window.scrollY}px`)


	if (event.shiftKey) {
		const buttonMoveTop = menu.append("input")
			.attr("type", "button")
			.attr("name", "move-row-top")
			.attr("value", "move row to top")

		const buttonMoveBottom = menu.append("input")
			.attr("type", "button")
			.attr("name", "move-row-bottom")
			.attr("value", "remove row to bottom")

		const buttonRemove = menu.append("input")
			.attr("type", "button")
			.attr("name", "remove-row-button")
			.attr("value", "remove row")

		buttonMoveTop.on("click", function(r) {return moveRowTop(d, data, dimensions, fraction, themeColors, metadataField)})
		buttonMoveBottom.on("click", function(r) {return moveRowBottom(d, data, dimensions, fraction, themeColors, metadataField)})
		buttonRemove.on("click", function(r) {return removeRow(d, data, dimensions, fraction, themeColors, metadataField)})
	}

	if (event.altKey) {
		const buttonMoveLeft = menu.append("input")
			.attr("type", "button")
			.attr("name", "move-col-left")
			.attr("value", "move column to left")

		const buttonMoveRight = menu.append("input")
			.attr("type", "button")
			.attr("name", "move-col-right")
			.attr("value", "remove column to right")

		const buttonRemove = menu.append("input")
			.attr("type", "button")
			.attr("name", "remove-col-button")
			.attr("value", "remove column")

		buttonMoveLeft.on("click", function(r) {return moveColLeft(d, data, dimensions, fraction, themeColors, metadataField)})
		buttonMoveRight.on("click", function(r) {return moveColRight(d, data, dimensions, fraction, themeColors, metadataField)})
		buttonRemove.on("click", function(r) {return removeCol(d, data, dimensions, fraction, themeColors, metadataField)})
	}

}


export function removeContextMenu() {
	d3.select(".context-menu")
		.html(``)
		.style("opacity", 0)
}


function moveRowTop(dataRect, data, dimensions, fraction, themeColors, metadataField) {
	// Get current index
	let currentIndex = data.rowNames.indexOf(dataRect.row);
	
	// Update the ordering of rowNames
    data.rowNames = reorderArray(data.rowNames, currentIndex, data.rowNames.length-1);
    wrapRowNames(data);

	// Re-render
	renderCellPopVisualization(data, dimensions, fraction, themeColors, metadataField);

	// Remove context menu
	removeContextMenu();
}


function moveRowBottom(dataRect, data, dimensions, fraction, themeColors, metadataField) {
	// Get current index
	let currentIndex = data.rowNames.indexOf(dataRect.row);

	// Update the ordering of rowNames
    data.rowNames = reorderArray(data.rowNames, currentIndex, 0);
    wrapRowNames(data);
	
	// Re-render
	renderCellPopVisualization(data, dimensions, fraction, themeColors, metadataField);

	// Remove context menu
	removeContextMenu();
}


function removeRow(dataRect, data, dimensions, fraction, themeColors, metadataField) {
	// Get current index
	let currentIndex = data.rowNames.indexOf(dataRect.row);

	// Remove row
	data.rowNames.splice(currentIndex, 1);
	wrapRowNames(data);

	// Re-render
	renderCellPopVisualization(data, dimensions, fraction, themeColors, metadataField);

	// Remove context menu
	removeContextMenu();
}


function moveColLeft(dataRect, data, dimensions, fraction, themeColors, metadataField) {
	// Get current index
	let currentIndex = data.colNames.indexOf(dataRect.col);
	
	// Update the ordering of rowNames
    data.colNames = reorderArray(data.colNames, currentIndex, 0);
    wrapColNames(data);

	// Re-render
	renderCellPopVisualization(data, dimensions, fraction, themeColors, metadataField);

	// Remove context menu
	removeContextMenu();
}


function moveColRight(dataRect, data, dimensions, fraction, themeColors, metadataField) {
	// Get current index
	let currentIndex = data.colNames.indexOf(dataRect.col);

	// Update the ordering of rowNames
    data.colNames = reorderArray(data.colNames, currentIndex, data.colNames.length-1);
    wrapColNames(data);
	
	// Re-render
	renderCellPopVisualization(data, dimensions, fraction, themeColors, metadataField);

	// Remove context menu
	removeContextMenu();
}


function removeCol(dataRect, data, dimensions, fraction, themeColors, metadataField) {
	// Get current index
	let currentIndex = data.colNames.indexOf(dataRect.col);

	// Remove row
	data.colNames.splice(currentIndex, 1);
	wrapColNames(data);

	// Re-render
	renderCellPopVisualization(data, dimensions, fraction, themeColors, metadataField);

	// Remove context menu
	removeContextMenu();
}
