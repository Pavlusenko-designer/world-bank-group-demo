const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".section-reveal").forEach((section) => {
  if (!prefersReducedMotion) {
    sectionObserver.observe(section);
  } else {
    section.classList.add("in-view");
  }
});

const countUpElements = document.querySelectorAll(".metric-value[data-count]");
const animateCountUp = (el) => {
  const finalValue = Number(el.dataset.count);
  const hasPercentagePoint = el.textContent.includes("pp");
  const duration = 1000;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(finalValue * eased);
    el.textContent = hasPercentagePoint ? `${current}pp` : `${current}%`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const metricsObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".metric-value[data-count]").forEach(animateCountUp);
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.45 }
);

const metricsSection = document.querySelector(".metric-grid");
if (metricsSection) metricsObserver.observe(metricsSection);

const setActiveSectorCard = (targetCard) => {
  document.querySelectorAll(".sector-card").forEach((card) => {
    card.classList.toggle("is-active", card === targetCard);
  });
};

document.querySelectorAll(".sector-card").forEach((card) => {
  const sectorVideo = card.querySelector(".sector-video");
  card.addEventListener("click", () => setActiveSectorCard(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveSectorCard(card);
    }
  });

  if (!prefersReducedMotion) {
    const playSectorVideo = () => {
      if (!sectorVideo) return;
      sectorVideo.currentTime = 0;
      sectorVideo.play().catch(() => {});
    };
    const pauseSectorVideo = () => {
      if (!sectorVideo) return;
      sectorVideo.pause();
    };

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 6;
      const rotateX = (0.5 - y) * 6;
      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      pauseSectorVideo();
    });
    card.addEventListener("mouseenter", playSectorVideo);
    card.addEventListener("focusin", playSectorVideo);
    card.addEventListener("focusout", pauseSectorVideo);
  }
});

const progressBar = document.getElementById("scrollProgressBar");
const parallaxTargets = document.querySelectorAll("[data-parallax]");
const crossThemesSection = document.querySelector(".cross-themes");
const mountainArea = document.querySelector(".theme-mountain-area");
const mountainLines = Array.from(document.querySelectorAll(".theme-mountain-line"));
const mountainArrow = document.querySelector(".theme-mountain-arrow");
const mountainLineLengths = mountainLines.map((line) => {
  const len = line.getTotalLength();
  line.style.strokeDasharray = `${len}`;
  line.style.strokeDashoffset = `${len}`;
  return len;
});

const updateCrossThemeMountain = () => {
  if (!crossThemesSection || mountainLines.length === 0 || prefersReducedMotion) return;
  const rect = crossThemesSection.getBoundingClientRect();
  const vh = window.innerHeight;
  const raw = (vh * 0.88 - rect.top) / (rect.height + vh * 0.25);
  const progress = Math.max(0, Math.min(raw, 1));

  mountainLines.forEach((line, i) => {
    const factor = Math.max(0, Math.min(progress * (1 + i * 0.18), 1));
    line.style.strokeDashoffset = `${mountainLineLengths[i] * (1 - factor)}`;
    line.style.opacity = (0.15 + factor * 0.75).toFixed(2);
  });

  if (mountainArrow && mountainLines[0] && mountainLineLengths[0] > 0) {
    const firstFactor = Math.max(0, Math.min(progress, 1));
    const firstLine = mountainLines[0];
    const firstLength = mountainLineLengths[0];
    const tipLength = Math.max(0.01, firstLength * firstFactor);
    const prevLength = Math.max(0, tipLength - 8);
    const tip = firstLine.getPointAtLength(tipLength);
    const prev = firstLine.getPointAtLength(prevLength);
    const angle = (Math.atan2(tip.y - prev.y, tip.x - prev.x) * 180) / Math.PI;

    mountainArrow.setAttribute(
      "transform",
      `translate(${tip.x.toFixed(2)} ${tip.y.toFixed(2)}) rotate(${angle.toFixed(2)})`
    );
    mountainArrow.style.opacity = firstFactor > 0.02 ? (0.16 + firstFactor * 0.8).toFixed(2) : "0";
  }

  if (mountainArea) {
    const yScale = 0.34 + progress * 0.66;
    mountainArea.style.transform = `scaleY(${yScale.toFixed(3)})`;
    mountainArea.style.opacity = (0.12 + progress * 0.28).toFixed(2);
  }
};

