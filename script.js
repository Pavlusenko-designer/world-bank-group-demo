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
  const initialText = el.textContent.trim().toLowerCase();
  const suffix = initialText.includes("pp") ? "pp" : initialText.includes("%") ? "%" : initialText.includes("b") ? "b" : "";
  const precision = Number.isInteger(finalValue) ? 0 : 1;
  const duration = 1000;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = finalValue * eased;
    const formatted = precision > 0 ? current.toFixed(precision) : `${Math.round(current)}`;
    el.textContent = `${formatted}${suffix}`;

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

document.querySelectorAll(".metric-grid").forEach((metricsSection) => {
  metricsObserver.observe(metricsSection);
});

const sectorCards = Array.from(document.querySelectorAll(".sector-card"));
const mobileSectorMedia = window.matchMedia("(max-width: 780px)");
let mobileCenterSectorCard = null;

const setActiveSectorCard = (targetCard) => {
  sectorCards.forEach((card) => {
    card.classList.toggle("is-active", card === targetCard);
  });
};

const playSectorVideoByCard = (card, restart = false) => {
  if (!card) return;
  const video = card.querySelector(".sector-video");
  if (!video) return;
  if (restart) video.currentTime = 0;
  video.play().catch(() => {});
};

const pauseSectorVideoByCard = (card) => {
  if (!card) return;
  const video = card.querySelector(".sector-video");
  if (!video) return;
  video.pause();
};

const updateMobileCenterSectorPlayback = () => {
  if (prefersReducedMotion || !mobileSectorMedia.matches || sectorCards.length === 0) return;

  const viewportMid = window.innerHeight / 2;
  let bestCard = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  sectorCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportMid);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCard = card;
    }
  });

  if (!bestCard || bestCard === mobileCenterSectorCard) return;

  mobileCenterSectorCard = bestCard;
  setActiveSectorCard(bestCard);
  sectorCards.forEach((card) => {
    if (card === bestCard) {
      playSectorVideoByCard(card, false);
    } else {
      pauseSectorVideoByCard(card);
    }
  });
};

