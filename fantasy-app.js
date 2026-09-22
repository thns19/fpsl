function getPlayerMatchPoints(player) {
  return (player.lastFiveMatches || [])
    .map((match) => typeof match === 'number' ? match : match.fantasyPoints)
    .filter((points) => Number.isFinite(Number(points)))
    .map(Number);
}

function getPlayerForm(player) {
  const points = getPlayerMatchPoints(player).slice(-5);
  if (points.length === 0) return null;
  return points.reduce((total, pointsInMatch) => total + pointsInMatch, 0) / points.length;
}

function getPlayerFantasyPoints(player) {
  return getPlayerMatchPoints(player).reduce((total, pointsInMatch) => total + pointsInMatch, 0);
}

function formatPlayerForm(player) {
  const form = getPlayerForm(player);
  return form === null ? '\u2014' : form.toFixed(1);
}

const FANTASY_DB_URL = 'https://ptchbl4-default-rtdb.europe-west1.firebasedatabase.app/.json';
const FANTASY_ADMIN_USERNAME = 'pitchball';
let fantasyDbCache = null;
let fantasyMatchday = null;
let fantasyMatchdays = [];
let selectedFantasyMatchdayId = null;

async function getFantasyDb() {
  if (fantasyDbCache) return fantasyDbCache;
  const response = await fetch(FANTASY_DB_URL);
  if (!response.ok) throw new Error('Unable to connect to the account service.');
  fantasyDbCache = await response.json();
  return fantasyDbCache;
}

async function loadFantasyState() {
  try {
    let db = await getFantasyDb();
    fantasyMatchdays = Array.isArray(db.fantasyMatchdays)
      ? db.fantasyMatchdays
      : db.fantasyMatchday ? [db.fantasyMatchday] : [];
    fantasyMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active') || null;
    selectedFantasyMatchdayId = db.fantasyAdminState?.selectedMatchdayId || fantasyMatchdays.at(-1)?.id || null;
    if (!Array.isArray(db.fantasyMatchdays) && fantasyMatchdays.length > 0) {
      const { fantasyMatchday: legacyMatchday, ...currentDb } = db;
      db = { ...currentDb, fantasyMatchdays, fantasyAdminState: { selectedMatchdayId: selectedFantasyMatchdayId } };
      await saveFantasyDb(db);
    }
    applyAggregatedPlayerStats(fantasyMatchdays);
  } catch (error) {
    fantasyMatchday = null;
    fantasyMatchdays = [];
  }
}

function applyAggregatedPlayerStats(matchdays) {
  const totals = {};
  matchdays.forEach((matchday) => {
    Object.entries(matchday.playerStats || {}).forEach(([playerId, stats]) => {
      const total = totals[playerId] || { goals: 0, ownGoals: 0, mvps: 0, points: [] };
      total.goals += Number(stats.goals) || 0;
      total.ownGoals += Number(stats.ownGoals) || 0;
      total.mvps += Number(stats.mvps) || 0;
      if (Number.isFinite(Number(stats.matchdayPoints))) total.points.push(Number(stats.matchdayPoints));
      totals[playerId] = total;
    });
  });
  FANTASY_PLAYERS.forEach((player) => {
    const total = totals[player.id] || { goals: 0, ownGoals: 0, mvps: 0, points: [] };
    Object.assign(player, {
      goals: total.goals,
      ownGoals: total.ownGoals,
      mvps: total.mvps,
      lastFiveMatches: total.points.slice(-5),
      matchdayPoints: total.points[total.points.length - 1] || 0
    });
  });
}

function recalculateManagerTotals(users, matchdays) {
  Object.keys(users).forEach((accountKey) => {
    const user = users[accountKey];
    if (!Array.isArray(user.fantasyTeam)) return;
    const fantasyPoints = matchdays
      .filter((matchday) => matchday.status === 'ended')
      .reduce((total, matchday) => total + user.fantasyTeam.reduce((teamTotal, playerId) => (
        teamTotal + (Number(matchday.playerStats?.[playerId]?.matchdayPoints) || 0)
      ), 0), 0);
    const lastMatchday = matchdays.filter((matchday) => matchday.status === 'ended').at(-1);
    users[accountKey] = {
      ...user,
      fantasyPoints,
      matchday: lastMatchday?.id || 0
    };
  });
}

