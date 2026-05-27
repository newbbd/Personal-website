const githubUser = "newbbd";
const discordLanyardId = "1386016503052243054";

const repoGrid = document.getElementById("repo-grid");
const repoStat = document.getElementById("stat-repos");
const followerStat = document.getElementById("stat-followers");
const starStat = document.getElementById("stat-stars");
const discordStatus = document.getElementById("discord-status");
const discordActivity = document.getElementById("discord-activity");
const discordIndicator = document.getElementById("discord-indicator");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function renderRepoState(message) {
  if (!repoGrid) {
    return;
  }

  repoGrid.innerHTML = `<p class="state-message">${escapeHtml(message)}</p>`;
}

function getRepoDescription(repo) {
  return repo.description || "No description added yet.";
}

function renderRepos(repos) {
  if (!repoGrid) {
    return;
  }

  const visibleRepos = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 6);

  if (!visibleRepos.length) {
    renderRepoState("No public repositories found yet.");
    return;
  }

  repoGrid.innerHTML = visibleRepos
    .map((repo) => {
      const language = repo.language || "Code";
      const description = getRepoDescription(repo);

      return `
        <a class="repo-card" href="${repo.html_url}" target="_blank" rel="noreferrer">
          <h3>${escapeHtml(repo.name)}</h3>
          <p class="repo-desc">${escapeHtml(description)}</p>
          <div class="repo-meta">
            <span>${escapeHtml(language)}</span>
            <span>${formatNumber(repo.stargazers_count)} stars</span>
            <span>Updated ${formatDate(repo.pushed_at)}</span>
          </div>
        </a>
      `;
    })
    .join("");
}

function updateGitHubStats(profile, repos) {
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

  setText(repoStat, formatNumber(profile.public_repos));
  setText(followerStat, formatNumber(profile.followers));
  setText(starStat, formatNumber(totalStars));
}

async function loadGitHubData() {
  try {
    const [profileResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${githubUser}`, { cache: "no-store" }),
      fetch(`https://api.github.com/users/${githubUser}/repos?per_page=100&sort=updated`, {
        cache: "no-store",
      }),
    ]);

    if (!profileResponse.ok || !reposResponse.ok) {
      throw new Error("GitHub request failed");
    }

    const [profile, repos] = await Promise.all([profileResponse.json(), reposResponse.json()]);
    updateGitHubStats(profile, repos);
    renderRepos(repos);
  } catch (error) {
    renderRepoState("GitHub data is unavailable right now.");
  }
}

function formatDiscordStatus(status) {
  const labels = {
    online: "Online",
    idle: "Idle",
    dnd: "Do not disturb",
    offline: "Offline",
  };

  return labels[status] || "Offline";
}

function getDiscordActivity(data) {
  if (data.listening_to_spotify && data.spotify?.song) {
    return `Listening to ${data.spotify.song}`;
  }

  const customStatus = data.activities?.find((activity) => activity.type === 4)?.state;
  const game = data.activities?.find((activity) => activity.type === 0)?.name;

  return customStatus || game || "No current activity";
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
      throw new Error("Discord status request failed");
    }

    const payload = await response.json();
    const data = payload.data;

    if (!payload.success || !data) {
      throw new Error("Discord status unavailable");
    }

    const status = data.discord_status || "offline";

    discordStatus.textContent = formatDiscordStatus(status);
    discordActivity.textContent = getDiscordActivity(data);
    discordIndicator.className = `status-dot is-${status}`;
  } catch (error) {
    discordStatus.textContent = "Status unavailable";
    discordActivity.textContent = "Discord activity could not be loaded.";
    discordIndicator.className = "status-dot";
  }
}

loadGitHubData();
loadDiscordStatus();
window.setInterval(loadDiscordStatus, 60000);
