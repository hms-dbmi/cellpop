import * as d3 from "d3";

import { getUpperBound } from "./util";
import { defineTooltipBarSide, addTooltipBarSide, removeTooltipBarSide } from "./tooltips";

export function renderLeftViolin(data, dimensions, y, themeColors, fraction) {
    console.log('here')
    let countsMatrix = data.countsMatrix;
	if (fraction) {
		countsMatrix = data.countsMatrixFractions.row;
	}
	// Remove any prior barcharts and violin plots
	d3.select("g.barleft").remove();
    d3.select("g.violinleft").remove();

	// Create svg element
	let svg = d3.select("g.main")
		.append("g")
			.attr("transform",
				"translate(" + eval(dimensions.barLeft.offsetWidth + dimensions.barLeft.margin.left) + "," + eval(dimensions.barLeft.offsetHeight + dimensions.barLeft.margin.top) + ")")
			.attr("class", "violinleft")

	// Get dimensions
	let width = dimensions.barLeft.width - dimensions.barLeft.margin.left - dimensions.barLeft.margin.right;
	let height = dimensions.barLeft.height - dimensions.barLeft.margin.top - dimensions.barLeft.margin.bottom;

	// Determine upper bound
    let upperbound = getUpperBound(countsMatrix.map(r => r.value));

    const y_changed = y.paddingInner(0.25)

	// Add y-axis
	const x = d3.scaleLinear()
		.range([ width, 0 ])
		.domain([ 0, upperbound])

	
	svg.append("g")
		.call(d3.axisBottom(x))
		.attr("transform", "translate(0," + height + ")")
		.selectAll("text")
			.attr("transform", "translate(-10,0)rotate(-45)")
			.style("text-anchor", "end")
			.style("font-size", dimensions.textSize.tick)
			.style("fill", themeColors.text);

	svg.append("text")
		.attr("class", "x label")
		.attr("text-anchor", "end")
		.attr("x", width - 50)
		.attr("y", 40)
		.attr("dy", ".75em")
		.attr("transform", "translate(0," + height + ")")
		.text("Fraction of cells")
		.style("font-size", dimensions.textSize.labelSmall)
		.style("fill", themeColors.text);

    function kde(kernel, thds) {
        return V => thds.map(t => [t, d3.mean(V, d => kernel(t - d))])
    }

    function epanechnikov(bandwidth) {
        return x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
    }

    const bandwidth = 0.1;
    const thds = x.ticks(100)
    const density = kde(epanechnikov(bandwidth), thds)

    const violins = d3.rollup(countsMatrix, v => density(v.map(g => g.value)), d => d.row)

    var allNum = [];
    [...violins.values()].forEach((d,i) => allNum = allNum.concat([...violins.values()][i].map(d => d[1])))
    const xNum  = d3.scaleLinear()
        .domain([-d3.max(allNum), d3.max(allNum)])
        .range([0, y_changed.bandwidth()])


    const area = d3.area()
        .y0(d => xNum(-d[1]))
        .y1(d => xNum(d[1]))
        .x(d => x(d[0]))
        .curve(d3.curveBumpY)

    svg.append('g')
        .selectAll('g')
        .data([...violins])
        .join('g')
            .attr('transform', d => `translate(0, ${y_changed(d[0])})`)
        .append('path')
            .datum(d => d[1])
            .style('stroke', 'none')
            .style('fill', themeColors.bars)
            .attr('d', area)
}