sectorCards.forEach((card) => {
  const sectorVideo = card.querySelector(".sector-video");
  const sectorLink = card.querySelector(".sector-link");
  const sectorHref = sectorLink ? sectorLink.getAttribute("href") : "";
  const hasNavigableHref = Boolean(sectorHref && sectorHref !== "#" && !sectorHref.startsWith("javascript:"));

  card.addEventListener("click", (event) => {
    setActiveSectorCard(card);
    if (event.target.closest("a")) return;
    if (hasNavigableHref) window.location.href = sectorHref;
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (hasNavigableHref) {
        window.location.href = sectorHref;
      } else {
        setActiveSectorCard(card);
      }
    }
  });

  if (!prefersReducedMotion) {
    const playSectorVideo = () => {
      if (!sectorVideo || mobileSectorMedia.matches) return;
      playSectorVideoByCard(card, true);
    };
    const pauseSectorVideo = () => {
      if (!sectorVideo || mobileSectorMedia.matches) return;
      pauseSectorVideoByCard(card);
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
  updateMobileCenterSectorPlayback();
};

window.addEventListener("scroll", handleScrollEffects, { passive: true });
window.addEventListener("resize", handleScrollEffects);
handleScrollEffects();

const handleSectorMediaChange = () => {
  mobileCenterSectorCard = null;
  if (!mobileSectorMedia.matches) {
    sectorCards.forEach((card) => pauseSectorVideoByCard(card));
  }
  updateMobileCenterSectorPlayback();
};

if (typeof mobileSectorMedia.addEventListener === "function") {
  mobileSectorMedia.addEventListener("change", handleSectorMediaChange);
} else if (typeof mobileSectorMedia.addListener === "function") {
  mobileSectorMedia.addListener(handleSectorMediaChange);
}

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

  gccPattern.forEach((row, rowIndex) => {
    row.split("").forEach((char, colIndex) => {
      const dot = document.createElement("span");
      const isKeptCountryDot = colorClassMap[char] && (rowIndex + colIndex) % 2 === 0;
      if (isKeptCountryDot) {
        dot.className = `gcc-dot ${colorClassMap[char]}`;
        dot.dataset.row = `${rowIndex}`;
        dot.dataset.col = `${colIndex}`;
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
  let ambientRequest = null;
  let isDotMapHovering = false;
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
      dot.style.opacity = "0.74";
      dot.style.filter = "saturate(1)";
    });
  };

  const renderAmbientPulse = (now) => {
    if (isDotMapHovering) {
      ambientRequest = null;
      return;
    }

    const t = now * 0.001;
    dots.forEach((dot, index) => {
      const row = Number(dot.dataset.row || 0);
      const col = Number(dot.dataset.col || 0);

      // Distinct diagonal sweep + local pulse to keep the map visibly alive at idle.
      const sweep = (Math.sin(t * 2.2 + col * 0.68 - row * 0.46) + 1) * 0.5;
      const pulse = (Math.sin(t * 4.6 + row * 0.24 + col * 0.34) + 1) * 0.5;
      const shimmer = (Math.sin(t * 8.5 + index * 0.91) + 1) * 0.5;
      const intensity = Math.min(1, Math.max(0, sweep * 0.62 + pulse * 0.28 + shimmer * 0.1));

      const scale = 0.72 + intensity * 0.88;
      dot.style.transform = `scale(${scale.toFixed(3)})`;
      dot.style.opacity = (0.26 + intensity * 0.74).toFixed(2);
      dot.style.filter = `saturate(${(0.7 + intensity * 1.45).toFixed(2)})`;
    });

    ambientRequest = requestAnimationFrame(renderAmbientPulse);
  };

  const startAmbientPulse = () => {
    if (prefersReducedMotion || isDotMapHovering || ambientRequest !== null) return;
    ambientRequest = requestAnimationFrame(renderAmbientPulse);
  };

  const stopAmbientPulse = () => {
    if (ambientRequest !== null) {
      cancelAnimationFrame(ambientRequest);
      ambientRequest = null;
    }
  };

  cacheDotCenters();
  resetDotInteraction();
  window.addEventListener("resize", cacheDotCenters);

  if (!prefersReducedMotion) {
    startAmbientPulse();
    gccDotMap.addEventListener("mouseenter", () => {
      isDotMapHovering = true;
      stopAmbientPulse();
    });
    gccDotMap.addEventListener("mousemove", (event) => {
      if (!isDotMapHovering) {
        isDotMapHovering = true;
        stopAmbientPulse();
      }
      updateDotInteraction(event.clientX, event.clientY);
    });
    gccDotMap.addEventListener("mouseleave", () => {
      isDotMapHovering = false;
      startAmbientPulse();
    });
  }
}

const isHomeChartsPage =
  typeof Chart !== "undefined" &&
  !!document.getElementById("investmentImpactChart") &&
  !!document.getElementById("regionalDetailChart") &&
  !!document.getElementById("smeIntegrationChart");

if (isHomeChartsPage) {
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
let investmentScrollProgress = prefersReducedMotion ? 1 : 0;
let investmentScrollTargetProgress = investmentScrollProgress;
let investmentScrollRafId = null;
const investmentScrollScrubLerp = 0.07;
const investmentScrollScrubEpsilon = 0.0015;
let investmentHoverGroupIndex = null;
const defaultRegionalProfile = [58, 40, 35, 43, 31];
const regionalProfileMap = {
  "Capital Belt": [82, 63, 61, 71, 58],
  "North Corridor": [69, 39, 34, 46, 32],
  "Eastern Ports": [76, 44, 41, 52, 38],
  "Southern Growth Zone": [62, 35, 33, 41, 29],
};
let currentRegionalProfile = [...defaultRegionalProfile];

const getCurrentRegionalData = () => regionalScenarios[currentScenario];
const getRegionLabels = () => Object.keys(getCurrentRegionalData());
const getRegionValues = () => Object.values(getCurrentRegionalData());
const getBarOpacityFactor = (dataIndex) =>
  investmentHoverGroupIndex === null || investmentHoverGroupIndex === dataIndex ? 1 : 0.5;
const getInvestmentGradient = (chart, dataIndex) => {
  const factor = getBarOpacityFactor(dataIndex);
  return verticalGradient(
    chart,
    `rgba(15, 138, 106, ${(0.6 * factor).toFixed(3)})`,
    `rgba(15, 138, 106, ${(0.96 * factor).toFixed(3)})`
  );
};
const getEfficiencyGradient = (chart, dataIndex) => {
  const factor = getBarOpacityFactor(dataIndex);
  return verticalGradient(
    chart,
    `rgba(194, 154, 84, ${(0.58 * factor).toFixed(3)})`,
    `rgba(194, 154, 84, ${(0.94 * factor).toFixed(3)})`
  );
};

const investmentImpactChart = new Chart(investmentCtx, {
  type: "bar",
  data: {
    labels: getRegionLabels(),
    datasets: [
      {
        label: "Investment Index",
        data: getRegionValues().map((v) => v.investment),
        backgroundColor: (context) => getInvestmentGradient(context.chart, context.dataIndex),
        borderColor: (context) => `rgba(15, 138, 106, ${(0.92 * getBarOpacityFactor(context.dataIndex)).toFixed(3)})`,
        borderWidth: 1.2,
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 38,
      },
      {
        label: "Efficiency Index",
        data: getRegionValues().map((v) => v.efficiency),
        backgroundColor: (context) => getEfficiencyGradient(context.chart, context.dataIndex),
        borderColor: (context) => `rgba(194, 154, 84, ${(0.92 * getBarOpacityFactor(context.dataIndex)).toFixed(3)})`,
        borderWidth: 1.2,
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
      const nextHoverIndex = activeElements.length ? activeElements[0].index : null;
      if (nextHoverIndex !== investmentHoverGroupIndex) {
        investmentHoverGroupIndex = nextHoverIndex;
        investmentImpactChart.update("none");
      }
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
        data: [...defaultRegionalProfile],
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
  const selected = getCurrentRegionalData()[region];
  currentRegionalProfile = regionalProfileMap[region] ? [...regionalProfileMap[region]] : [...defaultRegionalProfile];
  applyRegionalChartProgress(investmentScrollProgress);

  drilldownTitle.textContent = `${region} performance profile`;
  drilldownNote.textContent = selected.note;
}

function applyRegionalChartProgress(progress) {
  const clamped = Math.max(0, Math.min(progress, 1));
  regionalDetailChart.data.datasets[0].data = currentRegionalProfile.map((v) =>
    Number((v * clamped).toFixed(1))
  );
  regionalDetailChart.update("none");
}

function applyInvestmentChartProgress(progress) {
  const clamped = Math.max(0, Math.min(progress, 1));
  investmentScrollProgress = clamped;
  const values = getRegionValues();
  investmentImpactChart.data.datasets[0].data = values.map((v) => Number((v.investment * clamped).toFixed(1)));
  investmentImpactChart.data.datasets[1].data = values.map((v) => Number((v.efficiency * clamped).toFixed(1)));
  investmentImpactChart.update("none");
  applyRegionalChartProgress(clamped);
}

function tickInvestmentScrollScrub() {
  const delta = investmentScrollTargetProgress - investmentScrollProgress;
  investmentScrollProgress += delta * investmentScrollScrubLerp;

  if (Math.abs(delta) <= investmentScrollScrubEpsilon) {
    investmentScrollProgress = investmentScrollTargetProgress;
  }

  applyInvestmentChartProgress(investmentScrollProgress);

  if (Math.abs(investmentScrollTargetProgress - investmentScrollProgress) > investmentScrollScrubEpsilon) {
    investmentScrollRafId = requestAnimationFrame(tickInvestmentScrollScrub);
  } else {
    investmentScrollRafId = null;
  }
}

function setInvestmentScrollTarget(progress) {
  investmentScrollTargetProgress = Math.max(0, Math.min(progress, 1));

  if (prefersReducedMotion) {
    applyInvestmentChartProgress(investmentScrollTargetProgress);
    return;
  }

  if (investmentScrollRafId === null) {
    investmentScrollRafId = requestAnimationFrame(tickInvestmentScrollScrub);
  }
}

resetDrilldownBtn.addEventListener("click", () => {
  drilldownTitle.textContent = "Select a region in the chart";
  drilldownNote.textContent = "Drilldown reveals the gap between asset expansion and operational utilization.";
  currentRegionalProfile = [...defaultRegionalProfile];
  applyRegionalChartProgress(investmentScrollProgress);
  investmentImpactChart.setActiveElements([]);
  investmentImpactChart.tooltip.setActiveElements([], { x: 0, y: 0 });
});

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scenarioButtons.forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    currentScenario = button.dataset.scenario;

    investmentImpactChart.data.labels = getRegionLabels();
    applyInvestmentChartProgress(investmentScrollProgress);
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

const handleInvestmentScrollGrowth = () => {
  if (!investmentPanel || prefersReducedMotion) return;

  const rect = investmentPanel.getBoundingClientRect();
  const vh = window.innerHeight;
  const earlyStartOffset = 200;
  const earlyCompleteOffset = 300;
  const startTop = vh - rect.height + earlyStartOffset;
  const endTop = earlyCompleteOffset;
  const travel = startTop - endTop;
  let progress = 0;

  if (travel <= 1) {
    progress = rect.top <= endTop ? 1 : 0;
  } else {
    progress = (startTop - rect.top) / travel;
  }

  setInvestmentScrollTarget(progress);
};

window.addEventListener("scroll", handleInvestmentScrollGrowth, { passive: true });
window.addEventListener("resize", handleInvestmentScrollGrowth);
handleInvestmentScrollGrowth();
}

if (typeof Chart !== "undefined") {
  const infraChallengeCards = Array.from(document.querySelectorAll(".challenge-card"));
  if (infraChallengeCards.length) {
    const setChallengeOpen = (card, isOpen) => {
      const detail = card.querySelector(".challenge-detail");
      const toggle = card.querySelector("[data-challenge-toggle]");
      card.classList.toggle("is-open", isOpen);
      if (detail) detail.hidden = !isOpen;
      if (toggle) {
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        toggle.setAttribute("aria-label", isOpen ? "Collapse challenge detail" : "Expand challenge detail");
      }
    };

    infraChallengeCards.forEach((card, index) => {
      setChallengeOpen(card, index === 0);
      const toggle = card.querySelector("[data-challenge-toggle]");
      if (!toggle) return;
      toggle.addEventListener("click", () => {
        const isOpen = card.classList.contains("is-open");
        infraChallengeCards.forEach((target) => setChallengeOpen(target, false));
        setChallengeOpen(card, !isOpen);
      });
    });
  }

  const flowNodes = Array.from(document.querySelectorAll(".flow-node"));
  const flowCallouts = Array.from(document.querySelectorAll(".flow-callout"));
  if (flowNodes.length && flowCallouts.length) {
    const setFlowStep = (step) => {
      flowNodes.forEach((node) => node.classList.toggle("is-active", node.dataset.step === step));
      flowCallouts.forEach((callout) => callout.classList.toggle("is-active", callout.dataset.step === step));
    };

    flowNodes.forEach((node) => {
      const activate = () => setFlowStep(node.dataset.step);
      node.addEventListener("mouseenter", activate);
      node.addEventListener("focusin", activate);
      node.addEventListener("click", activate);
    });

    setFlowStep(flowNodes[0].dataset.step);
  }

  const infraFlowTrendCtx = document.getElementById("infraFlowTrendChart");
  const infraFlowBottleneckCtx = document.getElementById("infraFlowBottleneckChart");
  if (infraFlowTrendCtx && infraFlowBottleneckCtx) {
    const infraFlowBaseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: prefersReducedMotion ? false : { duration: 620, easing: "easeOutCubic" },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#2e4c3d",
            font: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
          },
        },
        tooltip: {
          backgroundColor: "rgba(17, 32, 24, 0.95)",
          titleFont: { family: "Manrope", weight: "700" },
          bodyFont: { family: "Plus Jakarta Sans" },
          padding: 12,
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

    const getFlowGradient = (chart, start, end) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return start;
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, start);
      gradient.addColorStop(1, end);
      return gradient;
    };

    new Chart(infraFlowTrendCtx, {
      type: "line",
      data: {
        labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
        datasets: [
          {
            label: "Capacity Expansion",
            data: [48, 57, 64, 72, 81, 88],
            borderColor: "#0f8a6a",
            pointBackgroundColor: "#0f8a6a",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            tension: 0.36,
            borderWidth: 2.4,
            fill: false,
          },
          {
            label: "System Utilization",
            data: [39, 44, 48, 52, 55, 58],
            borderColor: "#c29a54",
            pointBackgroundColor: "#c29a54",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            tension: 0.36,
            borderWidth: 2.4,
            fill: false,
          },
        ],
      },
      options: {
        ...infraFlowBaseOptions,
      },
    });

    new Chart(infraFlowBottleneckCtx, {
      type: "bar",
      data: {
        labels: ["Data Interoperability", "SME Onboarding", "Customs Handoffs", "Regional Coverage"],
        datasets: [
          {
            label: "Friction Score",
            data: [76, 69, 64, 58],
            backgroundColor: (context) =>
              getFlowGradient(context.chart, "rgba(122, 152, 95, 0.45)", "rgba(122, 152, 95, 0.9)"),
            borderColor: "rgba(97, 128, 72, 0.9)",
            borderWidth: 1.2,
            borderRadius: 10,
            borderSkipped: false,
          },
        ],
      },
      options: {
        ...infraFlowBaseOptions,
        indexAxis: "y",
        plugins: {
          ...infraFlowBaseOptions.plugins,
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: {
              color: "#3f5e50",
              font: { family: "Plus Jakarta Sans", weight: "600" },
            },
            grid: { color: "rgba(79, 97, 87, 0.12)" },
            border: { color: "rgba(79, 97, 87, 0.18)" },
            beginAtZero: true,
            max: 100,
          },
          y: {
            ticks: {
              color: "#3f5e50",
              font: { family: "Plus Jakarta Sans", weight: "600" },
            },
            grid: { display: false },
            border: { color: "rgba(79, 97, 87, 0.18)" },
          },
        },
      },
    });
  }

  const infraBridgeCtx = document.getElementById("infraBridgeChart");
  const infraGaugeCtx = document.getElementById("infraAdoptionGauge");
  const infraRegionCtx = document.getElementById("infraRegionalGapChart");
  const infraBridgeButtons = document.querySelectorAll("[data-bridge-lens]");
  const infraBridgeNote = document.getElementById("infraBridgeNote");

  if (infraBridgeCtx && infraGaugeCtx && infraRegionCtx) {
    const infraBridgeScenarios = {
      current: {
        note: "Capacity is scaling faster than clearance and interoperability outcomes in all four regions.",
        regions: ["Capital Belt", "Eastern Ports", "North Corridor", "Southern Growth Zone"],
        investment: [88, 82, 72, 66],
        efficiency: [74, 58, 51, 48],
        adoption: 35,
        gaps: [14, 24, 21, 18],
      },
      integration: {
        note: "A unified logistics data layer closes the investment-efficiency gap and lifts SME participation.",
        regions: ["Capital Belt", "Eastern Ports", "North Corridor", "Southern Growth Zone"],
        investment: [90, 85, 75, 69],
        efficiency: [82, 71, 64, 61],
        adoption: 51,
        gaps: [8, 14, 11, 8],
      },
      fragmented: {
        note: "Without interoperability standards, utilization stays low and regional disparities widen.",
        regions: ["Capital Belt", "Eastern Ports", "North Corridor", "Southern Growth Zone"],
        investment: [88, 82, 72, 66],
        efficiency: [67, 49, 44, 40],
        adoption: 28,
        gaps: [21, 33, 28, 26],
      },
    };
    let currentInfraLens = "current";

    const infraBaseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: prefersReducedMotion ? false : { duration: 600, easing: "easeOutCubic" },
      interaction: { mode: "nearest", intersect: false },
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
          padding: 12,
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

    const getVerticalGradient = (chart, start, end) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return start;
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, start);
      gradient.addColorStop(1, end);
      return gradient;
    };

    const infraBridgeChart = new Chart(infraBridgeCtx, {
      type: "bar",
      data: {
        labels: infraBridgeScenarios[currentInfraLens].regions,
        datasets: [
          {
            label: "Investment Index",
            data: infraBridgeScenarios[currentInfraLens].investment,
            backgroundColor: (context) =>
              getVerticalGradient(context.chart, "rgba(15, 138, 106, 0.58)", "rgba(15, 138, 106, 0.95)"),
            borderColor: "rgba(15, 138, 106, 0.95)",
            borderWidth: 1.2,
            borderRadius: 10,
            borderSkipped: false,
            maxBarThickness: 34,
          },
          {
            label: "Efficiency Index",
            data: infraBridgeScenarios[currentInfraLens].efficiency,
            backgroundColor: (context) =>
              getVerticalGradient(context.chart, "rgba(194, 154, 84, 0.5)", "rgba(194, 154, 84, 0.9)"),
            borderColor: "rgba(194, 154, 84, 0.92)",
            borderWidth: 1.2,
            borderRadius: 10,
            borderSkipped: false,
            maxBarThickness: 34,
          },
        ],
      },
      options: infraBaseOptions,
    });

    const gaugeCenterTextPlugin = {
      id: "gaugeCenterText",
      afterDraw(chart, args, options) {
        if (!options || !options.text) return;
        const { ctx, chartArea } = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#163126";
        ctx.font = "700 1.42rem Manrope";
        ctx.fillText(options.text, centerX, centerY - 6);
        ctx.fillStyle = "#4d6b5e";
        ctx.font = "600 0.78rem 'Plus Jakarta Sans'";
        ctx.fillText("SME Integration", centerX, centerY + 14);
        ctx.restore();
      },
    };

    const infraAdoptionGauge = new Chart(infraGaugeCtx, {
      type: "doughnut",
      plugins: [gaugeCenterTextPlugin],
      data: {
        labels: ["Integrated", "Not integrated"],
        datasets: [
          {
            data: [
              infraBridgeScenarios[currentInfraLens].adoption,
              100 - infraBridgeScenarios[currentInfraLens].adoption,
            ],
            backgroundColor: ["rgba(15, 138, 106, 0.9)", "rgba(184, 200, 190, 0.52)"],
            borderWidth: 0,
            cutout: "72%",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: prefersReducedMotion ? false : { duration: 540, easing: "easeOutCubic" },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          gaugeCenterText: { text: `${infraBridgeScenarios[currentInfraLens].adoption}%` },
        },
      },
    });

    const infraRegionalGapChart = new Chart(infraRegionCtx, {
      type: "bar",
      data: {
        labels: infraBridgeScenarios[currentInfraLens].regions,
        datasets: [
          {
            label: "Investment-Efficiency Gap",
            data: infraBridgeScenarios[currentInfraLens].gaps,
            backgroundColor: (context) =>
              getVerticalGradient(context.chart, "rgba(122, 152, 95, 0.45)", "rgba(122, 152, 95, 0.9)"),
            borderColor: "rgba(97, 128, 72, 0.9)",
            borderWidth: 1,
            borderRadius: 10,
            borderSkipped: false,
          },
        ],
      },
      options: {
        ...infraBaseOptions,
        indexAxis: "y",
        scales: {
          x: {
            ticks: {
              color: "#3f5e50",
              font: { family: "Plus Jakarta Sans", weight: "600" },
            },
            grid: { color: "rgba(79, 97, 87, 0.12)" },
            border: { color: "rgba(79, 97, 87, 0.18)" },
            beginAtZero: true,
            max: 40,
          },
          y: {
            ticks: {
              color: "#3f5e50",
              font: { family: "Plus Jakarta Sans", weight: "600" },
            },
            grid: { display: false },
            border: { color: "rgba(79, 97, 87, 0.18)" },
          },
        },
      },
    });

    const updateInfraBridgeCharts = (lens) => {
      const scenario = infraBridgeScenarios[lens];
      if (!scenario) return;

      infraBridgeChart.data.labels = scenario.regions;
      infraBridgeChart.data.datasets[0].data = scenario.investment;
      infraBridgeChart.data.datasets[1].data = scenario.efficiency;
      infraBridgeChart.update();

      infraAdoptionGauge.data.datasets[0].data = [scenario.adoption, 100 - scenario.adoption];
      infraAdoptionGauge.options.plugins.gaugeCenterText.text = `${scenario.adoption}%`;
      infraAdoptionGauge.update();

      infraRegionalGapChart.data.labels = scenario.regions;
      infraRegionalGapChart.data.datasets[0].data = scenario.gaps;
      infraRegionalGapChart.update();

      if (infraBridgeNote) infraBridgeNote.textContent = scenario.note;
    };

    infraBridgeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        infraBridgeButtons.forEach((chip) => chip.classList.remove("is-active"));
        button.classList.add("is-active");
        currentInfraLens = button.dataset.bridgeLens;
        updateInfraBridgeCharts(currentInfraLens);
      });
    });

    updateInfraBridgeCharts(currentInfraLens);
  }
}
