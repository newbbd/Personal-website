const repoGrid = document.getElementById("repo-grid");
const githubUser = "newbbd";
const reposEndpoint = `https://api.github.com/users/${githubUser}/repos`;
const fallbackReposEndpoint = `https://ungh.cc/users/${githubUser}/repos`;
const userEndpoint = `https://api.github.com/users/${githubUser}`;
const repoStat = document.getElementById("stat-repos");
const followerStat = document.getElementById("stat-followers");
const starStat = document.getElementById("stat-stars");
const discordStatus = document.getElementById("discord-status");
const discordActivity = document.getElementById("discord-activity");
const discordIndicator = document.getElementById("discord-indicator");
const repoPrevButton = document.getElementById("repo-prev");
const repoNextButton = document.getElementById("repo-next");
const repoPageIndicator = document.getElementById("repo-page-indicator");
const panelSwitchButtons = Array.from(document.querySelectorAll(".panel-switch-btn"));
const mobilePanelsMediaQuery = window.matchMedia("(max-width: 900px)");

const discordLanyardId = "1386016503052243054";

let lastScrollY = window.scrollY;
let scrollDirection = "down";
let cardObserver = null;
let hasCompletedTypingIntro = false;
let matrixCollisionMasks = [];
let sortedReposCache = [];
let pagedReposCache = [];
let repoPageIndex = 0;

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function setActiveMobilePanel(panelName) {
  const validPanel = panelName === "projects" ? "projects" : "profile";
  document.body.dataset.activePanel = validPanel;

  panelSwitchButtons.forEach((button) => {
    const isActive = button.dataset.panelTarget === validPanel;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncMobilePanelState() {
  const isMobile = mobilePanelsMediaQuery.matches;
  document.body.classList.toggle("is-mobile-panels", isMobile);

  if (!isMobile) {
    delete document.body.dataset.activePanel;
    panelSwitchButtons.forEach((button) => {
      const isProfileButton = button.dataset.panelTarget === "profile";
      button.classList.toggle("is-active", isProfileButton);
      button.setAttribute("aria-pressed", String(isProfileButton));
    });
    return;
  }

  setActiveMobilePanel(document.body.dataset.activePanel || "profile");
  if (sortedReposCache.length) {
    rebuildRepoPagesAndRender();
  }
}

function setMobilePanelSwitcher() {
  if (!panelSwitchButtons.length) {
    return;
  }

  panelSwitchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveMobilePanel(button.dataset.panelTarget || "profile");
    });
  });

  if (typeof mobilePanelsMediaQuery.addEventListener === "function") {
    mobilePanelsMediaQuery.addEventListener("change", syncMobilePanelState);
  } else if (typeof mobilePanelsMediaQuery.addListener === "function") {
    mobilePanelsMediaQuery.addListener(syncMobilePanelState);
  }

  syncMobilePanelState();
}

