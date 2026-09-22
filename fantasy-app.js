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

async function getFantasyDb() {
  if (fantasyDbCache) return fantasyDbCache;
  const response = await fetch(FANTASY_DB_URL);
  if (!response.ok) throw new Error('Unable to connect to the account service.');
  fantasyDbCache = await response.json();
  return fantasyDbCache;
}

async function loadFantasyState() {
  try {
    const db = await getFantasyDb();
    fantasyMatchday = db.fantasyMatchday || null;
    const remotePlayers = db.fantasyPlayers || {};
    FANTASY_PLAYERS.forEach((player) => {
      if (remotePlayers[player.id]) Object.assign(player, remotePlayers[player.id]);
    });
  } catch (error) {
    fantasyMatchday = null;
  }
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
  const playerList = document.getElementById('playerList');
  const teamSummary = document.getElementById('teamSummary');
  const teamTotalLabel = document.getElementById('teamTotal');
  const teamCountLabel = document.getElementById('teamCount');
  const budgetBar = document.getElementById('budgetBar');

  if (!playerList || !teamSummary) return;

  const team = getStoredFantasyTeam();
  const total = getTeamTotal(team);
  const remaining = FANTASY_TEAM_LIMIT - total;

  if (teamTotalLabel) {
    teamTotalLabel.textContent = formatMoney(total);
    teamTotalLabel.className = remaining >= 0 ? 'budget-value under' : 'budget-value over';
  }

  if (teamCountLabel) {
    teamCountLabel.textContent = `${team.length}/${FANTASY_TEAM_SIZE}`;
  }

  if (budgetBar) {
    const usage = Math.min((total / FANTASY_TEAM_LIMIT) * 100, 100);
    budgetBar.style.width = `${usage}%`;
  }

  const selectedPlayers = team.map((playerId) => getPlayerById(playerId)).filter(Boolean);
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

  playerList.innerHTML = FANTASY_PLAYERS.map((player) => {
    const isSelected = team.includes(player.id);
    const isSub = team.length > 0 && team[team.length - 1] === player.id && team.length === FANTASY_TEAM_SIZE;
    const buttonText = isSelected ? 'Selected' : 'Add';
    const className = isSelected ? 'selected' : '';
    return `
      <div class="player-card">
        <div class="player-header">
          <div>
            <div class="player-name">${player.name}</div>
            <div class="player-meta"><span>Form ${formatPlayerForm(player)}</span><span>${getPlayerFantasyPoints(player)} pts</span></div>
          </div>
          <div class="player-value">${formatMoney(player.value)}</div>
        </div>
        <div class="player-meta">
          <span>Goals ${player.goals}</span>
          <span>MVPs ${player.mvps}</span>
        </div>
        <div class="player-actions">
          <button class="small-btn ${className}" type="button" onclick="togglePlayerTeam('${player.id}')">${buttonText}</button>
          ${isSelected ? '<button class="small-btn" type="button" onclick="makeSubPlayer(event, \'${player.id}\')">Mark as sub</button>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

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
  const team = getStoredFantasyTeam();
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
  if (!status) return;

  if (!fantasyMatchday) {
    status.textContent = 'No matchday created';
    if (startButton) startButton.disabled = true;
    if (endButton) endButton.disabled = true;
    return;
  }

  status.textContent = `Matchday ${fantasyMatchday.id}: ${fantasyMatchday.name} (${fantasyMatchday.status})`;
  if (startButton) startButton.disabled = fantasyMatchday.status !== 'draft';
  if (endButton) endButton.disabled = fantasyMatchday.status !== 'active';
}

function renderAdminPlayers() {
  const container = document.getElementById('admin-player-list');
  if (!container) return;
  container.innerHTML = FANTASY_PLAYERS.map((player) => `
    <div class="admin-player-row" data-player-id="${player.id}">
      <strong>${player.name}</strong>
      <label>Goals <input type="number" min="0" value="${Number(player.goals) || 0}" data-stat="goals"></label>
      <label>Own goals <input type="number" min="0" value="${Number(player.ownGoals) || 0}" data-stat="ownGoals"></label>
      <label>MVPs <input type="number" min="0" value="${Number(player.mvps) || 0}" data-stat="mvps"></label>
      <label>Matchday points <input type="number" value="${Number(player.matchdayPoints) || 0}" data-stat="matchdayPoints"></label>
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
  if (fantasyMatchday?.status === 'active') {
    alert('End the active matchday before creating another one.');
    return;
  }
  const db = await getFantasyDb();
  fantasyMatchday = {
    id: Number(fantasyMatchday?.id || 0) + 1,
    name,
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  await saveFantasyDb({ ...db, fantasyMatchday });
  renderAdminState();
}

async function startFantasyMatchday() {
  if (!isFantasyAdmin() || !fantasyMatchday || fantasyMatchday.status !== 'draft') return;
  const db = await getFantasyDb();
  fantasyMatchday = { ...fantasyMatchday, status: 'active', startedAt: new Date().toISOString() };
  await saveFantasyDb({ ...db, fantasyMatchday });
  renderAdminState();
}

async function endFantasyMatchday() {
  if (!isFantasyAdmin() || !fantasyMatchday || fantasyMatchday.status !== 'active') return;
  const db = await getFantasyDb();
  const players = db.fantasyPlayers || {};
  const users = { ...(db.users || {}) };
  Object.keys(users).forEach((accountKey) => {
    const user = users[accountKey];
    if (!Array.isArray(user.fantasyTeam) || user.fantasyTeam.length !== FANTASY_TEAM_SIZE) return;
    const points = user.fantasyTeam.reduce((total, playerId) => total + (Number(players[playerId]?.matchdayPoints) || 0), 0);
    users[accountKey] = {
      ...user,
      fantasyPoints: (Number(user.fantasyPoints) || 0) + points,
      matchday: fantasyMatchday.id
    };
  });
  fantasyMatchday = { ...fantasyMatchday, status: 'ended', endedAt: new Date().toISOString() };
  await saveFantasyDb({ ...db, users, fantasyMatchday });
  renderAdminState();
  alert('Matchday ended and points were added to submitted teams.');
}

async function saveFantasyPlayerStats() {
  if (!isFantasyAdmin()) return;
  const db = await getFantasyDb();
  const fantasyPlayers = { ...(db.fantasyPlayers || {}) };
  document.querySelectorAll('.admin-player-row').forEach((row) => {
    const playerId = row.dataset.playerId;
    const stats = {};
    row.querySelectorAll('[data-stat]').forEach((input) => {
      stats[input.dataset.stat] = Number(input.value) || 0;
    });
    const existing = fantasyPlayers[playerId] || {};
    fantasyPlayers[playerId] = { ...existing, ...stats };
  });
  await saveFantasyDb({ ...db, fantasyPlayers });
  FANTASY_PLAYERS.forEach((player) => {
    if (fantasyPlayers[player.id]) Object.assign(player, fantasyPlayers[player.id]);
  });
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
  renderAdminState();
  renderAdminPlayers();
  document.getElementById('admin-create-matchday')?.addEventListener('click', () => createFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-start-matchday')?.addEventListener('click', () => startFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-end-matchday')?.addEventListener('click', () => endFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-save-stats')?.addEventListener('click', () => saveFantasyPlayerStats().catch((error) => alert(error.message)));
}
