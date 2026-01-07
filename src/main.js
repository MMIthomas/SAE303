import "./css/variables.css";
import "./css/reset.css";
import "./css/style.css";
import { Chart, registerables } from "chart.js";
import * as d3 from "d3";
import resultsData from "./data/results.json";

Chart.register(...registerables);

// Filtrer les données valides
function getValidResults() {
  const tableObject = resultsData.find((d) => d.type === "table");
  return tableObject ? tableObject.data : [];
}

// Calcul du temps moyen par solveur
function getAverageTimeBySolver(data) {
  const solverTimes = {};
  const solverCounts = {};

  data.forEach((d) => {
    const solver = d.name;
    const time = parseFloat(d.time);
    if (time < 10000) {
      solverTimes[solver] = (solverTimes[solver] || 0) + time;
      solverCounts[solver] = (solverCounts[solver] || 0) + 1;
    }
  });

  return Object.keys(solverTimes).map((solver) => ({
    solver,
    avgTime: solverTimes[solver] / solverCounts[solver],
  }));
}

// Comptage des statuts
function getStatusCounts(data) {
  const counts = { SAT: 0, UNSAT: 0, UNKNOWN: 0 };
  data.forEach((d) => {
    if (counts.hasOwnProperty(d.status)) {
      counts[d.status]++;
    }
  });
  return counts;
}

// Taux de succès par solveur
function getSuccessRateBySolver(data) {
  const solverStats = {};

  data.forEach((d) => {
    const solver = d.name;
    if (!solverStats[solver]) {
      solverStats[solver] = { SAT: 0, UNSAT: 0, UNKNOWN: 0, total: 0 };
    }
    solverStats[solver][d.status]++;
    solverStats[solver].total++;
  });

  return Object.keys(solverStats).map((solver) => ({
    solver,
    sat: (solverStats[solver].SAT / solverStats[solver].total) * 100,
    unsat: (solverStats[solver].UNSAT / solverStats[solver].total) * 100,
    unknown: (solverStats[solver].UNKNOWN / solverStats[solver].total) * 100,
  }));
}

// Performance par solveur (Bar Chart)
function createSolverPerformanceChart(data) {
  const avgTimes = getAverageTimeBySolver(data).sort(
    (a, b) => a.avgTime - b.avgTime
  );
  const ctx = document
    .getElementById("solverPerformanceChart")
    .getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: avgTimes.map((d) => d.solver),
      datasets: [
        {
          label: "Temps moyen (s)",
          data: avgTimes.map((d) => d.avgTime),
          backgroundColor: "#452829",
          borderColor: "#452829",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Temps moyen de résolution par solveur",
          color: "#020202",
        },
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Temps (secondes)" },
        },
      },
    },
  });
}

// Répartition des statuts (Doughnut)
function createStatusDistributionChart(data) {
  const counts = getStatusCounts(data);
  const ctx = document
    .getElementById("statusDistributionChart")
    .getContext("2d");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["SAT", "UNSAT", "UNKNOWN"],
      datasets: [
        {
          data: [counts.SAT, counts.UNSAT, counts.UNKNOWN],
          backgroundColor: ["#4CAF50", "#F44336", "#9E9E9E"],
          borderWidth: 2,
          borderColor: "#F3E8DF",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Répartition des résultats",
          color: "#020202",
        },
        legend: { position: "bottom" },
      },
    },
  });
}

// Taux de succès par solveur (Stacked Bar)
function createSolverSuccessRateChart(data) {
  const rates = getSuccessRateBySolver(data);
  const ctx = document
    .getElementById("solverSuccessRateChart")
    .getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: rates.map((d) => d.solver),
      datasets: [
        {
          label: "SAT",
          data: rates.map((d) => d.sat),
          backgroundColor: "#4CAF50",
        },
        {
          label: "UNSAT",
          data: rates.map((d) => d.unsat),
          backgroundColor: "#F44336",
        },
        {
          label: "UNKNOWN",
          data: rates.map((d) => d.unknown),
          backgroundColor: "#9E9E9E",
        },
      ],
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: {
        title: {
          display: true,
          text: "Taux de résolution par solveur (%)",
          color: "#020202",
        },
        legend: { position: "bottom" },
      },
      scales: {
        x: { stacked: true, max: 100 },
        y: { stacked: true },
      },
    },
  });
}