async function saveFantasyDb(db) {
  const response = await fetch(FANTASY_DB_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(db)
  });
  if (!response.ok) throw new Error('Unable to save fantasy data.');
  fantasyDbCache = db;
}

async function saveSelectedMatchdayId(matchdayId) {
  const db = await getFantasyDb();
  await saveFantasyDb({
    ...db,
    fantasyAdminState: {
      ...(db.fantasyAdminState || {}),
      selectedMatchdayId: matchdayId
    }
  });
}

function isFantasyAdmin() {
  const user = getCurrentFantasyUser();
  return Boolean(user && (user.isAdmin || user.username.toLowerCase() === FANTASY_ADMIN_USERNAME));
}

function transfersAreLocked() {
  return fantasyMatchday?.status === 'active' && !isFantasyAdmin();
}

function showTransferLockMessage() {
  alert('Transfers are locked while the matchday is active.');
}

async function hashFantasyPassword(password) {
  const data = new TextEncoder().encode(`${password}psl5salt`);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function setFantasyAuthError(message) {
  const error = document.getElementById('fantasy-auth-error');
  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
}

function setFantasyAuthMode(mode) {
  const isRegistering = mode === 'register';
  const form = document.getElementById('fantasy-auth-form');
  const title = document.getElementById('fantasy-auth-title');
  const submit = document.getElementById('fantasy-auth-submit');
  const username = document.getElementById('fantasy-username');
  const email = document.getElementById('fantasy-email');
  const registerTab = document.getElementById('fantasy-register-tab');
  const signInTab = document.getElementById('fantasy-sign-in-tab');

  if (!form || !title || !submit || !username || !email || !registerTab || !signInTab) return;
  form.dataset.mode = mode;
  title.textContent = isRegistering ? 'Create your account' : 'Sign in to continue';
  submit.textContent = isRegistering ? 'Create account' : 'Sign in';
  email.required = isRegistering;
  email.closest('div').hidden = !isRegistering;
  username.placeholder = isRegistering ? 'Choose a username' : 'Username or email';
  registerTab.classList.toggle('active', isRegistering);
  signInTab.classList.toggle('active', !isRegistering);
  setFantasyAuthError('');
}

async function submitFantasyAuth(form) {
  const mode = form.dataset.mode || 'login';
  const usernameOrEmail = document.getElementById('fantasy-username').value.trim();
  const email = document.getElementById('fantasy-email').value.trim().toLowerCase();
  const password = document.getElementById('fantasy-password').value;
  const submit = document.getElementById('fantasy-auth-submit');

  setFantasyAuthError('');
  if (!usernameOrEmail || !password || (mode === 'register' && !email)) {
    setFantasyAuthError('Please fill in all required fields.');
    return;
  }
  if (mode === 'register' && password.length < 6) {
    setFantasyAuthError('Password must be at least 6 characters.');
    return;
  }

  submit.disabled = true;
  submit.textContent = mode === 'register' ? 'Creating account...' : 'Signing in...';
  try {
    const db = await getFantasyDb();
    const users = db.users || {};
    const passwordHash = await hashFantasyPassword(password);

    if (mode === 'register') {
      const username = usernameOrEmail;
      const usernameKey = username.toLowerCase();
      const usernameTaken = Boolean(users[usernameKey]);
      const emailTaken = Object.values(users).some((user) => String(user.email || '').toLowerCase() === email);
      if (username.length < 2) {
        setFantasyAuthError('Username must be at least 2 characters.');
        return;
      }
      if (usernameTaken) {
        setFantasyAuthError('That username is already registered.');
        return;
      }
      if (emailTaken) {
        setFantasyAuthError('That email is already registered.');
        return;
      }
      users[usernameKey] = { username, email, passHash: passwordHash, avatar: null, joined: new Date().toISOString() };
      const response = await fetch(FANTASY_DB_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...db, users })
      });
      if (!response.ok) throw new Error('Unable to create the account.');
      fantasyDbCache = { ...db, users };
      localStorage.setItem(FANTASY_SESSION_KEY, JSON.stringify({ username, email, avatar: null, isAdmin: username.toLowerCase() === FANTASY_ADMIN_USERNAME }));
    } else {
      const user = Object.values(users).find((entry) =>
        entry.username.toLowerCase() === usernameOrEmail.toLowerCase() || String(entry.email || '').toLowerCase() === usernameOrEmail.toLowerCase()
      );
      if (!user || user.passHash !== passwordHash) {
        setFantasyAuthError('Incorrect username/email or password.');
        return;
      }
      localStorage.setItem(FANTASY_SESSION_KEY, JSON.stringify({ username: user.username, email: user.email, avatar: user.avatar || null, isAdmin: user.username.toLowerCase() === FANTASY_ADMIN_USERNAME }));
    }

    document.getElementById('fantasy-auth-overlay').classList.remove('visible');
    window.location.reload();
  } catch (error) {
    setFantasyAuthError(error.message || 'Connection error. Please try again.');
  } finally {
    submit.disabled = false;
    submit.textContent = mode === 'register' ? 'Create account' : 'Sign in';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadFantasyState();
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    if (link.href === window.location.href || link.getAttribute('href') === window.location.pathname.split('/').pop()) {
      link.classList.add('active');
    }
  });

  const signInButton = document.getElementById('sign-in-button');
  if (signInButton) {
    signInButton.addEventListener('click', () => {
      const user = getCurrentFantasyUser();
      if (user) {
        localStorage.removeItem(FANTASY_SESSION_KEY);
        signInButton.textContent = 'Sign in';
        window.location.reload();
        return;
      }
      const overlay = document.getElementById('fantasy-auth-overlay');
      if (overlay) {
        overlay.classList.add('visible');
      }
    });
  }

  const authForm = document.getElementById('fantasy-auth-form');
  if (authForm) {
    setFantasyAuthMode('login');
    authForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await submitFantasyAuth(authForm);
    });
  }

  document.getElementById('fantasy-sign-in-tab')?.addEventListener('click', () => setFantasyAuthMode('login'));
  document.getElementById('fantasy-register-tab')?.addEventListener('click', () => setFantasyAuthMode('register'));

  const authClose = document.getElementById('close-auth');
  if (authClose) {
    authClose.addEventListener('click', () => {
      const overlay = document.getElementById('fantasy-auth-overlay');
      if (overlay) {
        overlay.classList.remove('visible');
      }
    });
  }

  document.getElementById('close-player-picker')?.addEventListener('click', () => {
    document.getElementById('player-picker').hidden = true;
  });

  if (signInButton && getCurrentFantasyUser()) {
    signInButton.textContent = `Signed in: ${getCurrentFantasyUser().username}`;
  }

  if (isFantasyAdmin()) {
    document.querySelectorAll('.topnav').forEach((nav) => {
      if (!nav.querySelector('[data-admin-link]')) {
        const adminLink = document.createElement('a');
        adminLink.href = 'fantasy-admin.html';
        adminLink.className = 'nav-link';
        adminLink.dataset.adminLink = 'true';
        adminLink.textContent = 'Admin';
        nav.appendChild(adminLink);
      }
    });
  }

  if (document.body.dataset.page === 'build') {
    initBuildPage();
  }

  if (document.body.dataset.page === 'leaderboard') {
    renderLeaderboard();
  }

  if (document.body.dataset.page === 'players') {
    renderPlayersTable();
  }

  if (document.body.dataset.page === 'admin') {
    initAdminPage();
  }
});