function setAnimatedTitle() {
  const shaanDelayMs = 500;
  const waveDelayMs = 100;
  const backgroundDelayMs = 1000;
  const shaanFrames = [
    "⟦Ｓ⟧",
    "⟦ＳＨ⟧",
    "⟦ＳＨＡ⟧",
    "⟦ＳＨＡＡ⟧",
    "⟦ＳＨＡＡＮ⟧",
    "⟦ＳＨＡＡ⟧",
    "⟦ＳＨＡ⟧",
    "⟦ＳＨ⟧",
    "⟦Ｓ⟧",
    "\u200B",
  ];
  const waveFrames = [
    "▁▂▃▄▅▆▇█▇▆▅▄▃▂▁",
    "▂▃▄▅▆▇█▇▆▅▄▃▂▁▂",
    "▃▄▅▆▇█▇▆▅▄▃▂▁▂▃",
    "▄▅▆▇█▇▆▅▄▃▂▁▂▃▄",
    "▅▆▇█▇▆▅▄▃▂▁▂▃▄▅",
    "▆▇█▇▆▅▄▃▂▁▂▃▄▅▆",
    "▇█▇▆▅▄▃▂▁▂▃▄▅▆▇",
    "█▇▆▅▄▃▂▁▂▃▄▅▆▇█",
    "▇▆▅▄▃▂▁▂▃▄▅▆▇█▇",
    "▆▅▄▃▂▁▂▃▄▅▆▇█▇▆",
    "▅▄▃▂▁▂▃▄▅▆▇█▇▆▅",
    "▄▃▂▁▂▃▄▅▆▇█▇▆▅▄",
  ];
  const waveDurationMs = 3000;
  const waveSteps = Math.max(1, Math.floor(waveDurationMs / waveDelayMs));
  let shaanIndex = 0;
  let waveStep = 0;
  let phase = "shaan";
  let timerId = 0;

  document.title = "SHAAN";

  function stopTick() {
    if (timerId) {
      window.clearTimeout(timerId);
      timerId = 0;
    }
  }

  function scheduleTick(delayMs) {
    stopTick();
    timerId = window.setTimeout(tick, delayMs);
  }

  function getDelayForPhase() {
    if (document.visibilityState === "hidden") {
      return backgroundDelayMs;
    }

    return phase === "shaan" ? shaanDelayMs : waveDelayMs;
  }

  function resetToStart() {
    phase = "shaan";
    shaanIndex = 0;
    waveStep = 0;
  }

  function tick() {
    if (phase === "shaan") {
      document.title = shaanFrames[shaanIndex];
      shaanIndex += 1;

      if (shaanIndex >= shaanFrames.length) {
        phase = "wave";
        waveStep = 0;
      }

      scheduleTick(getDelayForPhase());
      return;
    }

    document.title = waveFrames[waveStep % waveFrames.length];
    waveStep += 1;

    if (waveStep >= waveSteps) {
      phase = "shaan";
      shaanIndex = 0;
    }

    scheduleTick(getDelayForPhase());
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // Resync cleanly when returning to the tab to avoid timing drift.
      resetToStart();
    }

    scheduleTick(getDelayForPhase());
  });

  tick();
}

function shortDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderState(message) {
  repoGrid.innerHTML = `<p class="repo-state">${escapeHtml(message)}</p>`;
  sortedReposCache = [];
  repoPageIndex = 0;
  updateRepoPaginationControls();
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function sentenceCase(value) {
  if (!value || typeof value !== "string") {
    return "Offline";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function setStats(profile, repos) {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  if (repoStat) {
    repoStat.textContent = formatNumber(repos.length);
  }
  if (followerStat) {
    followerStat.textContent = formatNumber(profile.followers);
  }
  if (starStat) {
    starStat.textContent = formatNumber(totalStars);
  }
}

function getRepoPagePattern() {
  return mobilePanelsMediaQuery.matches ? [2, 3, 2] : [3, 5, 4];
}

function buildRepoPages(repos) {
  if (!repos.length) {
    return [];
  }

  const pattern = getRepoPagePattern();
  const pages = [];
  let cursor = 0;
  let patternIndex = repos.length % pattern.length;

  while (cursor < repos.length) {
    const pageSize = Math.max(1, pattern[patternIndex % pattern.length]);
    pages.push(repos.slice(cursor, cursor + pageSize));
    cursor += pageSize;
    patternIndex += 1;
  }

  return pages;
}

function rebuildRepoPagesAndRender() {
  if (!sortedReposCache.length) {
    pagedReposCache = [];
    repoPageIndex = 0;
    updateRepoPaginationControls();
    return;
  }

  const currentPage = pagedReposCache[repoPageIndex] || [];
  const anchorRepoName = currentPage[0]?.name || null;
  pagedReposCache = buildRepoPages(sortedReposCache);

  if (anchorRepoName) {
    const nextPageIndex = pagedReposCache.findIndex((page) =>
      page.some((repo) => repo.name === anchorRepoName)
    );
    repoPageIndex = nextPageIndex >= 0 ? nextPageIndex : 0;
  } else {
    repoPageIndex = 0;
  }

  renderRepoPage();
}

function updateRepoPaginationControls() {
  const pageCount = Math.max(1, pagedReposCache.length);
  if (repoPageIndicator) {
    repoPageIndicator.textContent = `${Math.min(repoPageIndex + 1, pageCount)} / ${pageCount}`;
  }

  if (repoPrevButton) {
    repoPrevButton.disabled = repoPageIndex <= 0;
  }

  if (repoNextButton) {
    repoNextButton.disabled = repoPageIndex >= pageCount - 1;
  }
}

function renderRepoPage() {
  if (!pagedReposCache.length) {
    renderState("no repositories found yet.");
    return;
  }

  const pageCount = pagedReposCache.length;
  if (repoPageIndex >= pageCount) {
    repoPageIndex = Math.max(0, pageCount - 1);
  }

  const pageRepos = pagedReposCache[repoPageIndex] || [];

  const cards = pageRepos
    .map((repo) => {
      const description = repo.description ? repo.description : "no description added yet.";
      const language = repo.language ? repo.language : "unspecified";

      return `
        <a class="repo-card" href="${repo.html_url}" target="_blank" rel="noreferrer">
          <h3>${escapeHtml(repo.name)}</h3>
          <p class="repo-desc">${escapeHtml(description)}</p>
          <div class="repo-meta">
            <span>lang ${escapeHtml(language)}</span>
            <span>stars ${repo.stargazers_count}</span>
            <span>updated ${shortDate(repo.updated_at).toLowerCase()}</span>
          </div>
        </a>
      `;
    })
    .join("");

  repoGrid.innerHTML = cards;
  updateRepoPaginationControls();
  if (hasCompletedTypingIntro) {
    setCardScrollAnimations();
  }
}

function renderRepos(repos) {
  if (!repos.length) {
    renderState("no repositories found yet.");
    return;
  }

  sortedReposCache = [...repos].sort(
    (a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
  );
  pagedReposCache = buildRepoPages(sortedReposCache);
  repoPageIndex = 0;
  renderRepoPage();
}

function setRepoPaginationControls() {
  if (repoPrevButton) {
    repoPrevButton.addEventListener("click", () => {
      if (repoPageIndex <= 0) {
        return;
      }
      repoPageIndex -= 1;
      renderRepoPage();
    });
  }

  if (repoNextButton) {
    repoNextButton.addEventListener("click", () => {
      const pageCount = pagedReposCache.length;
      if (repoPageIndex >= pageCount - 1) {
        return;
      }
      repoPageIndex += 1;
      renderRepoPage();
    });
  }

  updateRepoPaginationControls();
}

function setRepoAndStarStatsOnly(repos) {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  if (repoStat) {
    repoStat.textContent = formatNumber(repos.length);
  }
  if (starStat) {
    starStat.textContent = formatNumber(totalStars);
  }
  if (followerStat && (!followerStat.textContent || followerStat.textContent === "--")) {
    followerStat.textContent = "--";
  }
}

function normalizeFallbackRepo(repo) {
  const repoPath = repo.repo || `${githubUser}/${repo.name}`;
  return {
    name: repo.name,
    description: repo.description,
    language: null,
    stargazers_count: Number.isFinite(repo.stars) ? repo.stars : 0,
    updated_at: repo.updatedAt || repo.pushedAt || repo.createdAt || new Date().toISOString(),
    pushed_at: repo.pushedAt || repo.updatedAt || repo.createdAt || new Date().toISOString(),
    html_url: `https://github.com/${repoPath}`,
  };
}

async function loadRepos() {
  try {
    let page = 1;
    const perPage = 100;
    const allRepos = [];
    let usedFallback = false;

    try {
      while (true) {
        const url = `${reposEndpoint}?per_page=${perPage}&page=${page}&type=owner&sort=updated`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`GitHub API request failed with ${response.status}`);
        }

        const repos = await response.json();
        allRepos.push(...repos);

        if (repos.length < perPage) {
          break;
        }

        page += 1;
      }
    } catch (primaryError) {
      const fallbackResponse = await fetch(fallbackReposEndpoint, { cache: "no-store" });
      if (!fallbackResponse.ok) {
        throw primaryError;
      }

      const fallbackPayload = await fallbackResponse.json();
      const fallbackRepos = Array.isArray(fallbackPayload?.repos)
        ? fallbackPayload.repos.map(normalizeFallbackRepo)
        : [];
      allRepos.push(...fallbackRepos);
      usedFallback = true;
    }

    if (!allRepos.length) {
      renderState("no repositories found yet.");
      return;
    }

    try {
      const profileResponse = await fetch(userEndpoint, { cache: "no-store" });
      if (!profileResponse.ok) {
        throw new Error(`Profile request failed with ${profileResponse.status}`);
      }
      const profile = await profileResponse.json();
      setStats(profile, allRepos);
    } catch (profileError) {
      setRepoAndStarStatsOnly(allRepos);
      if (!usedFallback && followerStat && followerStat.textContent === "--") {
        followerStat.textContent = "--";
      }
    }

    renderRepos(allRepos);
  } catch (error) {
    renderState("could not load repos right now. refresh and try again.");
  }
}

async function loadDiscordStatus() {
  if (!discordStatus || !discordActivity || !discordIndicator) {
    return;
  }

  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${discordLanyardId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Status fetch failed");
    }

    const payload = await response.json();
    if (!payload.success || !payload.data) {
      throw new Error("No status data");
    }

    const status = payload.data.discord_status || "offline";
    const statusText = sentenceCase(status);
    const activity = payload.data.listening_to_spotify
      ? `Listening to ${payload.data.spotify?.song ?? "Spotify"}`
      : payload.data.activities?.find((item) => item.type === 0)?.name ||
        payload.data.activities?.find((item) => item.type === 4)?.state ||
        "No active game";

    discordStatus.textContent = statusText;
    discordActivity.textContent = activity;

    discordIndicator.classList.remove("is-online", "is-idle", "is-dnd");
    if (status === "online") {
      discordIndicator.classList.add("is-online");
    } else if (status === "idle") {
      discordIndicator.classList.add("is-idle");
    } else if (status === "dnd") {
      discordIndicator.classList.add("is-dnd");
    }
  } catch (error) {
    discordStatus.textContent = "Status unavailable";
    discordActivity.textContent =
      "Lanyard needs your numeric Discord user ID. Replace the discordLanyardId value in script.js.";
    discordIndicator.classList.remove("is-online", "is-idle", "is-dnd");
  }
}

function setRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length || reducedMotionQuery.matches) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else if (scrollDirection === "up") {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function trackScrollDirection() {
  window.addEventListener(
    "scroll",
    () => {
      const currentY = window.scrollY;
      scrollDirection = currentY >= lastScrollY ? "down" : "up";
      lastScrollY = currentY;
    },
    { passive: true }
  );
}

function setCardScrollAnimations() {
  const cards = document.querySelectorAll(".stat, .social-card, .repo-card");
  if (!cards.length) {
    return;
  }

  if (reducedMotionQuery.matches) {
    cards.forEach((card) => {
      card.classList.remove("scroll-card");
      card.style.removeProperty("--card-delay");
      card.classList.add("in-view");
    });
    return;
  }

  if (cardObserver) {
    cardObserver.disconnect();
  }

  cards.forEach((card, index) => {
    card.classList.add("scroll-card");
    card.classList.remove("in-view");
    card.style.setProperty("--card-delay", `${(index % 8) * 44}ms`);
  });

  cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (entry.isIntersecting) {
          target.classList.add("in-view");
          return;
        }

        target.classList.remove("in-view");
      });
    },
    { threshold: 0.3, rootMargin: "0px 0px -7% 0px" }
  );

  cards.forEach((card) => cardObserver.observe(card));
}

function setCustomCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || reducedMotionQuery.matches) {
    return;
  }

  const cursor = document.getElementById("custom-cursor");
  if (!cursor) {
    return;
  }

  const interactiveSelector = "a, button, [role='button'], .repo-card, .social-card, .stat";

  let cursorVisible = false;
  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.5;
  let renderX = pointerX;
  let renderY = pointerY;
  let previousX = renderX;
  let previousY = renderY;
  let velocityX = 0;
  let velocityY = 0;
  let trailBudget = 0;
  let lastTick = performance.now();
  let hoverTarget = null;

  function setHoverState(isHovering) {
    cursor.classList.toggle("is-hovering", isHovering);
  }

  function getMagnetStrength(element) {
    if (!element) {
      return 0;
    }

    if (element.matches(".repo-card, .social-card")) {
      return 0.2;
    }

    if (element.matches(".stat")) {
      return 0.16;
    }

    return 0.12;
  }

  function spawnSpark(x, y, vx, vy, speed) {
    const spark = document.createElement("span");
    spark.className = "cursor-spark";

    const baseAngle = Math.atan2(vy || Math.random() - 0.5, vx || Math.random() - 0.5);
    const angle = baseAngle + (Math.random() - 0.5) * 1.15;
    const distance = 14 + Math.random() * 30 + Math.min(speed, 2.4) * 8;
    const driftX = Math.cos(angle) * distance;
    const driftY = Math.sin(angle) * distance;
    const size = 1.6 + Math.random() * 2.6;
    const durationMs = 360 + Math.random() * 360;
    const opacity = 0.5 + Math.random() * 0.4;

    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty("--spark-size", `${size}px`);
    spark.style.setProperty("--spark-dx", `${driftX}px`);
    spark.style.setProperty("--spark-dy", `${driftY}px`);
    spark.style.setProperty("--spark-duration", `${durationMs}ms`);
    spark.style.setProperty("--spark-opacity", opacity.toFixed(2));

    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
  }

  function showCursor() {
    cursorVisible = true;
    cursor.style.opacity = "1";
  }

  function hideCursor() {
    cursorVisible = false;
    cursor.style.opacity = "0";
    setHoverState(false);
    hoverTarget = null;
  }

  function animate(now) {
    const delta = Math.min(34, Math.max(8, now - lastTick));
    lastTick = now;

    let targetX = pointerX;
    let targetY = pointerY;

    if (hoverTarget) {
      const rect = hoverTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      const toCenterX = centerX - pointerX;
      const toCenterY = centerY - pointerY;
      const distance = Math.hypot(toCenterX, toCenterY);
      const influenceRadius = Math.max(58, Math.min(rect.width, rect.height) * 0.65);
      const influence = Math.max(0, 1 - distance / influenceRadius);
      const pullStrength = getMagnetStrength(hoverTarget) * influence;

      targetX += toCenterX * pullStrength;
      targetY += toCenterY * pullStrength;
    }

    const easing = hoverTarget ? 0.24 : 0.18;
    renderX += (targetX - renderX) * easing;
    renderY += (targetY - renderY) * easing;

    velocityX = renderX - previousX;
    velocityY = renderY - previousY;
    previousX = renderX;
    previousY = renderY;

    const speed = Math.hypot(velocityX, velocityY);
    const speedRatio = Math.min(speed / 15, 1);
    const angleDeg = Math.atan2(velocityY, velocityX) * (180 / Math.PI);
    const baseScale = hoverTarget ? 1.18 : 1;
    const stretch = 1 + speedRatio * 0.68;
    const squeeze = 1 - speedRatio * 0.29;

    cursor.style.transform = `translate3d(${renderX}px, ${renderY}px, 0) translate(-50%, -50%) rotate(${angleDeg}deg) scale(${(
      baseScale * stretch
    ).toFixed(3)}, ${(baseScale * squeeze).toFixed(3)})`;

    trailBudget += speed * (delta / 16);
    while (trailBudget > 7) {
      spawnSpark(renderX, renderY, -velocityX, -velocityY, speedRatio);
      trailBudget -= 7;
    }

    window.requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    const nextTarget = event.target instanceof Element ? event.target.closest(interactiveSelector) : null;
    if (nextTarget !== hoverTarget) {
      hoverTarget = nextTarget;
      setHoverState(Boolean(hoverTarget));
    }

    if (!cursorVisible) {
      showCursor();
    }
  });

  window.addEventListener("pointerleave", hideCursor);
  window.addEventListener("blur", hideCursor);

  window.requestAnimationFrame(animate);
}

