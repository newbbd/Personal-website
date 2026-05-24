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
const profileTrigger = document.getElementById("profile-trigger");
const intelModal = document.getElementById("visitor-intel");
const intelOutput = document.getElementById("intel-output");
const intelClose = document.getElementById("intel-close");

const discordLanyardId = "1386016503052243054";

let lastScrollY = window.scrollY;
let scrollDirection = "down";
let cardObserver = null;
let profileClickCount = 0;
let profileClickResetTimer = 0;
let hasCompletedTypingIntro = false;
let matrixCollisionMasks = [];

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

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

function renderRepos(repos) {
  if (!repos.length) {
    renderState("no repositories found yet.");
    return;
  }

  const sortedRepos = repos.sort(
    (a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
  );

  const cards = sortedRepos
    .map((repo) => {
      const description = repo.description
        ? repo.description
        : "no description added yet.";
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
  if (hasCompletedTypingIntro) {
    setCardScrollAnimations();
  }
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

function setMatrixRain() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const charset = "01<>[]{}+*#^~=|/ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let columns = [];
  let animationFrame = 0;
  let lastFrameTime = 0;
  let running = false;
  let width = 0;
  let height = 0;
  let fontSize = 15;

  function configureCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    fontSize = width < 700 ? 13 : 15;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.font = `${fontSize}px "JetBrains Mono", monospace`;

    const columnCount = Math.ceil(width / fontSize);
    columns = Array.from({ length: columnCount }, () => ({
      y: Math.random() * -120,
      speed: 0.55 + Math.random() * 1.2,
      brightChance: 0.08 + Math.random() * 0.1,
    }));
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
    context.fillStyle = "rgba(1, 10, 4, 0.2)";
    context.fillRect(0, 0, width, height);

    function isMaskedByRipple(x, y) {
      for (const mask of matrixCollisionMasks) {
        const distance = Math.abs(x - mask.x) + Math.abs(y - mask.y);
        if (distance >= mask.innerRadius && distance <= mask.outerRadius) {
          return true;
        }
      }
      return false;
    }

    columns.forEach((column, index) => {
      const x = index * fontSize;
      const y = column.y * fontSize;
      const char = charset[Math.floor(Math.random() * charset.length)];

      const shouldMaskMain = isMaskedByRipple(x, y);
      const shouldMaskLead = isMaskedByRipple(x, y - fontSize);

      if (!shouldMaskLead && Math.random() < column.brightChance) {
        context.fillStyle = "rgba(231, 255, 239, 0.92)";
        context.fillText(char, x, y - fontSize);
      }

      if (!shouldMaskMain) {
        context.fillStyle = `rgba(124, 255, 171, ${0.25 + Math.random() * 0.5})`;
        context.fillText(char, x, y);
      }

      column.y += column.speed;

      if (y > height + fontSize * 10 && Math.random() > 0.965) {
        column.y = Math.random() * -60;
        column.speed = 0.55 + Math.random() * 1.2;
      }
    });

    animationFrame = requestAnimationFrame(draw);
  }

  function start() {
    if (running || reducedMotionQuery.matches) {
      return;
    }

    canvas.style.opacity = "0.5";
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
    ".profile-trigger",
    ".intel-panel",
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

    context.fillStyle = `rgba(126, 255, 176, ${alpha.toFixed(3)})`;
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

    canvas.style.opacity = "0.72";
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

      if (intelModal?.classList.contains("is-open")) {
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

function safeValue(value, fallback = "unavailable") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "unavailable";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function getWebGlRenderer() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!context) {
    return "unavailable";
  }

  const extension = context.getExtension("WEBGL_debug_renderer_info");
  if (!extension) {
    return "masked by browser";
  }

  const vendor = context.getParameter(extension.UNMASKED_VENDOR_WEBGL);
  const renderer = context.getParameter(extension.UNMASKED_RENDERER_WEBGL);
  return `${safeValue(vendor)} | ${safeValue(renderer)}`;
}

async function getPermissionSnapshot() {
  if (!navigator.permissions || typeof navigator.permissions.query !== "function") {
    return "Permissions API unavailable";
  }

  const permissionNames = ["geolocation", "notifications", "camera", "microphone"];
  const results = await Promise.allSettled(
    permissionNames.map((name) => navigator.permissions.query({ name }))
  );

  return results
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return `${permissionNames[index]}=${result.value.state}`;
      }
      return `${permissionNames[index]}=unsupported`;
    })
    .join(", ");
}

async function getBatterySnapshot() {
  if (!navigator.getBattery) {
    return "Battery API unavailable";
  }

  try {
    const battery = await navigator.getBattery();
    const levelPercent = Math.round(battery.level * 100);
    return `${levelPercent}% | charging=${battery.charging}`;
  } catch (error) {
    return "unavailable";
  }
}

async function getIpSnapshot() {
  const ipResult = {
    ip: "unavailable",
    city: "unavailable",
    region: "unavailable",
    country: "unavailable",
    org: "unavailable",
    asn: "unavailable",
    timezone: "unavailable",
    latitude: "unavailable",
    longitude: "unavailable",
  };

  try {
    const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      ipResult.ip = safeValue(data.ip);
      ipResult.city = safeValue(data.city);
      ipResult.region = safeValue(data.region);
      ipResult.country = safeValue(data.country_name);
      ipResult.org = safeValue(data.org);
      ipResult.asn = safeValue(data.asn);
      ipResult.timezone = safeValue(data.timezone);
      ipResult.latitude = safeValue(data.latitude);
      ipResult.longitude = safeValue(data.longitude);
      return ipResult;
    }
  } catch (error) {
    // Fall through to secondary endpoint.
  }

  try {
    const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      ipResult.ip = safeValue(data.ip);
    }
  } catch (error) {
    // Keep fallback values.
  }

  return ipResult;
}