function initBuildPage() {
  const user = getCurrentFantasyUser();
  const guard = document.getElementById('auth-guard');
  const saveButton = document.getElementById('saveTeam');

  if (!user) {
    if (guard) {
      guard.classList.add('visible');
    }
    if (saveButton) {
      saveButton.disabled = true;
    }
  }

  renderBuildBoard();
}

function ensureFantasyLogin() {
  if (!getCurrentFantasyUser()) {
    const overlay = document.getElementById('fantasy-auth-overlay');
    if (overlay) {
      overlay.classList.add('visible');
    }
    return false;
  }
  return true;
}

function renderBuildBoard() {
  const teamSummary = document.getElementById('teamSummary');
  const teamTotalLabel = document.getElementById('teamTotal');
  const teamCountLabel = document.getElementById('teamCount');
  const budgetBar = document.getElementById('budgetBar');

  if (!teamSummary) return;

  const storedTeam = getStoredFantasyTeam();
  const team = Array.from({ length: FANTASY_TEAM_SIZE }, (_, index) => storedTeam[index] || null);
  const occupiedTeam = team.filter(Boolean);
  const total = getTeamTotal(occupiedTeam);
  const remaining = FANTASY_TEAM_LIMIT - total;

  if (teamTotalLabel) {
    teamTotalLabel.textContent = formatMoney(total);
    teamTotalLabel.className = remaining >= 0 ? 'budget-value under' : 'budget-value over';
  }

  if (teamCountLabel) {
    teamCountLabel.textContent = `${occupiedTeam.length}/${FANTASY_TEAM_SIZE}`;
  }

  if (budgetBar) {
    const usage = Math.min((total / FANTASY_TEAM_LIMIT) * 100, 100);
    budgetBar.style.width = `${usage}%`;
  }

  const selectedPlayers = occupiedTeam.map((playerId) => getPlayerById(playerId)).filter(Boolean);
  if (selectedPlayers.length === 0) {
    teamSummary.innerHTML = '<p class="empty-state">Your squad is empty. Pick your five-man team from the list below.</p>';
  } else {
    teamSummary.innerHTML = selectedPlayers.map((player, index) => `
      <div class="selected-player">
        <div>
          <strong>${player.name}</strong>
          <span class="player-role">${index < 4 ? 'Starter' : 'Sub'}</span>
        </div>
        <div class="small-btn" onclick="removePlayerFromTeam('${player.id}')">Remove</div>
      </div>
    `).join('');
  }

  document.querySelectorAll('[data-slot]').forEach((slot) => {
    const slotIndex = Number(slot.dataset.slot);
    const player = getPlayerById(team[slotIndex]);
    slot.innerHTML = player ? `
      <button class="shirt-player" type="button" onclick="removePlayerFromSlot(${slotIndex})" aria-label="Remove ${player.name}">
        <span class="team-shirt" style="--shirt-color: ${player.teamColor || '#00f0ff'}"><span class="shirt-number">${slotIndex + 1}</span></span>
        <strong>${player.name}</strong>
        <small>${slotIndex === 4 ? 'Substitute' : 'Starter'}</small>
      </button>
    ` : `<button class="add-slot" type="button" onclick="openPlayerPicker(${slotIndex})" aria-label="Add ${slotIndex === 4 ? 'substitute' : 'starter'}"><span>+</span><small>${slotIndex === 4 ? 'Add substitute' : 'Add player'}</small></button>`;
  });
}