function setDepthParallax() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || reducedMotionQuery.matches) {
    return;
  }

  const root = document.documentElement;
  const maxX = 1.8;
  const maxY = 2.2;

  function updateFromPointer(clientX, clientY) {
    const nx = clientX / window.innerWidth - 0.5;
    const ny = clientY / window.innerHeight - 0.5;
    root.style.setProperty("--layout-tilt-y", `${(nx * maxY).toFixed(3)}deg`);
    root.style.setProperty("--layout-tilt-x", `${(-ny * maxX).toFixed(3)}deg`);
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      updateFromPointer(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    root.style.setProperty("--layout-tilt-y", "0deg");
    root.style.setProperty("--layout-tilt-x", "0deg");
  });
}

function setAmbientVisualizer() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  let stars = [];
  let waveBands = [];
  let animationFrame = 0;
  let lastFrameTime = 0;
  let running = false;
  let width = 0;
  let height = 0;
  let horizonY = 0;

  function configureCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    horizonY = height * (width < 700 ? 0.66 : 0.62);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (horizonY * 0.9),
      radius: 0.5 + Math.random() * 1.6,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.9,
    }));
    waveBands = [
      { amp: 16, wave: 0.014, speed: 0.84, yOffset: 0, alpha: 0.3, line: 2.2 },
      { amp: 22, wave: 0.011, speed: 0.63, yOffset: 12, alpha: 0.22, line: 2.6 },
      { amp: 30, wave: 0.008, speed: 0.44, yOffset: 26, alpha: 0.17, line: 3.1 },
      { amp: 40, wave: 0.006, speed: 0.3, yOffset: 44, alpha: 0.12, line: 3.5 },
    ].map((band) => ({
      ...band,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function drawBackdrop(time) {
    const sky = context.createLinearGradient(0, 0, 0, horizonY + 40);
    sky.addColorStop(0, "rgba(9, 24, 58, 0.52)");
    sky.addColorStop(0.55, "rgba(8, 24, 56, 0.26)");
    sky.addColorStop(1, "rgba(7, 22, 48, 0.04)");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, horizonY + 60);

    const moon = context.createRadialGradient(
      width * (0.74 + Math.sin(time * 0.05) * 0.02),
      height * 0.2,
      8,
      width * 0.74,
      height * 0.2,
      width * 0.16
    );
    moon.addColorStop(0, "rgba(208, 235, 255, 0.24)");
    moon.addColorStop(0.4, "rgba(122, 182, 255, 0.14)");
    moon.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = moon;
    context.fillRect(0, 0, width, horizonY + 20);

    stars.forEach((star) => {
      const alpha = 0.18 + (Math.sin(time * star.speed + star.twinkle) * 0.5 + 0.5) * 0.35;
      context.fillStyle = `rgba(205, 229, 255, ${alpha.toFixed(3)})`;
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawWater(time) {
    const water = context.createLinearGradient(0, horizonY - 20, 0, height);
    water.addColorStop(0, "rgba(13, 40, 85, 0.44)");
    water.addColorStop(1, "rgba(4, 16, 36, 0.76)");
    context.fillStyle = water;
    context.fillRect(0, horizonY - 20, width, height - horizonY + 20);

    waveBands.forEach((band, index) => {
      context.beginPath();
      for (let x = 0; x <= width + 6; x += 6) {
        const y =
          horizonY +
          band.yOffset +
          Math.sin(x * band.wave + time * band.speed + band.phase) * band.amp +
          Math.sin(x * (band.wave * 0.54) - time * (band.speed * 0.68)) * (band.amp * 0.36);
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      const lineColor = `rgba(157, 214, 255, ${band.alpha.toFixed(3)})`;
      context.strokeStyle = lineColor;
      context.lineWidth = band.line;
      context.stroke();

      if (index <= 1) {
        context.lineTo(width, height);
        context.lineTo(0, height);
        context.closePath();
        context.fillStyle = `rgba(108, 176, 255, ${(band.alpha * 0.15).toFixed(3)})`;
        context.fill();
      }
    });
  }

  function draw(timestamp) {
    if (!running) {
      return;
    }

    if (timestamp - lastFrameTime < 1000 / 48) {
      animationFrame = requestAnimationFrame(draw);
      return;
    }

    lastFrameTime = timestamp;
    const time = timestamp * 0.001;
    context.clearRect(0, 0, width, height);
    drawBackdrop(time);
    drawWater(time);

    animationFrame = requestAnimationFrame(draw);
  }

  function start() {
    if (running || reducedMotionQuery.matches) {
      return;
    }

    canvas.style.opacity = "0.92";
    running = true;
    lastFrameTime = 0;
    animationFrame = requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(animationFrame);
  }

  function applyMotionPreference() {
    if (reducedMotionQuery.matches) {
      stop();
      canvas.style.opacity = "0";
      return;
    }

    configureCanvas();
    start();
  }

  window.addEventListener("resize", configureCanvas);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stop();
    } else {
      start();
    }
  });
  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", applyMotionPreference);
  } else if (typeof reducedMotionQuery.addListener === "function") {
    reducedMotionQuery.addListener(applyMotionPreference);
  }

  configureCanvas();
  applyMotionPreference();
}

function setAsciiDiamondRipples() {
  const canvas = document.getElementById("ascii-ripple-canvas");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const chars = ["<", ">", "/", "\\", "+", "*", "x", ":"];
  const blockedTargetsSelector = [
    ".stat",
    ".social-card",
    ".repo-card",
    ".photo-wrap",
    "a",
    "button",
    "input",
    "textarea",
    "select",
    "label",
  ].join(", ");
  const ripples = [];
  let width = 0;
  let height = 0;
  let cellSize = 15;
  let animationFrame = 0;
  let running = false;
  let lastFrameTime = 0;

  function configureCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    cellSize = width < 700 ? 13 : 15;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${cellSize}px "JetBrains Mono", monospace`;
  }

  function isBackgroundClick(target) {
    if (!(target instanceof Element)) {
      return true;
    }

    if (target.closest(blockedTargetsSelector)) {
      return false;
    }

    return true;
  }

  function plot(x, y, char, alpha) {
    if (alpha <= 0) {
      return;
    }

    const snappedX = Math.round(x / cellSize) * cellSize;
    const snappedY = Math.round(y / cellSize) * cellSize;

    context.fillStyle = `rgba(124, 206, 255, ${alpha.toFixed(3)})`;
    context.fillText(char, snappedX, snappedY);
  }

  function drawDiamondRing(centerX, centerY, radius, ageRatio, intensityScale = 1, charPhase = 0) {
    if (radius < 1) {
      return;
    }

    const fade = Math.max(0, 1 - ageRatio);
    for (let dx = -radius; dx <= radius; dx += 1) {
      const dy = radius - Math.abs(dx);
      const edgeStrength = 1 - Math.abs(dx) / radius;
      const alpha = Math.min(0.95, fade * (0.2 + edgeStrength * 0.58) * intensityScale);
      const charIndex = Math.abs(dx + dy + radius + charPhase) % chars.length;
      const mirroredCharIndex = Math.abs(dx - dy + radius + charPhase) % chars.length;

      plot(centerX + dx * cellSize, centerY + dy * cellSize, chars[charIndex], alpha);
      if (dy !== 0) {
        plot(centerX + dx * cellSize, centerY - dy * cellSize, chars[mirroredCharIndex], alpha);
      }
    }
  }

  function drawFrame(timestamp) {
    if (!running) {
      return;
    }

    const delta = Math.min(34, Math.max(8, timestamp - lastFrameTime || 16));
    lastFrameTime = timestamp;
    context.clearRect(0, 0, width, height);
    matrixCollisionMasks = [];

    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      const ripple = ripples[index];
      ripple.age += delta;

      if (ripple.age >= ripple.maxAge) {
        ripples.splice(index, 1);
        continue;
      }

      const ageRatio = ripple.age / ripple.maxAge;
      const expandedRatio = Math.pow(ageRatio, 1.22);
      const ringRadius = Math.max(1, Math.floor((ripple.maxRadius * expandedRatio) / cellSize));
      const ringRadiusPx = ringRadius * cellSize;
      const ringThicknessPx = Math.max(cellSize * 2.4, ringRadiusPx * 0.08);
      matrixCollisionMasks.push({
        x: ripple.x,
        y: ripple.y,
        innerRadius: Math.max(0, ringRadiusPx - ringThicknessPx),
        outerRadius: ringRadiusPx + ringThicknessPx,
      });
      drawDiamondRing(ripple.x, ripple.y, ringRadius, ageRatio, 1.05, 0);
      drawDiamondRing(ripple.x, ripple.y, Math.max(1, ringRadius - 1), Math.min(1, ageRatio + 0.06), 0.82, 2);
      drawDiamondRing(ripple.x, ripple.y, Math.max(1, ringRadius - 3), Math.min(1, ageRatio + 0.14), 0.58, 5);
      drawDiamondRing(
        ripple.x,
        ripple.y,
        Math.max(1, Math.floor(ringRadius * 0.6)),
        Math.min(1, ageRatio + 0.28),
        0.42,
        7
      );
    }

    if (!ripples.length) {
      running = false;
      matrixCollisionMasks = [];
      return;
    }

    animationFrame = window.requestAnimationFrame(drawFrame);
  }

  function startAnimation() {
    if (running || reducedMotionQuery.matches) {
      return;
    }

    running = true;
    lastFrameTime = 0;
    animationFrame = window.requestAnimationFrame(drawFrame);
  }

  function stopAnimation() {
    running = false;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    context.clearRect(0, 0, width, height);
    matrixCollisionMasks = [];
  }

  function queueRipple(x, y) {
    const diagonal = Math.hypot(width, height);
    ripples.push({
      x,
      y,
      age: 0,
      maxAge: 1700,
      maxRadius: diagonal * 0.42,
    });
    startAnimation();
  }

  function applyMotionPreference() {
    if (reducedMotionQuery.matches) {
      canvas.style.opacity = "0";
      stopAnimation();
      return;
    }

    canvas.style.opacity = "0.52";
    configureCanvas();
  }

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0) {
        return;
      }

      if (!isBackgroundClick(event.target)) {
        return;
      }

      queueRipple(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener("resize", configureCanvas);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopAnimation();
    }
  });
  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", applyMotionPreference);
  } else if (typeof reducedMotionQuery.addListener === "function") {
    reducedMotionQuery.addListener(applyMotionPreference);
  }

  configureCanvas();
  applyMotionPreference();
}

function getTypingTargets() {
  const selector = [
    ".brand",
    "h1",
    ".stat-value",
    ".stat-label",
    "#links h2",
    ".social-name",
    ".social-meta",
    "#discord-status",
    "#discord-activity",
    "#repos h2",
    ".repo-card h3",
    ".repo-desc",
    ".repo-meta span",
    ".repo-state",
  ].join(", ");

  return Array.from(document.querySelectorAll(selector)).filter((element) => {
    const text = element.textContent?.trim() || "";
    return text.length > 0;
  });
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function typeElementText(element, fullText) {
  element.classList.add("typing-active");
  element.textContent = "";

  for (const char of fullText) {
    element.textContent += char;
    await sleep(15 + Math.floor(Math.random() * 22));
  }

  await sleep(70);
  element.classList.remove("typing-active");
}

async function runTypingIntro() {
  if (reducedMotionQuery.matches) {
    hasCompletedTypingIntro = true;
    return;
  }

  const targets = getTypingTargets();
  if (!targets.length) {
    hasCompletedTypingIntro = true;
    return;
  }

  document.body.classList.add("is-typing-intro");
  await Promise.all(
    targets.map((element) => {
      const text = element.textContent || "";
      return typeElementText(element, text);
    })
  );

  document.body.classList.remove("is-typing-intro");
  hasCompletedTypingIntro = true;
}

async function initializePage() {
  setMobilePanelSwitcher();
  trackScrollDirection();
  setAnimatedTitle();
  setDepthParallax();
  setAmbientVisualizer();
  setRepoPaginationControls();
  let repoReflowTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(repoReflowTimer);
    repoReflowTimer = window.setTimeout(() => {
      rebuildRepoPagesAndRender();
    }, 120);
  });

  await Promise.allSettled([loadDiscordStatus(), loadRepos()]);
  await runTypingIntro();

  document.querySelectorAll(".reveal").forEach((item) => {
    item.classList.add("is-visible");
  });
  document.querySelectorAll(".stat, .social-card, .repo-card").forEach((card) => {
    card.classList.add("in-view");
  });
  window.setInterval(loadDiscordStatus, 30000);
}

initializePage();