async function collectVisitorIntel() {
  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const memoryInfo = performance.memory || null;
  const ipInfo = await getIpSnapshot();
  const permissions = await getPermissionSnapshot();
  const battery = await getBatterySnapshot();

  const fields = [
    `timestamp: ${new Date().toISOString()}`,
    `ip: ${ipInfo.ip}`,
    `location: ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}`,
    `org: ${ipInfo.org}`,
    `asn: ${ipInfo.asn}`,
    `ip-timezone: ${ipInfo.timezone}`,
    `coords: ${ipInfo.latitude}, ${ipInfo.longitude}`,
    "",
    `user-agent: ${safeValue(navigator.userAgent)}`,
    `platform: ${safeValue(navigator.platform)}`,
    `languages: ${safeValue(navigator.languages?.join(", "))}`,
    `hardware-threads: ${safeValue(navigator.hardwareConcurrency)}`,
    `device-memory-gb: ${safeValue(navigator.deviceMemory)}`,
    `max-touch-points: ${safeValue(navigator.maxTouchPoints)}`,
    `cookies-enabled: ${safeValue(navigator.cookieEnabled)}`,
    `do-not-track: ${safeValue(navigator.doNotTrack)}`,
    `java-enabled: ${
      typeof navigator.javaEnabled === "function" ? safeValue(navigator.javaEnabled()) : "unsupported"
    }`,
    `online: ${safeValue(navigator.onLine)}`,
    `connection: ${
      connection
        ? `type=${safeValue(connection.type)}, effective=${safeValue(
            connection.effectiveType
          )}, downlink=${safeValue(connection.downlink)}Mbps, rtt=${safeValue(
            connection.rtt
          )}ms, saveData=${safeValue(connection.saveData)}`
        : "unavailable"
    }`,
    "",
    `screen: ${window.screen.width}x${window.screen.height} @ ${safeValue(
      window.devicePixelRatio
    )}x`,
    `viewport: ${window.innerWidth}x${window.innerHeight}`,
    `color-depth: ${safeValue(window.screen.colorDepth)}`,
    `timezone: ${safeValue(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
    `local-time: ${new Date().toString()}`,
    `prefers-color-scheme: ${
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }`,
    `prefers-reduced-motion: ${safeValue(reducedMotionQuery.matches)}`,
    "",
    `referrer: ${safeValue(document.referrer, "direct")}`,
    `history-length: ${safeValue(window.history.length)}`,
    `plugins: ${safeValue(navigator.plugins?.length)}`,
    `storage-local: ${safeValue(!!window.localStorage)}`,
    `storage-session: ${safeValue(!!window.sessionStorage)}`,
    `permissions: ${permissions}`,
    `battery: ${battery}`,
    `gpu: ${getWebGlRenderer()}`,
    `memory-limit: ${memoryInfo ? formatBytes(memoryInfo.jsHeapSizeLimit) : "unavailable"}`,
    `memory-used: ${memoryInfo ? formatBytes(memoryInfo.usedJSHeapSize) : "unavailable"}`,
  ];

  return fields.join("\n");
}

function closeVisitorIntel() {
  if (!intelModal) {
    return;
  }

  intelModal.classList.remove("is-open");
  intelModal.setAttribute("aria-hidden", "true");
}

async function openVisitorIntel() {
  if (!intelModal || !intelOutput) {
    return;
  }

  intelModal.classList.add("is-open");
  intelModal.setAttribute("aria-hidden", "false");
  intelOutput.textContent = "Collecting intel...";

  const output = await collectVisitorIntel();
  intelOutput.textContent = output;
}

function resetProfileClickCounter() {
  profileClickCount = 0;
  if (profileClickResetTimer) {
    window.clearTimeout(profileClickResetTimer);
    profileClickResetTimer = 0;
  }
}

function setProfileEasterEgg() {
  if (!profileTrigger) {
    return;
  }

  const clickWindowMs = 1400;
  const requiredClicks = 5;

  function registerProfileClick() {
    profileClickCount += 1;
    if (profileClickResetTimer) {
      window.clearTimeout(profileClickResetTimer);
    }

    profileClickResetTimer = window.setTimeout(() => {
      resetProfileClickCounter();
    }, clickWindowMs);

    if (profileClickCount >= requiredClicks) {
      resetProfileClickCounter();
      openVisitorIntel();
    }
  }

  profileTrigger.addEventListener("click", registerProfileClick);
  profileTrigger.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      registerProfileClick();
    }
  });

  if (intelClose) {
    intelClose.addEventListener("click", closeVisitorIntel);
  }

  if (intelModal) {
    intelModal.addEventListener("click", (event) => {
      if (event.target === intelModal) {
        closeVisitorIntel();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeVisitorIntel();
    }
  });
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
  trackScrollDirection();
  setAnimatedTitle();
  setCustomCursor();
  setMatrixRain();
  setAsciiDiamondRipples();
  setProfileEasterEgg();

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
