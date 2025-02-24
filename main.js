let vegetableTypes, weeklySelection;

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#temporal-visualization").style("height", "90vh").attr("width", 1.3 * document.getElementById("temporal-visualization").clientHeight)

    renderVisualization();

    d3.selectAll("text").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("temporal-visualization").clientWidth })
    d3.selectAll("tspan").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("temporal-visualization").clientWidth })

    d3.select("#disclaimer").style("display", +d3.select("svg").attr("width") > window.innerWidth ? "block" : "none");
};

window.onresize = resizeAndRender;

const setupTemporalVisualization = () => {
    const containerWidth = document.getElementById("temporal-visualization").clientWidth;
    const containerHeight = document.getElementById("temporal-visualization").clientHeight;

    const margin = {
        top: 0.08 * containerHeight,
        right: 0 * containerWidth,
        bottom: 0.01 * containerHeight,
        left: 0.085 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const renderVisualization = () => {
        const columnWidth = width / (weeklySelection.length + 6.5);
        const rowHeight = height / vegetableTypes.length;
        const totalHeight = rowHeight * (vegetableTypes.filter(vegetableType => vegetableType.includeInTemporal).length + 0.5)

        const svg = d3.select("#temporal-visualization");

        $("#temporal-visualization").animate({ height: margin.top + totalHeight }, svg.attr("first-render") === null ? 0 : 500, "swing");
        svg.attr("first-render", "false");

        let index = 0;
        vegetableTypes.forEach(vegetableType => vegetableType.includeInTemporal ? vegetableType.index = index++ : vegetableType.index = index);

        // Render rows
        const row = svg.selectAll(".row")
            .data(vegetableTypes, d => d.name);

        const rowEnter = row.enter().append("g")
            .attr("class", "row")
            .attr("transform", d => `translate(0, ${margin.top + d.index * rowHeight})`)
            .attr("opacity", d => d.includeInTemporal ? 1 : 0);

        row.merge(rowEnter)
            .transition()
            .duration(500)
            .attr("transform", d => `translate(0, ${margin.top + d.index * rowHeight})`)
            .attr("opacity", d => d.includeInTemporal ? 1 : 0);
        
        row.exit().remove();

        const rowBackground = row.merge(rowEnter).selectAll(".row-background")
            .data(d => [d]);

        const rowBackgroundEnter = rowBackground
            .enter()
            .append("rect")
            .attr("class", "row-background")
            .attr("width", containerWidth)
            .attr("height", rowHeight)
            .attr("rx", rowHeight / 2)
            .attr("ry", rowHeight / 2)
            .attr("fill", "#d6143f")
            .attr("opacity", d => d.index % 2 === 0 ? 0.1 : 0);

        rowBackground.merge(rowBackgroundEnter)
            .transition()
            .duration(500)
            .attr("opacity", d => d.index % 2 === 0 ? 0.1 : 0);

        rowBackground.exit().remove();

        row.merge(rowEnter).selectAll(".row-text")
            .data(d => [d])
            .join("text")
            .attr("class", "row-text")
            .text(d => d.display)
            .attr("text-multiplier", 1)
            .attr("dominant-baseline", "middle")
            .attr("transform", d => `translate(${(d.isSubType ?  0.3 : 0.1) * margin.left}, ${rowHeight / 2})`);

        row.merge(rowEnter).selectAll(".row-image")
            .data(d => [d].filter(d => "subtypes" in d))
            .join("image")
            .attr("class", "row-image")
            .attr("href", d => d.includeSubTypes ? "images/dropdown-icon-up.png" : "images/dropdown-icon-down.png")
            .attr("width", 0.8 * rowHeight)
            .attr("height", 0.8 * rowHeight)
            .attr("x", margin.left)
            .attr("y", 0.1 * rowHeight)
            .on("click", (_, d) => {
                d.includeSubTypes = !d.includeSubTypes;
                vegetableTypes.forEach(vegetableType => {
                    if (d.subtypes.includes(vegetableType.name)) {
                        vegetableType.includeInTemporal = d.includeSubTypes;
                    }
                });
                renderVisualization();
            });

        // Render columns
        const seasonSizes = {
            2022: [0, 11],
            2023: [22, 31],
            2024: [40, 51],
            2025: [62]
        }
        const column = svg.selectAll(".column")
            .data(weeklySelection, d => `${d.date.getFullYear()}-${d.season}-${d.week}`)
            .join("g")
            .attr("class", "column")
            .attr("transform", d => `translate(${margin.left + (seasonSizes[d.date.getFullYear()][d.season - 1] + d.week) * columnWidth}, ${2 * margin.top / 3})`);

        const columnBackground = column.selectAll(".column-background")
            .data(d => [d]);

        const columnBackgroundEnter = columnBackground
            .enter()
            .append("rect")
            .attr("class", "column-background")
            .attr("width", columnWidth)
            .attr("height", margin.top / 3 + totalHeight)
            .attr("rx", columnWidth / 2)
            .attr("ry", columnWidth / 2)
            .attr("fill", "#d6143f")
            .attr("opacity", d => d.week % 2 === 1 ? 0.1 : 0);

        columnBackground.merge(columnBackgroundEnter)
            .transition()
            .duration(500)
            .attr("height", margin.top / 3 + totalHeight);

        columnBackground.exit().remove();

        column.selectAll(".column-text")
            .data(d => [d])
            .join("text")
            .attr("class", "column-text")
            .text(d => d.week)
            .attr("text-multiplier", 1)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${columnWidth / 2}, ${1 * margin.top / 6})`);

        svg.selectAll(".year-text")
            .data([2022, 2023, 2024])
            .join("text")
            .attr("class", "year-text")
            .text(d => d)
            .attr("text-multiplier", 1.8)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${margin.left + (seasonSizes[d][0] + (seasonSizes[d + 1][0] - seasonSizes[d][0] + 1) / 2) * columnWidth}, ${1 * margin.top / 6})`);

        svg.selectAll(".season-text")
            .data([{year: 2022, season: 1}, {year: 2022, season: 2}, {year: 2023, season: 1}, {year: 2023, season: 2}, {year: 2024, season: 1}, {year: 2024, season: 2}])
            .join("text")
            .attr("class", "season-text")
            .text(d => `Season ${d.season}`)
            .attr("text-multiplier", 1.4)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${margin.left + (seasonSizes[d.year][d.season - 1] + (d.season > 1 ? seasonSizes[d.year + 1][0] : seasonSizes[d.year][d.season])) * columnWidth / 2}, ${3 * margin.top / 6})`);

        // Render cells
        const cell = column.selectAll(".cell")
            .data(d => vegetableTypes.filter(vegetableType => d[vegetableType.name]), d => d.name);

        const cellEnter = cell.enter().append("rect")
            .attr("class", "cell")
            .attr("width", 0.8 * rowHeight)
            .attr("height", 0.8 * rowHeight)
            .attr("rx", 0.4 * rowHeight)
            .attr("ry", 0.4 * rowHeight)
            .attr("x", 3 * (columnWidth - rowHeight) / 4)
            .attr("y", d => (d.index + 0.1) * rowHeight + margin.top / 3)
            .attr("fill", "#344f1a")
            .attr("opacity", d => d.includeInTemporal ? 1 : 0);

        cell.merge(cellEnter)
            .transition()
            .duration(500)
            .attr("y", d => (d.index + 0.1) * rowHeight + margin.top / 3)
            .attr("opacity", d => d.includeInTemporal ? 1 : 0);
        
        cell.exit().remove();
    };

    renderVisualization();
};

const setupHierarchicalVisualization = () => {
    const containerWidth = document.getElementById("hierarchical-visualization").clientWidth;
    const containerHeight = document.getElementById("hierarchical-visualization").clientHeight;

    const margin = {
        top: 0.1 * containerHeight,
        right: 0 * containerWidth,
        bottom: 0.18 * containerHeight,
        left: 0.07 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const xScale = d3.scaleBand();
    const yScale = d3.scaleBand();

    const svg = d3.select("#hierarchical-visualization");

    svg.append('defs')
        .append('clipPath')
        .attr('id', 'chart-mask')
        .append('rect')
        .attr('width', width)
        .attr('y', -margin.top)
        .attr('height', containerHeight);

    const chartArea = svg.append('g')
        .attr("clip-path", "url(#chart-mask)")
        .attr('transform', `translate(0,${margin.top})`);
};

const renderVisualization = () => {
    setupTemporalVisualization();
    setupHierarchicalVisualization();
};

Promise.all([d3.json('data/vegetable-types.json'), d3.csv('data/weekly-selection.csv')]).then(([vegetableTypesData, weeklySelectionData]) => {
    vegetableTypes = vegetableTypesData;
    vegetableTypes.forEach(vegetableType => {
        if (!("isSubType" in vegetableType)) {
            vegetableType.isSubType = false;
            vegetableType.includeInTemporal = true;
        }

        if ("subtypes" in vegetableType) {
            vegetableType.includeSubTypes = false;
            vegetableTypes.forEach(subVegetableType => {
                if (vegetableType.subtypes.includes(subVegetableType.name)) {
                    subVegetableType.isSubType = true;
                    subVegetableType.superType = vegetableType.name;
                    subVegetableType.includeInTemporal = false;
                }
            });
        }
    });
    
    weeklySelection = [];
    weeklySelectionData.forEach((week, i) => {
        const cleanedWeek = {};
        cleanedWeek.season = +week.season;
        cleanedWeek.week = +week.week;
        cleanedWeek.date = new Date(week.date);

        vegetableTypes.forEach(vegetable => {
            if ("list" in vegetable) {
                let hasVegetable = false;
                vegetable.list.forEach(vegetableAlternative => {
                    if (week[vegetableAlternative].trim().toLowerCase() === "x") {
                        hasVegetable = true;
                    }
                });
                cleanedWeek[vegetable.name] = hasVegetable;
            } else if ("subtypes" in vegetable) {
                cleanedWeek[vegetable.name] = false;
            } else {
                cleanedWeek[vegetable.name] = week[vegetable.name].trim().toLowerCase() === "x";
            }

            if ("superType" in vegetable && cleanedWeek[vegetable.name]) {
                cleanedWeek[vegetable.superType] = true;
            }
        });
        weeklySelection.push(cleanedWeek);
    });

    resizeAndRender();
});