import "material-dashboard/assets/css/material-dashboard.min.css";
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
          borderColor: "#57595B",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      animation: {
        duration: 1500,
        easing: "easeInOutQuart",
        delay: (context) => context.dataIndex * 100,
      },
      plugins: {
        title: {
          display: true,
          text: "Temps moyen de résolution par solveur",
          color: "#452829",
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
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 2000,
        easing: "easeInOutQuart",
      },
      plugins: {
        title: {
          display: true,
          text: "Répartition des résultats",
          color: "#452829",
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
      maintainAspectRatio: false,
      indexAxis: "y",
      animation: {
        duration: 1800,
        easing: "easeInOutCubic",
        delay: (context) => context.dataIndex * 80,
      },
      plugins: {
        title: {
          display: true,
          text: "Taux de résolution par solveur (%)",
          color: "#452829",
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
    .attr("r", 0) // Start with radius 0
    .attr("fill", (d) => colorScale(d.name))
    .attr("opacity", 0) // Start invisible
    .transition() // Add animation
    .duration(1500)
    .delay((d, i) => i * 3) // Stagger animation
    .ease(d3.easeCubicOut)
    .attr("r", 4) // Animate to final radius
    .attr("opacity", 0.7) // Animate to final opacity
    .selection() // Return to selection for event handlers
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("r", 6)
        .attr("opacity", 1);

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
    .on("mouseout", (event) => {
      d3.select(event.currentTarget)
        .transition()
        .duration(200)
        .attr("r", 4)
        .attr("opacity", 0.7);

      tooltip.style("display", "none");
    });

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
  const colors = ["#452829", "#57595B", "#E8D1C5", "#d4b5a4"];

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
      animation: {
        duration: 2000,
        easing: "easeInOutQuart",
      },
      plugins: {
        title: {
          display: true,
          text: "Performance par famille de problèmes",
          color: "#452829",
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
    .attr("fill", (d) => (d.value !== null ? colorScale(d.value) : "#eee"))
    .attr("opacity", 0) // Start invisible
    .transition() // Add animation
    .duration(1000)
    .delay((d, i) => i * 10) // Stagger animation
    .ease(d3.easeQuadOut)
    .attr("opacity", 1) // Fade in
    .selection() // Return to selection for event handlers
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.8)
        .attr("stroke", "#452829")
        .attr("stroke-width", 2);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 1)
        .attr("stroke", "none");
    });
}

// Initialisation
function init() {
  const data = getValidResults();
  const totalResults = data.length;
  const statusCounts = getStatusCounts(data);

  document.querySelector("#app").innerHTML = `
    <div class="wrapper">
      <aside class="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-3 bg-gradient-dark" id="sidenav-main">
        <div class="sidenav-header">
          <a class="navbar-brand m-0" href="#">
            <span class="ms-1 font-weight-bold text-white">SAE303 Dashboard</span>
          </a>
        </div>
        <hr class="horizontal light mt-0 mb-2">
        <div class="collapse navbar-collapse w-auto show" id="sidenav-collapse-main">
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link text-white active bg-gradient-primary" href="#" data-tab="overview">
                <div class="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i class="material-icons opacity-10">dashboard</i>
                </div>
                <span class="nav-link-text ms-1">Vue d'ensemble</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white" href="#" data-tab="performance">
                <div class="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i class="material-icons opacity-10">speed</i>
                </div>
                <span class="nav-link-text ms-1">Performance</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white" href="#" data-tab="analysis">
                <div class="text-white text-center me-2 d-flex align-items-center justify-content-center">
                  <i class="material-icons opacity-10">analytics</i>
                </div>
                <span class="nav-link-text ms-1">Analyse avancée</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
      
      <main class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
        <nav class="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl" id="navbarBlur">
          <div class="container-fluid py-1 px-3">
            <nav aria-label="breadcrumb">
              <h6 class="font-weight-bolder mb-0" id="page-title">Vue d'ensemble - Visualisation des Solveurs CSP</h6>
            </nav>
          </div>
        </nav>
        
        <div class="container-fluid py-4">
          <!-- Vue d'ensemble -->
          <div class="tab-content" id="overview-tab">
            <div class="row">
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-3 pt-2">
                    <div class="icon icon-lg icon-shape bg-gradient-dark shadow-dark text-center border-radius-xl mt-n4 position-absolute">
                      <i class="material-icons opacity-10">assessment</i>
                    </div>
                    <div class="text-end pt-1">
                      <p class="text-sm mb-0 text-capitalize">Total Résultats</p>
                      <h4 class="mb-0">${totalResults}</h4>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-3">
                    <p class="mb-0"><span class="text-success text-sm font-weight-bolder">Compétition CSP 2022</span></p>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-3 pt-2">
                    <div class="icon icon-lg icon-shape bg-gradient-success shadow-success text-center border-radius-xl mt-n4 position-absolute">
                      <i class="material-icons opacity-10">check_circle</i>
                    </div>
                    <div class="text-end pt-1">
                      <p class="text-sm mb-0 text-capitalize">SAT</p>
                      <h4 class="mb-0">${statusCounts.SAT}</h4>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-3">
                    <p class="mb-0"><span class="text-success text-sm font-weight-bolder">${(
                      (statusCounts.SAT / totalResults) *
                      100
                    ).toFixed(1)}%</span> du total</p>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                <div class="card">
                  <div class="card-header p-3 pt-2">
                    <div class="icon icon-lg icon-shape bg-gradient-danger shadow-danger text-center border-radius-xl mt-n4 position-absolute">
                      <i class="material-icons opacity-10">cancel</i>
                    </div>
                    <div class="text-end pt-1">
                      <p class="text-sm mb-0 text-capitalize">UNSAT</p>
                      <h4 class="mb-0">${statusCounts.UNSAT}</h4>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-3">
                    <p class="mb-0"><span class="text-danger text-sm font-weight-bolder">${(
                      (statusCounts.UNSAT / totalResults) *
                      100
                    ).toFixed(1)}%</span> du total</p>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-sm-6">
                <div class="card">
                  <div class="card-header p-3 pt-2">
                    <div class="icon icon-lg icon-shape bg-gradient-warning shadow-warning text-center border-radius-xl mt-n4 position-absolute">
                      <i class="material-icons opacity-10">help</i>
                    </div>
                    <div class="text-end pt-1">
                      <p class="text-sm mb-0 text-capitalize">UNKNOWN</p>
                      <h4 class="mb-0">${statusCounts.UNKNOWN}</h4>
                    </div>
                  </div>
                  <hr class="dark horizontal my-0">
                  <div class="card-footer p-3">
                    <p class="mb-0"><span class="text-warning text-sm font-weight-bolder">${(
                      (statusCounts.UNKNOWN / totalResults) *
                      100
                    ).toFixed(1)}%</span> du total</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row mt-4">
              <div class="col-lg-6 col-md-6 mb-md-0 mb-4">
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>Répartition des résultats</h6>
                    <p class="text-sm">Distribution globale des statuts SAT, UNSAT et UNKNOWN</p>
                  </div>
                  <div class="card-body px-0 pb-2">
                    <canvas id="statusDistributionChart"></canvas>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-6 col-md-6">
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>Taux de résolution par solveur</h6>
                    <p class="text-sm">Pourcentage de succès de chaque solveur</p>
                  </div>
                  <div class="card-body px-0 pb-2">
                    <canvas id="solverSuccessRateChart"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Performance -->
          <div class="tab-content" id="performance-tab" style="display: none;">
            <div class="row">
              <div class="col-12 mb-4">
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>Temps moyen de résolution par solveur</h6>
                    <p class="text-sm">Comparaison des performances temporelles de chaque solveur</p>
                  </div>
                  <div class="card-body px-0 pb-2">
                    <canvas id="solverPerformanceChart"></canvas>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-12">
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>Performance par famille de problèmes</h6>
                    <p class="text-sm">Analyse comparative des solveurs sur différentes familles</p>
                  </div>
                  <div class="card-body px-0 pb-2">
                    <canvas id="familyRadarChart"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Analyse avancée -->
          <div class="tab-content" id="analysis-tab" style="display: none;">
            <div class="row">
              <div class="col-12 mb-4">
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>Complexité vs Temps de résolution</h6>
                    <p class="text-sm">Relation entre le nombre de variables et le temps d'exécution</p>
                  </div>
                  <div class="card-body px-0 pb-2">
                    <div id="complexityTimeChart"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-12">
                <div class="card">
                  <div class="card-header pb-0">
                    <h6>Heatmap Solveur × Famille</h6>
                    <p class="text-sm">Matrice de performance croisée solveurs/familles</p>
                  </div>
                  <div class="card-body px-0 pb-2">
                    <div id="solverFamilyHeatmap"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Gestion des onglets
  const navLinks = document.querySelectorAll(".nav-link[data-tab]");
  const pageTitle = document.getElementById("page-title");

  const tabTitles = {
    overview: "Vue d'ensemble - Visualisation des Solveurs CSP",
    performance: "Performance - Analyse temporelle des solveurs",
    analysis: "Analyse avancée - Visualisations complexes",
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute("data-tab");

      // Mise à jour des liens actifs
      navLinks.forEach((l) =>
        l.classList.remove("active", "bg-gradient-primary")
      );
      link.classList.add("active", "bg-gradient-primary");

      // Affichage du bon contenu
      document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.style.display = "none";
      });
      document.getElementById(`${targetTab}-tab`).style.display = "block";

      // Mise à jour du titre
      pageTitle.textContent = tabTitles[targetTab];

      // Re-render des graphiques si nécessaire (pour D3)
      if (targetTab === "analysis") {
        setTimeout(() => {
          const complexityChart = document.getElementById(
            "complexityTimeChart"
          );
          const heatmapChart = document.getElementById("solverFamilyHeatmap");
          // Check if SVG already exists to avoid re-rendering if not needed
          if (complexityChart && !complexityChart.querySelector("svg")) {
            createComplexityTimeChart(data);
          }
          if (heatmapChart && !heatmapChart.querySelector("svg")) {
            createSolverFamilyHeatmap(data);
          }
        }, 100);
      }
    });
  });

  // Initialisation des graphiques de la vue d'ensemble
  // Delay to ensure DOM is ready
  setTimeout(() => {
    createStatusDistributionChart(data);
    createSolverSuccessRateChart(data);
  }, 100);

  // Pré-chargement des autres graphiques
  createSolverPerformanceChart(data);
  createFamilyRadarChart(data);

  // Store chart instances for re-animation
  window.chartInstances = {
    statusDistribution: null,
    solverSuccessRate: null,
  };
}

init();