function openPlayerPicker(slotIndex) {
  if (!ensureFantasyLogin()) return;
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const picker = document.getElementById('player-picker');
  const list = document.getElementById('player-picker-list');
  const team = getStoredFantasyTeam();
  const selected = team[slotIndex];
  document.getElementById('player-picker-title').textContent = slotIndex === 4 ? 'Choose substitute' : `Choose starter ${slotIndex + 1}`;
  list.innerHTML = FANTASY_PLAYERS.filter((player) => !team.includes(player.id) || player.id === selected).map((player) => `
    <button class="picker-player" type="button" onclick="selectPlayerForSlot('${player.id}', ${slotIndex})">
      <span class="team-shirt mini-shirt" style="--shirt-color: ${player.teamColor || '#00f0ff'}"><span class="shirt-number">${slotIndex + 1}</span></span>
      <span><strong>${player.name}</strong><small>${formatMoney(player.value)} · ${getPlayerFantasyPoints(player)} pts</small></span>
    </button>
  `).join('') || '<p class="empty-state">All players are already in your squad.</p>';
  picker.hidden = false;
}

window.openPlayerPicker = openPlayerPicker;

window.selectPlayerForSlot = function (playerId, slotIndex) {
  const team = Array.from({ length: FANTASY_TEAM_SIZE }, (_, index) => getStoredFantasyTeam()[index] || null);
  const existingIndex = team.indexOf(playerId);
  if (existingIndex >= 0) team[existingIndex] = null;
  team[slotIndex] = playerId;
  if (getTeamTotal(team.filter(Boolean)) > FANTASY_TEAM_LIMIT) {
    alert('This selection would exceed the 40.0M budget.');
    return;
  }
  saveFantasyTeam(team);
  document.getElementById('player-picker').hidden = true;
  renderBuildBoard();
};

