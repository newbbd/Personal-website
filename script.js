const repoGrid = document.getElementById("repo-grid");
const githubUser = "newbbd";
const reposEndpoint = `https://api.github.com/users/${githubUser}/repos`;
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
  setCardScrollAnimations();
}

async function loadRepos() {
  try {
    let page = 1;
    const perPage = 100;
    const allRepos = [];

    while (true) {
      const url = `${reposEndpoint}?per_page=${perPage}&page=${page}&type=owner&sort=updated`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Unable to load repositories.");
      }

      const repos = await response.json();
      allRepos.push(...repos);

      if (repos.length < perPage) {
        break;
      }

      page += 1;
    }

    const profileResponse = await fetch(userEndpoint);
    if (!profileResponse.ok) {
      throw new Error("Unable to load profile.");
    }

    const profile = await profileResponse.json();
    setStats(profile, allRepos);
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

  const interactiveElements = document.querySelectorAll("a, button, [role='button']");
  const glyphCharset = ["0", "1", "<", ">", "[", "]", "{", "}"];

  let cursorVisible = false;
  let mouseX = 0;
  let mouseY = 0;
  let lastGlyphSpawn = 0;

  function spawnGlyph(x, y) {
    const glyph = document.createElement("span");
    glyph.className = "glyph-particle";
    glyph.textContent = glyphCharset[Math.floor(Math.random() * glyphCharset.length)];
    glyph.style.left = `${x + (Math.random() - 0.5) * 6}px`;
    glyph.style.top = `${y + (Math.random() - 0.5) * 6}px`;
    document.body.appendChild(glyph);
    glyph.addEventListener("animationend", () => {
      glyph.remove();
    });
  }

  function setHoverState(isHovering) {
    cursor.classList.toggle("is-hovering", isHovering);
  }

  function showCursor() {
    cursorVisible = true;
    cursor.style.opacity = "1";
  }

  function hideCursor() {
    cursorVisible = false;
    cursor.style.opacity = "0";
  }

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
    const now = performance.now();
    if (now - lastGlyphSpawn > 46) {
      spawnGlyph(mouseX, mouseY);
      lastGlyphSpawn = now;
    }

    if (!cursorVisible) {
      showCursor();
    }
  });

  window.addEventListener("pointerleave", hideCursor);
  window.addEventListener("blur", hideCursor);

  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      setHoverState(true);
    });
    element.addEventListener("mouseleave", () => setHoverState(false));
  });
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

    columns.forEach((column, index) => {
      const x = index * fontSize;
      const y = column.y * fontSize;
      const char = charset[Math.floor(Math.random() * charset.length)];

      if (Math.random() < column.brightChance) {
        context.fillStyle = "rgba(231, 255, 239, 0.92)";
        context.fillText(char, x, y - fontSize);
      }

      context.fillStyle = `rgba(124, 255, 171, ${0.25 + Math.random() * 0.5})`;
      context.fillText(char, x, y);

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

trackScrollDirection();
setAnimatedTitle();
setCustomCursor();
setMatrixRain();
setRevealAnimations();
setCardScrollAnimations();
setProfileEasterEgg();
loadDiscordStatus();
setInterval(loadDiscordStatus, 30000);
loadRepos();
