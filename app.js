const videos = [
  {
    id: "big-buck-bunny",
    title: "Big Buck Bunny",
    category: "动画",
    year: "2008",
    duration: "9 分钟",
    quality: "HD",
    symbol: "🐰",
    gradient: "linear-gradient(135deg,#164b55,#7cbf83 56%,#d6d580)",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "Blender Foundation 开放电影项目。一只温和的大兔子，用聪明的方法应对森林里的捣蛋鬼。"
  },
  {
    id: "elephants-dream",
    title: "Elephants Dream",
    category: "科幻",
    year: "2006",
    duration: "10 分钟",
    quality: "HD",
    symbol: "⚙",
    gradient: "linear-gradient(135deg,#222738,#675c70 55%,#c78869)",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "世界首批开放电影之一，跟随两位角色走入一座神秘而复杂的机械世界。"
  },
  {
    id: "sintel",
    title: "Sintel",
    category: "奇幻",
    year: "2010",
    duration: "15 分钟",
    quality: "HD",
    symbol: "🐉",
    gradient: "linear-gradient(135deg,#253749,#b35e46 58%,#e8c38a)",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    description: "一位年轻旅人踏上寻找小龙的旅程，关于时间、执着与告别的开放动画短片。"
  },
  {
    id: "tears-of-steel",
    title: "Tears of Steel",
    category: "科幻",
    year: "2012",
    duration: "12 分钟",
    quality: "HD",
    symbol: "🤖",
    gradient: "linear-gradient(135deg,#17293f,#326b79 50%,#de8461)",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    description: "真人表演与视觉特效结合的开放电影，人类在未来城市中尝试阻止机器人的毁灭行动。"
  },
  {
    id: "for-bigger-escapes",
    title: "For Bigger Escapes",
    category: "旅行",
    year: "2013",
    duration: "1 分钟",
    quality: "HD",
    symbol: "🏔",
    gradient: "linear-gradient(135deg,#173d61,#429bc0 55%,#e8c792)",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "一段适合快速测试移动端播放体验的高清旅行风景短片。"
  },
  {
    id: "for-bigger-joyrides",
    title: "For Bigger Joyrides",
    category: "生活",
    year: "2013",
    duration: "1 分钟",
    quality: "HD",
    symbol: "🚲",
    gradient: "linear-gradient(135deg,#3a254b,#b44d75 55%,#f0a86c)",
    source: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    description: "节奏轻快的城市生活短片，用于演示流畅播放、进度保存与续播。"
  }
];

const platforms = [
  { name: "腾讯视频", short: "腾", url: "https://v.qq.com/", color: "linear-gradient(135deg,#21d68b,#12a8ff)" },
  { name: "爱奇艺", short: "爱", url: "https://www.iqiyi.com/", color: "linear-gradient(135deg,#00c765,#78d900)" },
  { name: "优酷", short: "优", url: "https://www.youku.com/", color: "linear-gradient(135deg,#ff3f69,#2e8dff)" },
  { name: "哔哩哔哩", short: "哔", url: "https://www.bilibili.com/", color: "linear-gradient(135deg,#4bc2eb,#ed77a9)" },
  { name: "芒果 TV", short: "芒", url: "https://www.mgtv.com/", color: "linear-gradient(135deg,#ff8a1f,#ffca3a)" }
];

const state = {
  category: "全部",
  query: "",
  view: "all",
  currentId: null,
  favorites: load("gy-favorites", []),
  history: load("gy-history", {}),
  deferredInstall: null
};

const $ = selector => document.querySelector(selector);
const grid = $("#videoGrid");
const player = $("#videoPlayer");
const playerDialog = $("#playerDialog");
const installDialog = $("#installDialog");

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function progressFor(id) {
  const item = state.history[id];
  if (!item || !item.duration) return 0;
  return Math.min(100, Math.round((item.time / item.duration) * 100));
}

function renderFilters() {
  const categories = ["全部", ...new Set(videos.map(video => video.category))];
  $("#filters").innerHTML = categories.map(category => `
    <button class="filter-chip ${state.category === category ? "active" : ""}" type="button" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>
  `).join("");
}

function filteredVideos() {
  const query = state.query.trim().toLowerCase();
  let result = videos.filter(video => state.category === "全部" || video.category === state.category);
  if (query) result = result.filter(video => `${video.title} ${video.category} ${video.year}`.toLowerCase().includes(query));
  if (state.view === "favorites") result = result.filter(video => state.favorites.includes(video.id));
  if (state.view === "recent") result = result.filter(video => state.history[video.id]).sort((a, b) => state.history[b.id].updated - state.history[a.id].updated);
  return result;
}

function cardTemplate(video) {
  const favorite = state.favorites.includes(video.id);
  const progress = progressFor(video.id);
  return `
    <article class="video-card">
      <button class="video-poster" type="button" data-play="${video.id}" data-symbol="${video.symbol}" style="--card-gradient:${video.gradient}" aria-label="播放 ${escapeHTML(video.title)}">
        <span class="poster-topline"><span class="quality-badge">${video.quality}</span><span class="duration">${video.duration}</span></span>
        <span class="play-circle" aria-hidden="true">▶</span>
        ${progress > 0 ? `<span class="progress-track"><span class="progress-fill" style="width:${progress}%"></span></span>` : ""}
      </button>
      <div class="card-info">
        <div><h3>${escapeHTML(video.title)}</h3><p>${video.category} · ${video.year}</p></div>
        <button class="card-favorite ${favorite ? "active" : ""}" type="button" data-favorite="${video.id}" aria-label="${favorite ? "取消收藏" : "收藏"} ${escapeHTML(video.title)}">${favorite ? "♥" : "♡"}</button>
      </div>
    </article>`;
}