window.removePlayerFromSlot = function (slotIndex) {
  if (!ensureFantasyLogin() || transfersAreLocked()) return;
  const team = Array.from({ length: FANTASY_TEAM_SIZE }, (_, index) => getStoredFantasyTeam()[index] || null);
  team[slotIndex] = null;
  saveFantasyTeam(team);
  renderBuildBoard();
};

window.togglePlayerTeam = function (playerId) {
  if (!ensureFantasyLogin()) {
    return;
  }
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }

  const team = getStoredFantasyTeam();
  if (team.includes(playerId)) {
    removePlayerFromTeam(playerId);
    return;
  }

  if (team.length >= FANTASY_TEAM_SIZE) {
    alert('Your team already has 5 players. Remove one before adding another.');
    return;
  }

  const nextTotal = getTeamTotal([...team, playerId]);
  if (nextTotal > FANTASY_TEAM_LIMIT) {
    alert('This selection would exceed the 40.0M budget.');
    return;
  }

  team.push(playerId);
  saveFantasyTeam(team);
  renderBuildBoard();
};

window.removePlayerFromTeam = function (playerId) {
  if (!ensureFantasyLogin()) {
    return;
  }
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const team = getStoredFantasyTeam().filter((id) => id !== playerId);
  saveFantasyTeam(team);
  renderBuildBoard();
};

window.makeSubPlayer = function (event, playerId) {
  if (!ensureFantasyLogin()) {
    return;
  }
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  event.preventDefault();
  const team = getStoredFantasyTeam();
  const list = team.filter((id) => id !== playerId);
  if (list.length >= FANTASY_TEAM_SIZE) {
    list.splice(FANTASY_STARTER_COUNT, 1);
  }
  list.push(playerId);
  while (list.length > FANTASY_TEAM_SIZE) {
    list.shift();
  }
  saveFantasyTeam(list);
  renderBuildBoard();
};

window.saveFantasyTeamToStorage = async function () {
  if (!ensureFantasyLogin()) {
    return;
  }
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const team = getStoredFantasyTeam().filter(Boolean);
  if (team.length !== FANTASY_TEAM_SIZE) {
    alert('Your squad must contain exactly 5 players.');
    return;
  }
  if (team.length > FANTASY_TEAM_SIZE) {
    alert('Your squad cannot exceed 5 players.');
    return;
  }
  if (getTeamTotal(team) > FANTASY_TEAM_LIMIT) {
    alert('Your squad exceeds the 40.0M budget.');
    return;
  }
  const starterCount = team.slice(0, FANTASY_STARTER_COUNT).length;
  if (starterCount < FANTASY_STARTER_COUNT) {
    alert('Your squad must include 4 starters and 1 substitute.');
    return;
  }
  try {
    const user = getCurrentFantasyUser();
    const db = await getFantasyDb();
    const users = db.users || {};
    const accountKey = user.username.toLowerCase();
    if (!users[accountKey]) {
      throw new Error('Your account could not be found. Please sign in again.');
    }

    users[accountKey] = { ...users[accountKey], fantasyTeam: team };
    await saveFantasyDb({ ...db, users });
    alert('Team saved successfully.');
  } catch (error) {
    alert(error.message || 'Unable to save your team. Please try again.');
  }
};

async function renderLeaderboard() {
  const table = document.getElementById('leaderboardTable');
  if (!table) return;

  table.innerHTML = '<tbody><tr><td colspan="4">Loading rankings...</td></tr></tbody>';
  try {
    const currentUser = getCurrentFantasyUser();
    const db = await getFantasyDb();
    const rows = Object.values(db.users || {})
      .filter((user) => Array.isArray(user.fantasyTeam) && user.fantasyTeam.length === FANTASY_TEAM_SIZE)
      .map((user) => ({
        username: user.username,
        total: Number(user.fantasyPoints) || 0,
        matchday: Number(user.matchday) || 0
      }))
      .sort((a, b) => b.total - a.total);

    table.innerHTML = `
      <thead>
        <tr>
          <th>Rank</th>
          <th>Manager</th>
          <th>Matchday</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length === 0 ? '<tr><td colspan="4">No teams have been submitted yet.</td></tr>' : rows.map((entry, index) => `
          <tr>
            <td>#${index + 1}</td>
            <td>${entry.username}${currentUser && entry.username === currentUser.username ? ' (You)' : ''}</td>
            <td>${entry.matchday}</td>
            <td>${entry.total}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
  } catch (error) {
    table.innerHTML = '<tbody><tr><td colspan="4">Unable to load rankings right now.</td></tr></tbody>';
  }
}