// Complexité vs Temps (D3.js Scatter Plot)
function createComplexityTimeChart(data) {
  const container = d3.select("#complexityTimeChart");
  const width = container.node().getBoundingClientRect().width;
  const height = 400;
  const margin = { top: 40, right: 120, bottom: 60, left: 70 };

  const filteredData = data
    .filter((d) => parseFloat(d.time) < 10000 && parseFloat(d.nb_variables) > 0)
    .slice(0, 500);

  const solvers = [...new Set(filteredData.map((d) => d.name))];
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(solvers);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3
    .scaleLog()
    .domain([1, d3.max(filteredData, (d) => parseFloat(d.nb_variables))])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLog()
    .domain([0.1, d3.max(filteredData, (d) => parseFloat(d.time) || 0.1)])
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(5, "~s"));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(5, "~s"));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Complexité vs Temps de résolution");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .text("Nombre de variables");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Temps (s)");

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("display", "none");

  svg
    .selectAll("circle")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(parseFloat(d.nb_variables)))
    .attr("cy", (d) => yScale(parseFloat(d.time) || 0.1))
    .attr("r", 4)
    .attr("fill", (d) => colorScale(d.name))
    .attr("opacity", 0.7)
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.name}</strong><br>Famille: ${d.family}<br>Variables: ${d.nb_variables}<br>Temps: ${d.time}s`
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  const legend = svg
    .append("g")
    .attr(
      "transform",
      `translate(${width - margin.right + 10}, ${margin.top})`
    );

  solvers.forEach((solver, i) => {
    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", i * 18)
      .attr("r", 5)
      .attr("fill", colorScale(solver));
    legend
      .append("text")
      .attr("x", 10)
      .attr("y", i * 18 + 4)
      .text(solver)
      .style("font-size", "10px");
  });
}

// Radar Chart par famille
function createFamilyRadarChart(data) {
  const families = [...new Set(data.map((d) => d.family))].slice(0, 6);
  const topSolvers = ["Picat", "CoSoCo", "Choco", "ACE"];

  const solverFamilyAvg = {};
  topSolvers.forEach((solver) => {
    solverFamilyAvg[solver] = {};
    families.forEach((family) => {
      const filtered = data.filter(
        (d) =>
          d.name === solver && d.family === family && parseFloat(d.time) < 10000
      );
      const avgTime =
        filtered.length > 0
          ? filtered.reduce((sum, d) => sum + parseFloat(d.time), 0) /
            filtered.length
          : 10000;
      solverFamilyAvg[solver][family] = 100 - avgTime / 100;
    });
  });

  const ctx = document.getElementById("familyRadarChart").getContext("2d");
  const colors = ["#452829", "#57595B", "#E8D1C5", "#4CAF50"];

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: families,
      datasets: topSolvers.map((solver, i) => ({
        label: solver,
        data: families.map((f) => Math.max(0, solverFamilyAvg[solver][f])),
        borderColor: colors[i],
        backgroundColor: `${colors[i]}33`,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Performance par famille de problèmes",
          color: "#020202",
        },
        legend: { position: "bottom" },
      },
      scales: {
        r: { beginAtZero: true, max: 100 },
      },
    },
  });
}

// Heatmap Solveur vs Famille (D3.js)
function createSolverFamilyHeatmap(data) {
  const container = d3.select("#solverFamilyHeatmap");
  const width = container.node().getBoundingClientRect().width;
  const height = 400;
  const margin = { top: 50, right: 30, bottom: 100, left: 100 };

  const solvers = [...new Set(data.map((d) => d.name))];
  const families = [...new Set(data.map((d) => d.family))].slice(0, 8);

  const heatmapData = [];
  solvers.forEach((solver) => {
    families.forEach((family) => {
      const filtered = data.filter(
        (d) =>
          d.name === solver && d.family === family && parseFloat(d.time) < 10000
      );
      const avgTime =
        filtered.length > 0
          ? filtered.reduce((sum, d) => sum + parseFloat(d.time), 0) /
            filtered.length
          : null;
      heatmapData.push({ solver, family, value: avgTime });
    });
  });

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3
    .scaleBand()
    .domain(families)
    .range([margin.left, width - margin.right])
    .padding(0.05);
  const yScale = d3
    .scaleBand()
    .domain(solvers)
    .range([margin.top, height - margin.bottom])
    .padding(0.05);
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1000]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Temps moyen par Solveur et Famille");

  svg
    .selectAll("rect")
    .data(heatmapData)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.family))
    .attr("y", (d) => yScale(d.solver))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => (d.value !== null ? colorScale(d.value) : "#eee"));
}

// Initialisation
function init() {
  const data = getValidResults();

  document.querySelector("#app").innerHTML = `
    <div class="dashboard">
      <h1>SAE303 - Visualisation des Solveurs CSP</h1>
      
      <div class="charts-grid">
        <div class="chart-container">
          <canvas id="solverPerformanceChart"></canvas>
        </div>
        
        <div class="chart-container">
          <canvas id="statusDistributionChart"></canvas>
        </div>
        
        <div class="chart-container wide">
          <canvas id="solverSuccessRateChart"></canvas>
        </div>
        
        <div class="chart-container wide" id="complexityTimeChart"></div>
        
        <div class="chart-container">
          <canvas id="familyRadarChart"></canvas>
        </div>
        
        <div class="chart-container wide" id="solverFamilyHeatmap"></div>
      </div>
    </div>
  `;

  createSolverPerformanceChart(data);
  createStatusDistributionChart(data);
  createSolverSuccessRateChart(data);
  createComplexityTimeChart(data);
  createFamilyRadarChart(data);
  createSolverFamilyHeatmap(data);
}

init();