const handleScrollEffects = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(progress, 100)}%`;

  if (!prefersReducedMotion) {
    parallaxTargets.forEach((el) => {
      const speed = el.dataset.parallax === "fast" ? 0.12 : 0.06;
      const offset = Math.max(-18, Math.min(window.scrollY * speed, 42));
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    const heroMedia = document.querySelector(".hero-media-wrap");
    if (heroMedia) {
      const mediaOffset = Math.min(window.scrollY * 0.16, 90);
      heroMedia.style.transform = `translate3d(0, ${mediaOffset}px, 0)`;
    }
  }

  updateCrossThemeMountain();
};

window.addEventListener("scroll", handleScrollEffects, { passive: true });
window.addEventListener("resize", handleScrollEffects);
handleScrollEffects();

const gccDotMap = document.getElementById("gccDotMap");
if (gccDotMap) {
  const gccPattern = [
    "..........ssssssssss........................",
    "........ssssssssssssss......................",
    "......sssssssssssssssssss...kkk.............",
    ".....sssssssssssssssssssss..kkkk............",
    "....ssssssssssssssssssssssss.kkk............",
    "...ssssssssssssssssssssssssssss.............",
    "..ssssssssssssssssssssssssssssss....b.......",
    "..ssssssssssssssssssssssssssssss..bbb.......",
    "..ssssssssssssssssssssssssssssss...q........",
    "...sssssssssssssssssssssssssssss..qqq.......",
    "....ssssssssssssssssssssssssssssuuuuu.......",
    ".....ssssssssssssssssssssssssssuuuuuuu......",
    "......ssssssssssssssssssssssssuuuuuuuuu.....",
    ".......ssssssssssssssssssssssuuuuuuuuuuu....",
    "........sssssssssssssssssssssoooooouuuuu....",
    ".........sssssssssssssssssssoooooooouuuu....",
    "..........sssssssssssssssssoooooooooouu.....",
    "...........sssssssssssssssoooooooooooo......",
    "............ssssssssssssssooooooooooo.......",
    "..............ssssssssssssooooooo...........",
    "..................sss.....oooo..............",
  ];

  const colorClassMap = {
    s: "country-s",
    u: "country-u",
    o: "country-o",
    k: "country-k",
    q: "country-q",
    b: "country-b",
  };

  gccPattern.forEach((row) => {
    row.split("").forEach((char) => {
      const dot = document.createElement("span");
      if (colorClassMap[char]) {
        dot.className = `gcc-dot ${colorClassMap[char]}`;
      } else {
        dot.className = "gcc-dot-empty";
      }
      gccDotMap.appendChild(dot);
    });
  });

  const dots = Array.from(gccDotMap.querySelectorAll(".gcc-dot"));
  let dotCenters = [];
  let lastPointerX = 0;
  let lastPointerY = 0;
  let frameRequest = null;
  const influenceRadius = 150;

  const cacheDotCenters = () => {
    dotCenters = dots.map((dot) => {
      const rect = dot.getBoundingClientRect();
      return { dot, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
  };

  const renderDotResponse = (pointerX, pointerY) => {
    dotCenters.forEach((entry) => {
      const distance = Math.hypot(entry.x - pointerX, entry.y - pointerY);
      const normalized = Math.max(0, 1 - distance / influenceRadius);
      const scale = 1 + normalized * 0.5;
      entry.dot.style.transform = `scale(${Math.min(scale, 1.5).toFixed(3)})`;
      entry.dot.style.opacity = (0.62 + normalized * 0.38).toFixed(2);
      entry.dot.style.filter = `saturate(${(1 + normalized * 0.8).toFixed(2)})`;
    });
  };

  const updateDotInteraction = (pointerX, pointerY) => {
    lastPointerX = pointerX;
    lastPointerY = pointerY;
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = requestAnimationFrame(() => {
      renderDotResponse(lastPointerX, lastPointerY);
    });
  };

  const resetDotInteraction = () => {
    dots.forEach((dot) => {
      dot.style.transform = "scale(1)";
      dot.style.opacity = "0.9";
      dot.style.filter = "saturate(1)";
    });
  };

  cacheDotCenters();
  resetDotInteraction();
  window.addEventListener("resize", cacheDotCenters);

  if (!prefersReducedMotion) {
    gccDotMap.addEventListener("mousemove", (event) => {
      updateDotInteraction(event.clientX, event.clientY);
    });
    gccDotMap.addEventListener("mouseleave", resetDotInteraction);
  }
}

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: prefersReducedMotion ? false : { duration: 650, easing: "easeOutCubic" },
  interaction: { mode: "nearest", intersect: false },
  layout: { padding: { left: 6, right: 10, top: 8, bottom: 4 } },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#2e4c3d",
        font: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
        boxWidth: 14,
        boxHeight: 14,
      },
    },
    tooltip: {
      backgroundColor: "rgba(17, 32, 24, 0.95)",
      titleFont: { family: "Manrope", weight: "700" },
      bodyFont: { family: "Plus Jakarta Sans" },
      padding: 13,
      displayColors: false,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      ticks: {
        color: "#3f5e50",
        font: { family: "Plus Jakarta Sans", weight: "600" },
        maxRotation: 0,
      },
      grid: { display: false },
      border: { color: "rgba(79, 97, 87, 0.18)" },
    },
    y: {
      ticks: {
        color: "#3f5e50",
        font: { family: "Plus Jakarta Sans", weight: "600" },
      },
      grid: { color: "rgba(79, 97, 87, 0.12)" },
      border: { color: "rgba(79, 97, 87, 0.18)" },
      beginAtZero: true,
      max: 100,
    },
  },
};

Chart.defaults.font.family = "Plus Jakarta Sans";
Chart.defaults.color = "#365345";

const luxuryGlowPlugin = {
  id: "luxuryGlow",
  beforeDatasetDraw(chart) {
    const type = chart.config.type;
    if (!["line", "radar"].includes(type)) return;
    const { ctx } = chart;
    ctx.save();
    ctx.shadowColor = "rgba(15, 138, 106, 0.22)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
  },
  afterDatasetDraw(chart) {
    const type = chart.config.type;
    if (!["line", "radar"].includes(type)) return;
    chart.ctx.restore();
  },
};
Chart.register(luxuryGlowPlugin);

const verticalGradient = (chart, start, end) => {
  const { ctx, chartArea } = chart;
  if (!chartArea) return start;
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  return gradient;
};

const regionalScenarios = {
  current: {
    "Capital Belt": { investment: 88, efficiency: 74, adoption: 63, note: "Strong asset expansion with medium interoperability." },
    "North Corridor": { investment: 72, efficiency: 51, adoption: 39, note: "Investment is high but digital coordination is weak." },
    "Eastern Ports": { investment: 79, efficiency: 58, adoption: 42, note: "Port capacity grew, yet clearance systems remain fragmented." },
    "Southern Growth Zone": { investment: 66, efficiency: 48, adoption: 37, note: "Secondary region with clear operational friction bottlenecks." },
  },
  integration: {
    "Capital Belt": { investment: 88, efficiency: 81, adoption: 71, note: "Integration gains lift utilization across the logistics chain." },
    "North Corridor": { investment: 72, efficiency: 64, adoption: 55, note: "Shared data standards reduce friction and improve reliability." },
    "Eastern Ports": { investment: 79, efficiency: 69, adoption: 57, note: "Interoperable customs flows shorten cycle times." },
    "Southern Growth Zone": { investment: 66, efficiency: 61, adoption: 52, note: "Digital onboarding expands market access for SMEs." },
  },
  fragmented: {
    "Capital Belt": { investment: 88, efficiency: 67, adoption: 51, note: "Asset performance decays without full system coordination." },
    "North Corridor": { investment: 72, efficiency: 44, adoption: 31, note: "Fragmentation increases delays and integration costs." },
    "Eastern Ports": { investment: 79, efficiency: 49, adoption: 34, note: "Capacity exists but process continuity weakens outcomes." },
    "Southern Growth Zone": { investment: 66, efficiency: 40, adoption: 27, note: "Regional disparity widens as digital interoperability stalls." },
  },
};
let currentScenario = "current";

const investmentCtx = document.getElementById("investmentImpactChart");
const detailCtx = document.getElementById("regionalDetailChart");
const drilldownTitle = document.getElementById("drilldownTitle");
const drilldownNote = document.getElementById("drilldownNote");
const resetDrilldownBtn = document.getElementById("resetRegionalDrilldown");
const scenarioButtons = document.querySelectorAll("[data-scenario]");
const investmentPanel = document.querySelector(".story-chart-grid-wide .chart-panel");
let investmentBarFocusIndex = null;
let investmentScrollHoverIndex = -1;

const getCurrentRegionalData = () => regionalScenarios[currentScenario];
const getRegionLabels = () => Object.keys(getCurrentRegionalData());
const getRegionValues = () => Object.values(getCurrentRegionalData());

const investmentImpactChart = new Chart(investmentCtx, {
  type: "bar",
  data: {
    labels: getRegionLabels(),
    datasets: [
      {
        label: "Investment Index",
        data: getRegionValues().map((v) => v.investment),
        backgroundColor: (context) => {
          const i = context.dataIndex;
          const isActive = investmentBarFocusIndex === null || investmentBarFocusIndex === i;
          return isActive
            ? verticalGradient(context.chart, "rgba(15, 138, 106, 0.6)", "rgba(15, 138, 106, 0.96)")
            : verticalGradient(context.chart, "rgba(15, 138, 106, 0.22)", "rgba(15, 138, 106, 0.42)");
        },
        borderColor: (context) => (investmentBarFocusIndex === null || investmentBarFocusIndex === context.dataIndex ? "rgba(15, 138, 106, 0.98)" : "rgba(15, 138, 106, 0.35)"),
        borderWidth: (context) => (investmentBarFocusIndex === null || investmentBarFocusIndex === context.dataIndex ? 1.2 : 1),
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 38,
      },
      {
        label: "Efficiency Index",
        data: getRegionValues().map((v) => v.efficiency),
        backgroundColor: (context) => {
          const i = context.dataIndex;
          const isActive = investmentBarFocusIndex === null || investmentBarFocusIndex === i;
          return isActive
            ? verticalGradient(context.chart, "rgba(194, 154, 84, 0.58)", "rgba(194, 154, 84, 0.94)")
            : verticalGradient(context.chart, "rgba(194, 154, 84, 0.2)", "rgba(194, 154, 84, 0.42)");
        },
        borderColor: (context) => (investmentBarFocusIndex === null || investmentBarFocusIndex === context.dataIndex ? "rgba(194, 154, 84, 0.95)" : "rgba(194, 154, 84, 0.36)"),
        borderWidth: (context) => (investmentBarFocusIndex === null || investmentBarFocusIndex === context.dataIndex ? 1.2 : 1),
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 38,
      },
    ],
  },
  options: {
    ...chartBaseOptions,
    onClick: (_, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;
      const region = investmentImpactChart.data.labels[index];
      updateRegionalDrilldown(region);
    },
    onHover: (event, activeElements) => {
      event.native.target.style.cursor = activeElements.length ? "pointer" : "crosshair";
    },
  },
});

const regionalDetailChart = new Chart(detailCtx, {
  type: "radar",
  data: {
    labels: ["Physical Capacity", "Interoperability", "Digital Adoption", "Logistics Reliability", "SME Access"],
    datasets: [
      {
        label: "Regional Profile",
        data: [58, 40, 35, 43, 31],
        fill: true,
        backgroundColor: "rgba(15, 138, 106, 0.24)",
        borderColor: "rgba(15, 138, 106, 0.95)",
        borderWidth: 2.6,
        pointRadius: 4.2,
        pointHoverRadius: 7,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointBackgroundColor: "rgba(15, 138, 106, 1)",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion ? false : { duration: 600, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17, 32, 24, 0.95)",
      },
    },
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 100,
        pointLabels: {
          color: "#2e4b3d",
          font: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
        },
        grid: { color: "rgba(79, 97, 87, 0.2)" },
        angleLines: { color: "rgba(79, 97, 87, 0.22)" },
        ticks: { display: false },
      },
    },
  },
});

function updateRegionalDrilldown(region) {
  const profileMap = {
    "Capital Belt": [82, 63, 61, 71, 58],
    "North Corridor": [69, 39, 34, 46, 32],
    "Eastern Ports": [76, 44, 41, 52, 38],
    "Southern Growth Zone": [62, 35, 33, 41, 29],
  };

  const selected = getCurrentRegionalData()[region];
  const profile = profileMap[region];
  regionalDetailChart.data.datasets[0].data = profile;
  regionalDetailChart.update();

  drilldownTitle.textContent = `${region} performance profile`;
  drilldownNote.textContent = selected.note;
}

function setInvestmentScrollFocus(index, revealTooltip = true) {
  investmentBarFocusIndex = index;
  investmentImpactChart.update();

  if (index === null || index < 0) {
    investmentImpactChart.setActiveElements([]);
    investmentImpactChart.tooltip.setActiveElements([], { x: 0, y: 0 });
    return;
  }

  const activeElements = [
    { datasetIndex: 0, index },
    { datasetIndex: 1, index },
  ];
  investmentImpactChart.setActiveElements(activeElements);

  if (revealTooltip) {
    const x = investmentImpactChart.scales.x.getPixelForValue(index);
    const y = investmentImpactChart.scales.y.getPixelForValue(
      Math.max(
        investmentImpactChart.data.datasets[0].data[index],
        investmentImpactChart.data.datasets[1].data[index]
      )
    );
    investmentImpactChart.tooltip.setActiveElements(activeElements, { x, y });
  }

  const region = investmentImpactChart.data.labels[index];
  if (region) updateRegionalDrilldown(region);
}

resetDrilldownBtn.addEventListener("click", () => {
  drilldownTitle.textContent = "Select a region in the chart";
  drilldownNote.textContent = "Drilldown reveals the gap between asset expansion and operational utilization.";
  regionalDetailChart.data.datasets[0].data = [58, 40, 35, 43, 31];
  regionalDetailChart.update();
  setInvestmentScrollFocus(null, false);
});

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scenarioButtons.forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    currentScenario = button.dataset.scenario;

    investmentImpactChart.data.labels = getRegionLabels();
    investmentImpactChart.data.datasets[0].data = getRegionValues().map((v) => v.investment);
    investmentImpactChart.data.datasets[1].data = getRegionValues().map((v) => v.efficiency);
    investmentImpactChart.update();
    investmentScrollHoverIndex = -1;
    resetDrilldownBtn.click();
  });
});

const domainLensData = {
  readiness: {
    years: ["2021", "2022", "2023", "2024", "2025", "2026"],
    series: {
      Logistics: [31, 34, 38, 42, 46, 50],
      "Public Services": [36, 40, 44, 49, 53, 57],
      "Urban Systems": [39, 43, 48, 53, 58, 63],
      Trade: [28, 31, 35, 39, 43, 47],
    },
    drilldown: {
      Logistics: ["Customs process digitalization", "Fleet tracking interoperability", "Warehouse API connectivity"],
      "Public Services": ["Permit workflow integration", "Identity system federation", "Cross-agency data exchange"],
      "Urban Systems": ["Smart mobility platform linkage", "Utility data harmonization", "Real-time monitoring coverage"],
      Trade: ["Border process orchestration", "Port documentation automation", "SME onboarding continuity"],
    },
  },
  adoption: {
    years: ["2021", "2022", "2023", "2024", "2025", "2026"],
    series: {
      Logistics: [33, 37, 42, 47, 52, 57],
      "Public Services": [38, 43, 49, 55, 60, 65],
      "Urban Systems": [41, 46, 52, 58, 64, 69],
      Trade: [30, 35, 40, 45, 50, 55],
    },
    drilldown: {
      Logistics: ["SME onboarding completion", "Digital invoice penetration", "Route tracking adoption"],
      "Public Services": ["Unified permit usage", "Single-sign-on adoption", "Digital service repeat use"],
      "Urban Systems": ["Smart meter adoption", "Mobility app usage", "Integrated utility portal use"],
      Trade: ["Digital declarations", "Paperless port workflows", "SME trade onboarding"],
    },
  },
  interoperability: {
    years: ["2021", "2022", "2023", "2024", "2025", "2026"],
    series: {
      Logistics: [24, 27, 31, 35, 40, 45],
      "Public Services": [29, 33, 38, 43, 48, 53],
      "Urban Systems": [32, 36, 41, 46, 51, 56],
      Trade: [22, 25, 30, 34, 39, 44],
    },
    drilldown: {
      Logistics: ["API standardization", "Cross-platform event sync", "Master data alignment"],
      "Public Services": ["Agency protocol alignment", "Identity bridge coverage", "Service bus reliability"],
      "Urban Systems": ["IoT protocol compatibility", "Unified operations center links", "Data model coherence"],
      Trade: ["Port-customs sync rate", "Carrier documentation compatibility", "Border data handoff quality"],
    },
  },
};
let currentDomainLens = "readiness";

const domainCtx = document.getElementById("smeIntegrationChart");
const domainDrilldownTitle = document.getElementById("domainDrilldownTitle");
const domainDrilldownList = document.getElementById("domainDrilldownList");
const domainLensButtons = document.querySelectorAll("[data-domain-lens]");
const getCurrentDomainData = () => domainLensData[currentDomainLens];
const getTimelineLabels = () => getCurrentDomainData().years;
const getTimelineSeries = () => getCurrentDomainData().series;
const domainPalette = {
  Logistics: "#0f8a6a",
  "Public Services": "#3f8d7b",
  "Urban Systems": "#c29a54",
  Trade: "#7a985f",
};
const buildTimelineDatasets = () =>
  Object.entries(getTimelineSeries()).map(([domain, values]) => ({
    label: domain,
    data: values,
    borderColor: domainPalette[domain],
    backgroundColor: "transparent",
    pointBackgroundColor: domainPalette[domain],
    pointBorderColor: "#ffffff",
    pointBorderWidth: 2,
    pointRadius: 4.5,
    pointHoverRadius: 7,
    pointHitRadius: 16,
    tension: 0.35,
    borderWidth: 2.6,
    cubicInterpolationMode: "monotone",
    fill: false,
  }));

const smeIntegrationChart = new Chart(domainCtx, {
  type: "line",
  data: {
    labels: getTimelineLabels(),
    datasets: buildTimelineDatasets(),
  },
  options: {
    ...chartBaseOptions,
    scales: {
      ...chartBaseOptions.scales,
      y: {
        ...chartBaseOptions.scales.y,
        max: 80,
      },
    },
    onClick: (_, elements) => {
      if (!elements.length) return;
      const pointIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const domain = smeIntegrationChart.data.datasets[datasetIndex].label;
      const year = smeIntegrationChart.data.labels[pointIndex];
      updateDomainDrilldown(domain, year);
    },
    onHover: (event, activeElements) => {
      event.native.target.style.cursor = activeElements.length ? "pointer" : "crosshair";
    },
  },
});

function updateDomainDrilldown(domain, year = getTimelineLabels()[getTimelineLabels().length - 1]) {
  const lens = getCurrentDomainData();
  const domainSeries = lens.series[domain];
  const domainCapabilities = lens.drilldown[domain];
  if (!domainSeries || !domainCapabilities) return;
  const yearIndex = lens.years.indexOf(String(year));
  const resolvedYearIndex = yearIndex >= 0 ? yearIndex : lens.years.length - 1;
  const overall = domainSeries[resolvedYearIndex];

  domainDrilldownTitle.textContent = `${domain} timeline drilldown (${lens.years[resolvedYearIndex]})`;
  domainDrilldownList.innerHTML = "";

  const offsets = [-3, 0, 2];
  domainCapabilities.forEach((capability, idx) => {
    const li = document.createElement("li");
    const value = Math.max(0, Math.min(100, overall + offsets[idx]));
    li.textContent = `${capability}: ${value}%`;
    domainDrilldownList.appendChild(li);
  });
}

domainLensButtons.forEach((button) => {
  button.addEventListener("click", () => {
    domainLensButtons.forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    currentDomainLens = button.dataset.domainLens;

    smeIntegrationChart.data.labels = getTimelineLabels();
    smeIntegrationChart.data.datasets = buildTimelineDatasets();
    smeIntegrationChart.update();

    domainDrilldownTitle.textContent = "Choose a line point from the chart";
    domainDrilldownList.innerHTML = "";
  });
});

updateRegionalDrilldown(getRegionLabels()[0]);
updateDomainDrilldown("Logistics", "2026");

const handleInvestmentScrollHover = () => {
  if (!investmentPanel || prefersReducedMotion) return;

  const rect = investmentPanel.getBoundingClientRect();
  const vh = window.innerHeight;
  const fullyVisible = rect.top >= 0 && rect.bottom <= vh;
  if (!fullyVisible) {
    if (investmentScrollHoverIndex !== -1) {
      investmentScrollHoverIndex = -1;
      setInvestmentScrollFocus(null, false);
    }
    return;
  }

  const progressRaw = (vh - rect.top) / Math.max(rect.height, 1);
  const progress = Math.max(0, Math.min(progressRaw, 1));
  const count = investmentImpactChart.data.labels.length;
  const nextIndex = Math.min(count - 1, Math.floor(progress * count));

  if (nextIndex !== investmentScrollHoverIndex) {
    investmentScrollHoverIndex = nextIndex;
    setInvestmentScrollFocus(nextIndex, true);
  }
};

window.addEventListener("scroll", handleInvestmentScrollHover, { passive: true });
window.addEventListener("resize", handleInvestmentScrollHover);
handleInvestmentScrollHover();