function renderVideos() {
  const result = filteredVideos();
  grid.innerHTML = result.map(cardTemplate).join("");
  $("#resultCount").textContent = `${result.length} 部`;
  $("#emptyState").classList.toggle("hidden", result.length > 0);
  const titles = { all: "精选片库", favorites: "我的收藏", recent: "最近观看" };
  $("#libraryTitle").textContent = titles[state.view];
}

function renderHistory() {
  const history = Object.entries(state.history)
    .sort(([, a], [, b]) => b.updated - a.updated)
    .slice(0, 4)
    .map(([id]) => videos.find(video => video.id === id))
    .filter(Boolean);
  $("#continueSection").classList.toggle("hidden", history.length === 0);
  $("#continueList").innerHTML = history.map(video => `
    <button class="continue-card" type="button" data-play="${video.id}">
      <span class="continue-thumb" style="--card-gradient:${video.gradient}">${video.symbol}</span>
      <span class="continue-copy"><strong>${escapeHTML(video.title)}</strong><span>已观看 ${progressFor(video.id)}% · 点击继续</span></span>
    </button>`).join("");
}

function renderPlatforms() {
  $("#platformGrid").innerHTML = platforms.map(platform => `
    <a class="platform-card" href="${platform.url}" target="_blank" rel="noopener noreferrer">
      <span class="platform-logo" style="--platform-color:${platform.color}">${platform.short}</span>
      <span><strong>${platform.name}</strong><br><small>官方服务 ↗</small></span>
    </a>`).join("");
}

function render() {
  renderFilters();
  renderVideos();
  renderHistory();
}

function openPlayer(id) {
  const video = videos.find(item => item.id === id);
  if (!video) return;
  state.currentId = id;
  player.src = video.source;
  $("#playerTitle").textContent = video.title;
  $("#playerMeta").textContent = `${video.category.toUpperCase()} · ${video.year} · ${video.quality}`;
  $("#playerDescription").textContent = video.description;
  updatePlayerFavorite();
  if (!playerDialog.open) playerDialog.showModal();
  player.addEventListener("loadedmetadata", restoreProgress, { once: true });
  player.play().catch(() => {});
}

function restoreProgress() {
  const record = state.history[state.currentId];
  if (record && record.time > 3 && record.time < player.duration - 8) player.currentTime = record.time;
}

function persistProgress() {
  if (!state.currentId || !Number.isFinite(player.duration) || player.duration <= 0) return;
  state.history[state.currentId] = { time: player.currentTime, duration: player.duration, updated: Date.now() };
  save("gy-history", state.history);
}

function closePlayer() {
  persistProgress();
  player.pause();
  player.removeAttribute("src");
  player.load();
  playerDialog.close();
  render();
}

function toggleFavorite(id) {
  const index = state.favorites.indexOf(id);
  if (index >= 0) state.favorites.splice(index, 1);
  else state.favorites.unshift(id);
  save("gy-favorites", state.favorites);
  updatePlayerFavorite();
  render();
  showToast(index >= 0 ? "已取消收藏" : "已加入收藏");
}

function updatePlayerFavorite() {
  const active = state.favorites.includes(state.currentId);
  $("#favoriteButton").classList.toggle("active", active);
  $("#favoriteButton").textContent = active ? "♥" : "♡";
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function setView(view) {
  state.view = view;
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  renderVideos();
  $("#library").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", event => {
  const playButton = event.target.closest("[data-play]");
  const favorite = event.target.closest("[data-favorite]");
  const category = event.target.closest("[data-category]");
  const view = event.target.closest("[data-view]");
  const scroll = event.target.closest("[data-scroll]");
  if (playButton) openPlayer(playButton.dataset.play);
  if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favorite); }
  if (category) { state.category = category.dataset.category; render(); }
  if (view) setView(view.dataset.view);
  if (scroll) document.getElementById(scroll.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
});

$("#searchInput").addEventListener("input", event => { state.query = event.target.value; renderVideos(); });
$("#closePlayer").addEventListener("click", closePlayer);
playerDialog.addEventListener("click", event => { if (event.target === playerDialog) closePlayer(); });
player.addEventListener("timeupdate", () => { if (Math.floor(player.currentTime) % 5 === 0) persistProgress(); });
player.addEventListener("ended", persistProgress);
$("#favoriteButton").addEventListener("click", () => toggleFavorite(state.currentId));
$("#clearHistory").addEventListener("click", () => { state.history = {}; save("gy-history", state.history); render(); showToast("观看记录已清除"); });

$("#installButton").addEventListener("click", async () => {
  if (state.deferredInstall) {
    state.deferredInstall.prompt();
    await state.deferredInstall.userChoice;
    state.deferredInstall = null;
    return;
  }
  installDialog.showModal();
});
$("#closeInstall").addEventListener("click", () => installDialog.close());
installDialog.addEventListener("click", event => { if (event.target === installDialog) installDialog.close(); });
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.deferredInstall = event; });

if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
  $("#installButton").classList.add("hidden");
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

renderPlatforms();
render();