function renderPlayersTable() {
  const table = document.getElementById('playersTable');
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        <th>Player</th>
        <th>Value</th>
        <th>Form</th>
        <th>Goals</th>
        <th>Own Goals</th>
        <th>MVPs</th>
        <th>Fantasy Pts</th>
      </tr>
    </thead>
    <tbody>
      ${FANTASY_PLAYERS.map((player) => `
        <tr>
          <td>${player.name}</td>
          <td>${formatMoney(player.value)}</td>
          <td>${formatPlayerForm(player)}</td>
          <td>${player.goals}</td>
          <td>${player.ownGoals}</td>
          <td>${player.mvps}</td>
          <td>${getPlayerFantasyPoints(player)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
}

function renderAdminState() {
  const status = document.getElementById('admin-matchday-status');
  const startButton = document.getElementById('admin-start-matchday');
  const endButton = document.getElementById('admin-end-matchday');
  const deleteButton = document.getElementById('admin-delete-matchday');
  const selector = document.getElementById('admin-matchday-select');
  if (!status) return;

  if (selector) {
    selector.innerHTML = fantasyMatchdays.length === 0
      ? '<option value="">No matchdays created</option>'
      : fantasyMatchdays.map((matchday) => `<option value="${matchday.id}">Matchday ${matchday.id}: ${matchday.name} (${matchday.status})</option>`).join('');
    selector.value = selectedFantasyMatchdayId || '';
  }

  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!selected) {
    status.textContent = 'No matchday created';
    if (startButton) startButton.disabled = true;
    if (endButton) endButton.disabled = true;
    if (deleteButton) deleteButton.disabled = true;
    return;
  }

  status.textContent = `Matchday ${selected.id}: ${selected.name} (${selected.status})`;
  if (startButton) startButton.disabled = selected.status !== 'draft';
  if (endButton) endButton.disabled = selected.status !== 'active';
  if (deleteButton) deleteButton.disabled = selected.status === 'active';
}

function renderAdminPlayers() {
  const container = document.getElementById('admin-player-list');
  if (!container) return;
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  const selectedStats = selected?.playerStats || {};
  container.innerHTML = FANTASY_PLAYERS.map((player) => `
    <div class="admin-player-row" data-player-id="${player.id}">
      <strong>${player.name}</strong>
      <label>Goals <input type="number" min="0" value="${Number(selectedStats[player.id]?.goals) || 0}" data-stat="goals"></label>
      <label>Own goals <input type="number" min="0" value="${Number(selectedStats[player.id]?.ownGoals) || 0}" data-stat="ownGoals"></label>
      <label>MVPs <input type="number" min="0" value="${Number(selectedStats[player.id]?.mvps) || 0}" data-stat="mvps"></label>
      <label>Matchday points <input type="number" value="${Number(selectedStats[player.id]?.matchdayPoints) || 0}" data-stat="matchdayPoints"></label>
    </div>
  `).join('');
}

async function createFantasyMatchday() {
  if (!isFantasyAdmin()) return;
  const nameInput = document.getElementById('admin-matchday-name');
  const name = nameInput.value.trim();
  if (!name) {
    alert('Enter a matchday name first.');
    return;
  }
  if (fantasyMatchdays.some((matchday) => matchday.status === 'active')) {
    alert('End the active matchday before creating another one.');
    return;
  }
  const db = await getFantasyDb();
  const matchday = {
    id: fantasyMatchdays.reduce((highest, current) => Math.max(highest, Number(current.id) || 0), 0) + 1,
    name,
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  fantasyMatchdays = [...fantasyMatchdays, matchday];
  selectedFantasyMatchdayId = matchday.id;
  await saveFantasyDb({
    ...db,
    fantasyMatchdays,
    fantasyAdminState: { ...(db.fantasyAdminState || {}), selectedMatchdayId: selectedFantasyMatchdayId }
  });
  renderAdminState();
  renderAdminPlayers();
}

async function startFantasyMatchday() {
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!isFantasyAdmin() || !selected || selected.status !== 'draft') return;
  const db = await getFantasyDb();
  fantasyMatchdays = fantasyMatchdays.map((matchday) => matchday.id === selected.id
    ? { ...matchday, status: 'active', startedAt: new Date().toISOString() }
    : matchday);
  fantasyMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active');
  await saveFantasyDb({ ...db, fantasyMatchdays });
  renderAdminState();
}

async function endFantasyMatchday() {
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!isFantasyAdmin() || !selected || selected.status !== 'active') return;
  const db = await getFantasyDb();
  const users = { ...(db.users || {}) };
  const endedMatchdays = fantasyMatchdays.map((matchday) => matchday.id === selected.id
    ? { ...matchday, status: 'ended', endedAt: new Date().toISOString() }
    : matchday);
  fantasyMatchdays = endedMatchdays;
  fantasyMatchday = null;
  recalculateManagerTotals(users, fantasyMatchdays);
  await saveFantasyDb({ ...db, users, fantasyMatchdays });
  applyAggregatedPlayerStats(fantasyMatchdays);
  renderAdminState();
  renderAdminPlayers();
  alert('Matchday ended and points were added to submitted teams.');
}

async function deleteFantasyMatchday() {
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!isFantasyAdmin() || !selected || selected.status === 'active') return;
  if (!confirm(`Delete Matchday ${selected.id}: ${selected.name}?`)) return;
  const db = await getFantasyDb();
  fantasyMatchdays = fantasyMatchdays.filter((matchday) => matchday.id !== selected.id);
  selectedFantasyMatchdayId = fantasyMatchdays[0]?.id || null;
  fantasyMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active') || null;
  const users = { ...(db.users || {}) };
  recalculateManagerTotals(users, fantasyMatchdays);
  await saveFantasyDb({
    ...db,
    users,
    fantasyMatchdays,
    fantasyAdminState: { ...(db.fantasyAdminState || {}), selectedMatchdayId: selectedFantasyMatchdayId }
  });
  applyAggregatedPlayerStats(fantasyMatchdays);
  renderAdminState();
  renderAdminPlayers();
}

async function saveFantasyPlayerStats() {
  if (!isFantasyAdmin()) return;
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!selected) {
    alert('Create or select a matchday first.');
    return;
  }
  const db = await getFantasyDb();
  const playerStats = { ...(selected.playerStats || {}) };
  document.querySelectorAll('.admin-player-row').forEach((row) => {
    const playerId = row.dataset.playerId;
    const stats = {};
    row.querySelectorAll('[data-stat]').forEach((input) => {
      stats[input.dataset.stat] = Number(input.value) || 0;
    });
    const existing = playerStats[playerId] || {};
    playerStats[playerId] = { ...existing, ...stats };
  });
  fantasyMatchdays = fantasyMatchdays.map((matchday) => matchday.id === selected.id ? { ...matchday, playerStats } : matchday);
  const users = { ...(db.users || {}) };
  recalculateManagerTotals(users, fantasyMatchdays);
  await saveFantasyDb({ ...db, users, fantasyMatchdays });
  applyAggregatedPlayerStats(fantasyMatchdays);
  renderPlayersTable();
  alert('Player stats saved.');
}

function initAdminPage() {
  const guard = document.getElementById('admin-access-denied');
  const panel = document.getElementById('admin-panel');
  if (!isFantasyAdmin()) {
    if (guard) guard.hidden = false;
    if (panel) panel.hidden = true;
    return;
  }
  if (guard) guard.hidden = true;
  if (panel) panel.hidden = false;
  if (!fantasyMatchdays.some((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId))) {
    selectedFantasyMatchdayId = fantasyMatchdays.at(-1)?.id || null;
  }
  renderAdminState();
  renderAdminPlayers();
  document.getElementById('admin-matchday-select')?.addEventListener('change', (event) => {
    selectedFantasyMatchdayId = Number(event.target.value) || null;
    renderAdminState();
    renderAdminPlayers();
    saveSelectedMatchdayId(selectedFantasyMatchdayId).catch((error) => alert(error.message));
  });
  document.getElementById('admin-create-matchday')?.addEventListener('click', () => createFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-start-matchday')?.addEventListener('click', () => startFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-end-matchday')?.addEventListener('click', () => endFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-delete-matchday')?.addEventListener('click', () => deleteFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-save-stats')?.addEventListener('click', () => saveFantasyPlayerStats().catch((error) => alert(error.message)));
}
