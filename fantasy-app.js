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

function getPlayerMatchdayPoints(player, matchdayId = viewedFantasyMatchdayId) {
  const matchday = fantasyMatchdays.find((item) => String(item.id) === String(matchdayId));
  return Number(matchday?.playerStats?.[player.id]?.matchdayPoints) || 0;
}

function getPlayerAvailability(playerId, matchdayId = viewedFantasyMatchdayId) {
  const matchday = fantasyMatchdays.find((item) => String(item.id) === String(matchdayId));
  const availability = matchday?.playerAvailability?.[playerId];
  if (!availability || !['injured', 'unavailable'].includes(availability.status)) return null;
  return availability.status === 'unavailable'
    ? {
      status: 'unavailable',
      chance: Math.max(0, Math.min(100, Number(availability.chance ?? 100) || 0)),
      reason: String(availability.reason || '').trim()
    }
    : { status: 'injured' };
}

function escapeFantasyHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getPlayerAvailabilityBadge(player) {
  const availability = getPlayerAvailability(player.id);
  if (!availability) return '';
  if (availability.status === 'injured') {
    return '<span class="availability-badge injured" role="img" aria-label="Injured" title="Injured this matchday">&times;</span>';
  }
  const reason = availability.reason ? ` Reason: ${availability.reason}` : '';
  const accessibleReason = escapeFantasyHtml(reason);
  return `<span class="availability-badge unavailable" role="img" aria-label="Unavailable, ${availability.chance}% chance.${accessibleReason}" title="${availability.chance}% chance of unavailability.${accessibleReason}"><span aria-hidden="true">&#9888;</span><small>${availability.chance}%</small></span>`;
}

function formatPlayerForm(player) {
  const form = getPlayerForm(player);
  return form === null ? '\u2014' : form.toFixed(1);
}

const FANTASY_DB_URL = 'https://ptchbl4-default-rtdb.europe-west1.firebasedatabase.app/.json';
const FANTASY_ADMIN_USERNAME = 'pitchball';
const FANTASY_POWERUPS_START_MATCHDAY_ID = 2;
let fantasyDbCache = null;
let fantasyMatchday = null;
let fantasyMatchdays = [];
let selectedFantasyMatchdayId = null;
let viewedFantasyMatchdayId = null;
let fantasyAccount = null;
let fantasyUsers = {};
let playerStatsSort = { key: null, direction: 1 };
let leaderboardSort = { key: 'total', direction: -1 };
let squadCountdownTimer = null;

function getDateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return days > 0
    ? `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
    : `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function renderSquadCountdown(deadline) {
  if (squadCountdownTimer) clearInterval(squadCountdownTimer);
  squadCountdownTimer = null;
  const countdown = document.getElementById('squad-countdown');
  if (!countdown || !deadline) return;
  const update = () => {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining <= 0) {
      if (squadCountdownTimer) clearInterval(squadCountdownTimer);
      squadCountdownTimer = null;
      renderSquadSubmissionStatus();
      return;
    }
    countdown.textContent = formatCountdown(remaining);
  };
  update();
  squadCountdownTimer = window.setInterval(update, 1000);
}

function getFantasyMatchdaySquad(user, matchdayId) {
  if (matchdayId === undefined || matchdayId === null) return user || null;
  const matchday = fantasyMatchdays.find((item) => String(item.id) === String(matchdayId));
  const managerSnapshot = matchday?.managerSnapshots?.[String(user?.username || '').toLowerCase()];
  if (managerSnapshot) return managerSnapshot;
  const savedSquad = user?.fantasyMatchdaySquads?.[String(matchdayId)];
  if (Array.isArray(savedSquad?.fantasyTeam) || savedSquad?.fantasyTeam && typeof savedSquad.fantasyTeam === 'object') {
    return savedSquad;
  }
  if (user?.fantasySubmittedMatchdayId !== undefined
    && user?.fantasySubmittedMatchdayId !== null
    && String(user.fantasySubmittedMatchdayId) === String(matchdayId)) return user || null;
  if (user?.fantasySubmittedMatchdayId === undefined || user?.fantasySubmittedMatchdayId === null) {
    const currentMatchday = fantasyMatchdays.find((item) => item.status === 'active')
      || getOrderedFantasyMatchdays().find((item) => item.status === 'draft');
    if (String(currentMatchday?.id) === String(matchdayId)) return user || null;
  }
  const orderedMatchdays = getOrderedFantasyMatchdays();
  const targetIndex = orderedMatchdays.findIndex((item) => String(item.id) === String(matchdayId));
  if (targetIndex >= 0) {
    const accountKey = String(user?.username || '').toLowerCase();
    for (const previousMatchday of orderedMatchdays.slice(0, targetIndex).reverse()) {
      const snapshot = previousMatchday.managerSnapshots?.[accountKey];
      if (snapshot && (Array.isArray(snapshot.fantasyTeam) || snapshot.fantasyTeam && typeof snapshot.fantasyTeam === 'object')) {
        return { ...snapshot, fantasyPowerups: {}, transferPenalty: 0 };
      }
      const previousSquad = user?.fantasyMatchdaySquads?.[String(previousMatchday.id)];
      if (Array.isArray(previousSquad?.fantasyTeam) || previousSquad?.fantasyTeam && typeof previousSquad.fantasyTeam === 'object') {
        return { ...previousSquad, fantasyPowerups: {}, transferPenalty: 0 };
      }
    }
    const submittedIndex = orderedMatchdays.findIndex((item) => String(item.id) === String(user?.fantasySubmittedMatchdayId));
    if (submittedIndex >= 0 && submittedIndex < targetIndex && Array.isArray(user?.fantasyTeam)) {
      return { ...user, fantasyPowerups: {}, fantasyTransferPenalty: 0, transferPenalty: 0 };
    }
  }
  return null;
}

function getFantasyBuilderMatchday() {
  return fantasyMatchdays.find((matchday) => String(matchday.id) === String(viewedFantasyMatchdayId))
    || getFantasyDraftMatchday()
    || fantasyMatchday
    || null;
}

function getFantasyBuilderSquad(matchday = getFantasyBuilderMatchday()) {
  if (!matchday) return null;
  const localSquad = getStoredFantasyMatchdaySquads()[String(matchday.id)];
  if (matchday.status === 'draft' && localSquad) return localSquad;
  const accountSquad = getFantasyMatchdaySquad(fantasyAccount, matchday.id);
  if (accountSquad) return accountSquad;
  if (localSquad) return localSquad;
  return matchday.status === 'draft' ? getStoredFantasyMatchdaySquad(matchday.id) : null;
}

function getFantasyBuilderTeam(matchday = getFantasyBuilderMatchday()) {
  if (!matchday) return getStoredFantasyTeam();
  const team = getFantasyBuilderSquad(matchday)?.fantasyTeam;
  return Array.isArray(team) ? team : Object.values(team || {});
}

function getFantasyBuilderCaptain(matchday = getFantasyBuilderMatchday()) {
  if (!matchday) return getStoredFantasyCaptain();
  return getFantasyBuilderSquad(matchday)?.fantasyCaptain || null;
}

function saveFantasyBuilderTeam(team) {
  saveFantasyTeam(team, getFantasyBuilderMatchday()?.id);
}

function saveFantasyBuilderCaptain(playerId) {
  saveFantasyCaptain(playerId, getFantasyBuilderMatchday()?.id);
}

function getFantasyTeamPlayerIds(user, matchdayId) {
  const squad = getFantasyMatchdaySquad(user, matchdayId);
  return Array.isArray(squad?.fantasyTeam)
    ? squad.fantasyTeam.filter(Boolean)
    : Object.values(squad?.fantasyTeam || {}).filter(Boolean);
}

function getSubmittedFantasyUsers() {
  return Object.values(fantasyUsers).filter((user) => getFantasyTeamPlayerIds(user).length === FANTASY_TEAM_SIZE);
}

function buildFantasyOwnershipSnapshot(users, matchdayId) {
  const managers = Object.values(users || {}).filter((user) => getFantasyTeamPlayerIds(user, matchdayId).length === FANTASY_TEAM_SIZE);
  const counts = {};
  managers.forEach((manager) => {
    getFantasyTeamPlayerIds(manager, matchdayId).forEach((playerId) => {
      counts[playerId] = (counts[playerId] || 0) + 1;
    });
  });
  return {
    managerCount: managers.length,
    percentages: Object.fromEntries(FANTASY_PLAYERS.map((player) => [
      player.id,
      managers.length ? Math.round(((counts[player.id] || 0) / managers.length) * 100) : 0
    ]))
  };
}

function getFantasyOwnershipTrend(playerId) {
  const snapshots = getOrderedFantasyMatchdays().filter((matchday) => matchday.playerOwnership?.percentages);
  if (snapshots.length < 2) return null;
  const current = snapshots.at(-1).playerOwnership.percentages[playerId] || 0;
  const previous = snapshots.at(-2).playerOwnership.percentages[playerId] || 0;
  return current - previous;
}

function getPlayerSelectionStats(playerId) {
  const managers = getSubmittedFantasyUsers();
  const selectedCount = managers.filter((manager) => getFantasyTeamPlayerIds(manager).includes(playerId)).length;
  return {
    selectedCount,
    managerCount: managers.length,
    percentage: managers.length ? Math.round((selectedCount / managers.length) * 100) : 0
  };
}

const FANTASY_TEAM_DIFFICULTY = {
  BADiles: 5,
  'Volos Drummers': 4,
  Lampater: 4,
  R1: 5,
  Axtarmades: 5,
  'Team Till Death': 2,
  Hornets: 1,
  'Basement Boys': 5,
  Warriors: 3,
  'Niki Alimou': 1,
  'Spasmena Mila': 3,
  Thryloi: 4,
  'Golden B.': 1,
  Polo: 3,
  Ksades: 1,
  'Midi Kidz': 2,
  'Air Condition': 2,
  EX7T: 1,
  Hitters: 2
};

function getFantasyFixtureDifficulty(team) {
  return FANTASY_TEAM_DIFFICULTY[team] || 3;
}

function getFantasyNextFixture(player) {
  const matchdays = getOrderedFantasyMatchdays();
  const activeIndex = matchdays.findIndex((matchday) => matchday.status === 'active');
  const draftIndex = matchdays.findIndex((matchday) => matchday.status === 'draft');
  const lastEndedIndex = matchdays.map((matchday) => matchday.status).lastIndexOf('ended');
  const nextMatchdayNumber = activeIndex >= 0
    ? activeIndex + 1
    : draftIndex >= 0
      ? draftIndex + 1
      : lastEndedIndex >= 0
        ? lastEndedIndex + 2
        : 1;
  return getFantasyPlayerFixtures(player)
    .find((fixture) => fixture.gameweek === `Matchday ${nextMatchdayNumber}`) || null;
}

async function getFantasyDb() {
  if (fantasyDbCache) return JSON.parse(JSON.stringify(fantasyDbCache));
  const response = await fetch(FANTASY_DB_URL);
  if (!response.ok) throw new Error('Unable to connect to the account service.');
  fantasyDbCache = await response.json();
  return JSON.parse(JSON.stringify(fantasyDbCache));
}

async function loadFantasyState() {
  fantasyUsers = {};
  try {
    let db = await getFantasyDb();
    fantasyUsers = { ...(db.users || {}) };
    fantasyMatchdays = Array.isArray(db.fantasyMatchdays)
      ? db.fantasyMatchdays
      : db.fantasyMatchday ? [db.fantasyMatchday] : [];
    fantasyMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active') || null;
    selectedFantasyMatchdayId = db.fantasyAdminState?.selectedMatchdayId || getOrderedFantasyMatchdays().at(-1)?.id || null;
    const storedViewedMatchdayId = localStorage.getItem(getFantasyUserStorageKey('pitchballFantasyViewedMatchdayId'));
    const storedViewedMatchday = getBuildVisibleMatchdays().find((matchday) => String(matchday.id) === String(storedViewedMatchdayId));
    viewedFantasyMatchdayId = storedViewedMatchday?.id || fantasyMatchday?.id || selectedFantasyMatchdayId;
    if (!Array.isArray(db.fantasyMatchdays) && fantasyMatchdays.length > 0) {
      const { fantasyMatchday: legacyMatchday, ...currentDb } = db;
      db = { ...currentDb, fantasyMatchdays, fantasyAdminState: { selectedMatchdayId: selectedFantasyMatchdayId } };
      await saveFantasyDb(db);
    }
    const currentUser = getCurrentFantasyUser();
    const account = currentUser ? db.users?.[currentUser.username.toLowerCase()] : null;
    fantasyAccount = account || null;
    if (account && Array.isArray(account.fantasyTeam)) {
      const budgetState = getFantasyBudgetState(account, account.fantasyTeam);
      if (budgetState.changed) {
        fantasyAccount = { ...account, fantasyBudget: budgetState.budget, fantasyPriceSnapshot: budgetState.snapshot };
        db = { ...db, users: { ...(db.users || {}), [currentUser.username.toLowerCase()]: fantasyAccount } };
        await saveFantasyDb(db);
      }
    }
    if (account?.fantasyCaptain && !getStoredFantasyCaptain()) saveFantasyCaptain(account.fantasyCaptain);
    if (account?.fantasySubmittedMatchdayId && !getFantasySubmissionState(account.fantasySubmittedMatchdayId)) {
      saveFantasySubmissionState({ matchdayId: account.fantasySubmittedMatchdayId, transfersUsed: Number(account.fantasyTransfersUsed) || 0 });
    }
    const usersWithAutoCaptains = { ...(db.users || {}) };
    let autoCaptainsChanged = false;
    Object.entries(usersWithAutoCaptains).forEach(([accountKey, user]) => {
      const team = getFantasyTeamPlayerIds(user);
      const starters = team.slice(0, FANTASY_STARTER_COUNT);
      if (team.length !== FANTASY_TEAM_SIZE || starters.includes(user.fantasyCaptain)) return;
      const highestValueStarter = starters
        .map((playerId) => getPlayerById(playerId))
        .filter(Boolean)
        .sort((left, right) => Number(right.value) - Number(left.value))[0];
      if (!highestValueStarter) return;
      usersWithAutoCaptains[accountKey] = { ...user, fantasyCaptain: highestValueStarter.id };
      fantasyUsers[accountKey] = usersWithAutoCaptains[accountKey];
      if (currentUser?.username.toLowerCase() === accountKey) fantasyAccount = usersWithAutoCaptains[accountKey];
      autoCaptainsChanged = true;
    });
    if (autoCaptainsChanged) {
      db = { ...db, users: usersWithAutoCaptains };
    }
    const usersWithUpdatedScores = { ...(db.users || {}) };
    const scoresChanged = recalculateManagerTotals(usersWithUpdatedScores, fantasyMatchdays);
    if (scoresChanged || autoCaptainsChanged) {
      db = { ...db, users: usersWithUpdatedScores };
      fantasyUsers = usersWithUpdatedScores;
      fantasyAccount = currentUser ? usersWithUpdatedScores[currentUser.username.toLowerCase()] || null : null;
      await saveFantasyDb(db).catch(() => {});
    }
    if (currentUser && fantasyAccount) fantasyUsers[currentUser.username.toLowerCase()] = fantasyAccount;
    applyAggregatedPlayerStats(fantasyMatchdays);
  } catch (error) {
    fantasyMatchday = null;
    fantasyMatchdays = [];
    fantasyAccount = null;
  }
}

function applyAggregatedPlayerStats(matchdays) {
  const totals = {};
  matchdays
    .filter((matchday) => matchday.status === 'ended' || matchday.status === 'active')
    .forEach((matchday) => {
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
  const endedMatchdays = matchdays.filter((matchday) => matchday.status === 'ended');
  const lastMatchday = getOrderedFantasyMatchdays().filter((matchday) => matchday.status === 'ended').at(-1);
  let changed = false;
  Object.keys(users).forEach((accountKey) => {
    const user = users[accountKey];
    if (!Array.isArray(user.fantasyTeam)) return;
    const fantasyMatchdayPoints = { ...(user.fantasyMatchdayPoints || {}) };
    const fantasyPoints = endedMatchdays.reduce((total, matchday) => {
      const squad = matchday.managerSnapshots?.[accountKey] || getFantasyMatchdaySquad(user, matchday.id);
      const points = calculateFantasyTeamPoints(
        squad?.fantasyTeam,
        squad?.fantasyCaptain,
        matchday,
        squad?.fantasyPowerups,
        squad?.transferPenalty
      );
      fantasyMatchdayPoints[matchday.id] = points;
      if (Number(user.fantasyMatchdayPoints?.[matchday.id]) !== points) changed = true;
      return total + points;
    }, 0);
    const lastMatchdayId = lastMatchday?.id || 0;
    if (Number(user.fantasyPoints) !== fantasyPoints || String(user.matchday ?? '') !== String(lastMatchdayId)) changed = true;
    users[accountKey] = {
      ...user,
      fantasyMatchdayPoints,
      fantasyPoints,
      matchday: lastMatchdayId
    };
  });
  return changed;
}

function isFantasyPowerupActive(powerups, powerupName, matchdayId) {
  const powerup = powerups?.[powerupName];
  return Boolean(Number(matchdayId) >= FANTASY_POWERUPS_START_MATCHDAY_ID
    && powerup?.used
    && String(powerup.matchdayId) === String(matchdayId));
}

function getFantasyPowerupTargetMatchday() {
  return getFantasyBuilderMatchday();
}

function hasFantasyPowerupBeenUsed(powerupName) {
  return Boolean(fantasyAccount?.fantasyPowerups?.[powerupName]?.used);
}

function areFantasyPowerupsAvailable(matchday = getFantasyPowerupTargetMatchday()) {
  return Boolean(matchday && Number(matchday.id) >= FANTASY_POWERUPS_START_MATCHDAY_ID);
}

function getFantasySubstitution(team, matchday) {
  if (matchday?.status !== 'ended') return null;
  const players = Array.isArray(team) ? team.filter(Boolean) : [];
  const substituteId = players[FANTASY_STARTER_COUNT];
  if (!substituteId) return null;

  const starterPoints = players.slice(0, FANTASY_STARTER_COUNT).map((playerId) => ({
    playerId,
    points: Number(matchday.playerStats?.[playerId]?.matchdayPoints) || 0
  }));
  const lowestStarter = starterPoints.reduce((lowest, player) => player.points < lowest.points ? player : lowest, starterPoints[0]);
  const substitutePoints = Number(matchday.playerStats?.[substituteId]?.matchdayPoints) || 0;
  if (!lowestStarter || lowestStarter.points > 0 || substitutePoints <= 0) return null;

  return { playerId: substituteId, replacedPlayerId: lowestStarter.playerId };
}

function calculateFantasyTeamPoints(team, captain, matchday, powerups, transferPenalty = 0) {
  const players = Array.isArray(team) ? team.filter(Boolean) : [];
  const starters = players.slice(0, FANTASY_STARTER_COUNT);
  const starterPoints = starters.map((playerId) => ({
    playerId,
    points: Number(matchday?.playerStats?.[playerId]?.matchdayPoints) || 0
  }));
  const scoringPlayers = starterPoints.slice();
  const substitution = getFantasySubstitution(players, matchday);
  if (substitution) {
    const replacedPlayerIndex = scoringPlayers.findIndex((player) => player.playerId === substitution.replacedPlayerId);
    if (replacedPlayerIndex >= 0) {
      scoringPlayers.splice(replacedPlayerIndex, 1, {
        playerId: substitution.playerId,
        points: Number(matchday.playerStats?.[substitution.playerId]?.matchdayPoints) || 0
      });
    }
  }

  const captainMultiplier = isFantasyPowerupActive(powerups, 'tripleCaptain', matchday?.id) ? 3 : 2;
  const playerPoints = scoringPlayers.reduce((total, player) => total + player.points * (player.playerId === captain ? captainMultiplier : 1), 0);
  return playerPoints - (Number(transferPenalty) || 0);
}

function calculateFantasyManagerPoints(user, matchday) {
  const snapshot = matchday?.managerSnapshots?.[String(user?.username || '').toLowerCase()];
  const squad = snapshot || getFantasyMatchdaySquad(user, matchday?.id);
  if (!squad) return 0;
  return calculateFantasyTeamPoints(
    squad.fantasyTeam,
    squad.fantasyCaptain,
    matchday,
    squad.fantasyPowerups,
    squad.transferPenalty
  );
}

async function saveFantasyDb(db) {
  const previousDb = fantasyDbCache || {};
  const updates = {};
  Object.entries(db).forEach(([key, value]) => {
    if (key === 'users') {
      Object.entries(value || {}).forEach(([accountKey, account]) => {
        if (JSON.stringify(previousDb.users?.[accountKey]) !== JSON.stringify(account)) {
          updates[`users/${accountKey}`] = account;
        }
      });
    } else if (key === 'fantasyMatchdays'
      && Array.isArray(previousDb.fantasyMatchdays)
      && Array.isArray(value)
      && previousDb.fantasyMatchdays.length === value.length
      && previousDb.fantasyMatchdays.every((matchday, index) => matchday?.id === value[index]?.id)) {
      value.forEach((matchday, index) => {
        if (JSON.stringify(previousDb.fantasyMatchdays[index]) !== JSON.stringify(matchday)) {
          updates[`fantasyMatchdays/${index}`] = matchday;
        }
      });
    } else if (JSON.stringify(previousDb[key]) !== JSON.stringify(value)) {
      updates[key] = value;
    }
  });
  if (!Object.keys(updates).length) return;

  const response = await fetch(FANTASY_DB_URL, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Unable to save fantasy data.');
  fantasyDbCache = JSON.parse(JSON.stringify({
    ...previousDb,
    ...db,
    users: { ...(previousDb.users || {}), ...(db.users || {}) }
  }));
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

function getFantasyLockMatchday() {
  return getFantasyDraftMatchday() || fantasyMatchday || null;
}

function hasFantasyLockPassed(matchday = getFantasyLockMatchday()) {
  return Boolean(matchday?.startAt && new Date(matchday.startAt).getTime() <= Date.now());
}

function getFantasyDraftMatchday() {
  return fantasyMatchdays.find((matchday) => matchday.status === 'draft') || null;
}

function getBuildVisibleMatchdays() {
  const matchdays = getOrderedFantasyMatchdays();
  let currentIndex = matchdays.findIndex((matchday) => matchday.status === 'active');
  if (currentIndex < 0) {
    currentIndex = matchdays.findIndex((matchday) => matchday.status === 'draft');
  }
  if (currentIndex < 0) {
    currentIndex = matchdays.map((matchday) => matchday.status).lastIndexOf('ended');
  }
  if (currentIndex < 0) currentIndex = Math.max(0, matchdays.length - 1);
  return matchdays.slice(currentIndex, currentIndex + 2);
}

function transfersAreLocked() {
  const matchday = getFantasyBuilderMatchday();
  if (!matchday) return Boolean(fantasyMatchday) || hasFantasyLockPassed();
  const draftMatchday = getFantasyDraftMatchday();
  if (matchday.status !== 'draft' || String(matchday.id) !== String(draftMatchday?.id)) return true;
  if (hasFantasyLockPassed(matchday)) return true;
  if (isFantasyPowerupActive(fantasyAccount?.fantasyPowerups, 'unlimitedTransfers', matchday.id)) return false;
  const state = getFantasySubmissionState(matchday.id);
  if (Number(state?.pendingReplacements) > 0) return false;
  return false;
}

function hasActiveMatchdaySubmission() {
  const state = getFantasySubmissionState(fantasyMatchday?.id);
  return Boolean(fantasyMatchday && state && Number(state.matchdayId) === Number(fantasyMatchday.id));
}

function showTransferLockMessage() {
  const matchday = getFantasyBuilderMatchday();
  if (matchday && matchday.status !== 'draft') {
    alert(`${matchday.name} is locked. Select the upcoming matchday to edit your squad.`);
    return;
  }
  if (matchday && String(matchday.id) !== String(getFantasyDraftMatchday()?.id)) {
    alert('Only the current matchday and the one after it are available for editing.');
    return;
  }
  if (!matchday && fantasyMatchday) {
    alert('Matchday is live. Transfers are locked until it ends.');
    return;
  }
  if (hasFantasyLockPassed(matchday || undefined)) {
    alert('Squads are locked because the matchday start time has passed.');
    return;
  }
  if (!matchday) return;
  const state = getFantasySubmissionState(matchday.id);
  const limit = getMatchdayTransferLimit(matchday);
  const used = Number(state?.transfersUsed) || 0;
  alert(`No transfers remaining during the draft. You have used ${used}/${limit}.`);
}

function getMatchdayTransferLimit(matchday) {
  if (!matchday || matchday.transferLimit === undefined) return 1;
  return Math.max(0, Number(matchday.transferLimit) || 0);
}

function getFantasyBudgetState(account, team) {
  const snapshot = { ...(account?.fantasyPriceSnapshot || {}) };
  const baseBudget = Number(account?.fantasyBudget) || FANTASY_TEAM_LIMIT;
  let budget = baseBudget;
  let changed = !account?.fantasyPriceSnapshot;
  (team || []).filter(Boolean).forEach((playerId) => {
    const player = getPlayerById(playerId);
    if (!player) return;
    const currentValue = Number(player.value) || 0;
    if (snapshot[playerId] === undefined) {
      snapshot[playerId] = currentValue;
      changed = true;
      return;
    }
    const difference = currentValue - Number(snapshot[playerId]);
    if (difference !== 0) {
      budget += difference;
      snapshot[playerId] = currentValue;
      changed = true;
    }
  });
  Object.keys(snapshot).forEach((playerId) => {
    if (!(team || []).includes(playerId)) {
      delete snapshot[playerId];
      changed = true;
    }
  });
  return { budget, snapshot, changed };
}

function getCurrentFantasyBudget(team) {
  const squad = getFantasyBuilderSquad();
  return getFantasyBudgetState({
    ...fantasyAccount,
    fantasyBudget: squad?.fantasyBudget ?? fantasyAccount?.fantasyBudget,
    fantasyPriceSnapshot: squad?.fantasyPriceSnapshot ?? fantasyAccount?.fantasyPriceSnapshot
  }, team).budget;
}

function getOrderedFantasyMatchdays() {
  return fantasyMatchdays
    .map((matchday, index) => ({ matchday, index }))
    .sort((left, right) => (Number(left.matchday.order ?? left.index) - Number(right.matchday.order ?? right.index)))
    .map(({ matchday }) => matchday);
}

function recordFantasyTransfer(transferType = 'direct') {
  const matchday = getFantasyDraftMatchday();
  if (!matchday && fantasyMatchday) {
    showTransferLockMessage();
    return false;
  }
  if (!matchday) return true;
  if (hasFantasyLockPassed(matchday)) {
    showTransferLockMessage();
    return false;
  }
  if (isFantasyPowerupActive(fantasyAccount?.fantasyPowerups, 'unlimitedTransfers', matchday.id)) return true;
  const state = getFantasySubmissionState(matchday.id);
  const team = getStoredFantasyTeam(matchday.id).filter(Boolean);
  if (!state && team.length < FANTASY_TEAM_SIZE) return true;
  const transfersUsed = Number(state?.transfersUsed) || 0;
  const pendingReplacements = Number(state?.pendingReplacements) || 0;
  if (transferType === 'incoming' && pendingReplacements > 0) {
    saveFantasySubmissionState({ ...state, matchdayId: matchday.id, pendingReplacements: pendingReplacements - 1 });
    return true;
  }
  if (transferType === 'outgoing' && pendingReplacements > 0) {
    showTransferLockMessage();
    return false;
  }
  const transferLimit = getMatchdayTransferLimit(matchday);
  const isExtraTransfer = transfersUsed >= transferLimit;
  if (isExtraTransfer && !confirm('This transfer is over your matchday allowance and will cost 4 matchday points. Continue?')) return false;
  saveFantasySubmissionState({
    ...state,
    matchdayId: matchday.id,
    transfersUsed: transfersUsed + 1,
    pendingReplacements: pendingReplacements + (transferType === 'outgoing' ? 1 : 0),
    transferPenalty: (Number(state?.transferPenalty) || 0) + (isExtraTransfer ? 4 : 0)
  });
  return true;
}

function saveActiveFantasyTransfer() {
  if (hasActiveMatchdaySubmission() && !getFantasyDraftMatchday()) {
    saveFantasyTeamToStorage().catch((error) => alert(error.message));
  }
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
      await saveFantasyDb({ ...db, users });
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

  document.getElementById('close-player-detail')?.addEventListener('click', () => {
    document.getElementById('player-detail-overlay').hidden = true;
  });
  document.getElementById('player-detail-overlay')?.addEventListener('click', (event) => {
    if (event.target.id === 'player-detail-overlay') event.currentTarget.hidden = true;
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

  renderBuildMatchdays();
  renderBuildBoard();
}

function renderSquadSubmissionStatus() {
  const status = document.getElementById('squad-submit-status');
  const submitButton = document.getElementById('submitTeam');
  const saveButton = document.getElementById('saveTeam');
  if (!status) return;
  if (saveButton) saveButton.disabled = !getCurrentFantasyUser();
  if (squadCountdownTimer) clearInterval(squadCountdownTimer);
  squadCountdownTimer = null;
  const state = getFantasySubmissionState();
  const upcoming = fantasyMatchdays.find((matchday) => matchday.status === 'draft');
  const active = fantasyMatchday;
  const viewedMatchday = getFantasyBuilderMatchday();
  if (viewedMatchday && (viewedMatchday.status !== 'draft' || String(viewedMatchday.id) !== String(upcoming?.id))) {
    status.innerHTML = `<strong>${viewedMatchday.name} is locked</strong><span>Select the upcoming matchday to edit or submit that squad.</span>`;
    if (saveButton) saveButton.disabled = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Select upcoming matchday';
    }
    return;
  }
  if (hasFantasyLockPassed()) {
    const lockedMatchday = getFantasyLockMatchday();
    status.innerHTML = `<strong>${lockedMatchday?.name || 'This matchday'} squad locked</strong><span>The squad lock time has passed. Transfers and submissions are closed.</span>`;
    if (saveButton) saveButton.disabled = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Squad locked';
    }
    return;
  }
  if (active && !upcoming) {
    status.innerHTML = `<strong>${active.name} is live</strong><span>Transfers and squad submissions are locked until it ends.</span>`;
    if (saveButton) saveButton.disabled = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Transfers locked';
    }
    return;
  }
  const draftState = state && Number(state.matchdayId) === Number(upcoming?.id) ? state : null;
  const transferLimit = getMatchdayTransferLimit(upcoming);
  const transfersRemaining = Math.max(0, transferLimit - (Number(draftState?.transfersUsed) || 0));
  const pendingReplacements = Number(draftState?.pendingReplacements) || 0;
  status.innerHTML = upcoming
    ? `<strong>${active ? `Live: ${active.name} · Next: ${upcoming.name}` : `Next: ${upcoming.name}`}</strong><span>${pendingReplacements ? `${pendingReplacements} replacement pending. Add a player to complete it.` : `${transfersRemaining} of ${transferLimit} transfers available; each extra transfer costs 4 points.`}</span>`
    : '<strong>Squad draft</strong><span>Build your team and submit it when a matchday is scheduled.</span>';
  if (upcoming?.startAt) {
    status.insertAdjacentHTML('beforeend', '<span class="squad-countdown-label">Squad lock in <strong id="squad-countdown"></strong></span>');
    renderSquadCountdown(upcoming.startAt);
  }
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = draftState ? 'Save squad' : 'Submit squad';
  }
}

function renderBuildMatchdays() {
  const container = document.getElementById('build-matchdays');
  if (!container) return;

  const matchdays = getBuildVisibleMatchdays();
  if (matchdays.length === 0) {
    viewedFantasyMatchdayId = null;
    container.innerHTML = '<div class="matchday-empty">No matchdays have been created yet.</div>';
    return;
  }
  const activeMatchday = matchdays.find((matchday) => matchday.status === 'active');
  const viewedIndex = Math.max(0, matchdays.findIndex((matchday) => String(matchday.id) === String(viewedFantasyMatchdayId)));
  const viewedMatchday = matchdays[viewedIndex] || matchdays[0];
  viewedFantasyMatchdayId = viewedMatchday.id;

  container.innerHTML = `
    <div class="gameweek-nav">
      <button class="gameweek-arrow" type="button" data-gameweek-index="${viewedIndex - 1}" ${viewedIndex === 0 ? 'disabled' : ''} aria-label="Previous matchday">&lsaquo;</button>
      <div class="gameweek-current">
        <p class="section-title">Gameweek</p>
        <h2>${viewedMatchday.name}</h2>
        <span>${viewedMatchday.status === 'active' ? 'Live' : viewedMatchday.status === 'ended' ? 'Complete' : 'Upcoming'} · ${getMatchdayTransferLimit(viewedMatchday)} transfer${getMatchdayTransferLimit(viewedMatchday) === 1 ? '' : 's'}</span>
      </div>
      <button class="gameweek-arrow" type="button" data-gameweek-index="${viewedIndex + 1}" ${viewedIndex === matchdays.length - 1 ? 'disabled' : ''} aria-label="Next matchday">&rsaquo;</button>
    </div>
    <label class="matchday-view-select">Viewing gameweek
      <select id="build-matchday-select">
        ${matchdays.map((matchday) => `<option value="${matchday.id}" ${String(matchday.id) === String(viewedFantasyMatchdayId) ? 'selected' : ''}>${matchday.name}</option>`).join('')}
      </select>
    </label>
    <p class="matchday-notice">${activeMatchday ? 'The live squad is locked. You can build and submit for the upcoming draft.' : 'Transfers are limited during the draft and lock when the matchday starts.'}</p>
  `;
  container.querySelectorAll('[data-gameweek-index]').forEach((button) => {
    button.addEventListener('click', () => {
      setViewedFantasyMatchdayId(matchdays[Number(button.dataset.gameweekIndex)]?.id || viewedFantasyMatchdayId);
      renderBuildMatchdays();
      renderBuildBoard();
    });
  });
  document.getElementById('build-matchday-select')?.addEventListener('change', (event) => {
    setViewedFantasyMatchdayId(Number(event.target.value) || null);
    renderBuildMatchdays();
    renderBuildBoard();
  });
}

function setViewedFantasyMatchdayId(matchdayId) {
  viewedFantasyMatchdayId = matchdayId;
  try {
    localStorage.setItem(getFantasyUserStorageKey('pitchballFantasyViewedMatchdayId'), String(matchdayId));
  } catch (error) {
    // Keep the in-page selection when browser storage is unavailable.
  }
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

function renderFantasyPowerups() {
  const container = document.getElementById('fantasy-powerups');
  if (!container) return;
  const target = getFantasyPowerupTargetMatchday();
  const powerups = fantasyAccount?.fantasyPowerups || {};
  if (!target) {
    container.innerHTML = '<p class="powerup-empty">Powerups become available when a matchday is scheduled.</p>';
    return;
  }
  const locked = transfersAreLocked();
  const available = areFantasyPowerupsAvailable(target);
  const powerupItems = [
    { key: 'tripleCaptain', name: 'Triple Captain', description: "Triple your captain's points for this matchday." },
    { key: 'unlimitedTransfers', name: 'Unlimited Transfers', description: 'Make unlimited squad changes for this matchday.' }
  ];
  container.innerHTML = `
    <div class="powerup-heading"><span class="section-title">Powerups</span><small>${target.name}</small></div>
    <div class="powerup-list">
      ${powerupItems.map(({ key, name, description }) => {
        const used = Boolean(powerups[key]?.used);
        const active = isFantasyPowerupActive(powerups, key, target.id);
        return `<div class="powerup-item ${used ? 'is-used' : ''}">
          <div><strong>${name}</strong><span>${!available ? 'Available from Matchday 2' : used ? active ? 'Active for this matchday' : 'Already used' : description}</span></div>
          <button class="secondary-btn" type="button" onclick="useFantasyPowerup('${key}')" ${used || locked || !available ? 'disabled' : ''}>${used ? 'Used' : !available ? 'Locked' : locked ? 'Locked' : 'Use'}</button>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderFantasyNotifications() {
  const container = document.getElementById('fantasy-notifications');
  if (!container) return;
  const team = getFantasyBuilderTeam().filter(Boolean);
  const target = getFantasyPowerupTargetMatchday();
  const notifications = [];
  if (target?.startAt && !hasFantasyLockPassed(target)) {
    notifications.push(`Squad lock: ${target.name} locks at ${new Date(target.startAt).toLocaleString()}.`);
  }
  if (team.length < FANTASY_TEAM_SIZE) {
    notifications.push(`Your squad is incomplete: select ${FANTASY_TEAM_SIZE - team.length} more player${FANTASY_TEAM_SIZE - team.length === 1 ? '' : 's'}.`);
  }
  const captain = getFantasyBuilderCaptain();
  if (team.length >= FANTASY_STARTER_COUNT && !team.slice(0, FANTASY_STARTER_COUNT).includes(captain)) {
    notifications.push('Choose a captain from your starting four.');
  }
  if (target && areFantasyPowerupsAvailable(target)) {
    const unusedPowerups = ['tripleCaptain', 'unlimitedTransfers'].filter((powerup) => !hasFantasyPowerupBeenUsed(powerup));
    if (unusedPowerups.length) notifications.push(`Unused powerups: ${unusedPowerups.map((powerup) => powerup === 'tripleCaptain' ? 'Triple Captain' : 'Unlimited Transfers').join(' and ')}.`);
  }
  const priceChanges = team.map((playerId) => {
    const player = getPlayerById(playerId);
    const previousValue = Number(fantasyAccount?.fantasyPriceSnapshot?.[playerId]);
    return player && Number.isFinite(previousValue) && Number(player.value) !== previousValue
      ? `${player.name} is now ${formatMoney(player.value)} (was ${formatMoney(previousValue)}).`
      : null;
  }).filter(Boolean);
  priceChanges.forEach((change) => notifications.push(change));
  container.innerHTML = notifications.length
    ? `<div class="notification-heading"><span class="section-title">Notifications</span><small>${notifications.length}</small></div><ul>${notifications.map((notification) => `<li>${notification}</li>`).join('')}</ul>`
    : '<div class="notification-heading"><span class="section-title">Notifications</span><small>All clear</small></div>';
}

window.useFantasyPowerup = async function (powerupName) {
  if (!ensureFantasyLogin()) return;
  const target = getFantasyPowerupTargetMatchday();
  if (!target || target.status !== 'draft' || !areFantasyPowerupsAvailable(target) || transfersAreLocked()) {
    if (target && !areFantasyPowerupsAvailable(target)) alert('Powerups become available from Matchday 2.');
    else showTransferLockMessage();
    return;
  }
  if (!['tripleCaptain', 'unlimitedTransfers'].includes(powerupName) || hasFantasyPowerupBeenUsed(powerupName)) return;
  if (powerupName === 'tripleCaptain' && !getFantasyBuilderCaptain(target)) {
    alert('Choose a captain before using Triple Captain.');
    return;
  }
  try {
    const user = getCurrentFantasyUser();
    const db = await getFantasyDb();
    const accountKey = user.username.toLowerCase();
    const account = db.users?.[accountKey];
    if (!account) throw new Error('Your account could not be found. Please sign in again.');
    const fantasyPowerups = {
      ...(account.fantasyPowerups || {}),
      [powerupName]: { used: true, matchdayId: target.id, usedAt: new Date().toISOString() }
    };
    const updatedAccount = { ...account, fantasyPowerups };
    await saveFantasyDb({ ...db, users: { ...(db.users || {}), [accountKey]: updatedAccount } });
    fantasyAccount = updatedAccount;
    fantasyUsers[accountKey] = updatedAccount;
    renderBuildBoard();
    alert(`${powerupName === 'tripleCaptain' ? 'Triple Captain' : 'Unlimited Transfers'} activated for ${target.name}.`);
  } catch (error) {
    alert(error.message || 'Unable to activate powerup.');
  }
};

function renderBuildBoard() {
  const teamSummary = document.getElementById('teamSummary');
  const teamTotalLabel = document.getElementById('teamTotal');
  const teamPointsLabel = document.getElementById('teamPoints');
  const teamPointsMatchdayLabel = document.getElementById('teamPointsMatchday');
  const teamCountLabel = document.getElementById('teamCount');
  const teamRankLabel = document.getElementById('teamRank');
  const budgetBar = document.getElementById('budgetBar');

  renderSquadSubmissionStatus();
  renderFantasyNotifications();
  renderFantasyPowerups();

  const storedTeam = getFantasyBuilderTeam();
  const team = Array.from({ length: FANTASY_TEAM_SIZE }, (_, index) => storedTeam[index] || null);
  const occupiedTeam = team.filter(Boolean);
  const total = getTeamTotal(occupiedTeam);
  const budget = getCurrentFantasyBudget(occupiedTeam);
  const remaining = budget - total;
  const viewedMatchday = fantasyMatchdays.find((matchday) => String(matchday.id) === String(viewedFantasyMatchdayId));
  const storedMatchdayPoints = viewedMatchday && fantasyAccount?.fantasyMatchdayPoints?.[viewedMatchday.id];
  const teamPoints = viewedMatchday
    ? storedMatchdayPoints !== undefined
      ? Number(storedMatchdayPoints) || 0
      : calculateFantasyManagerPoints(fantasyAccount || { fantasyTeam: occupiedTeam }, viewedMatchday)
    : 0;

  const userBudgetLabel = document.getElementById('userBudget');
  const budgetLimitLabel = document.getElementById('budgetLimitLabel');
  if (userBudgetLabel) userBudgetLabel.textContent = formatMoney(budget);
  if (budgetLimitLabel) budgetLimitLabel.textContent = `Available / ${formatMoney(budget)}`;
  if (teamTotalLabel) {
    teamTotalLabel.textContent = formatMoney(total);
    teamTotalLabel.className = remaining >= 0 ? 'budget-value under' : 'budget-value over';
  }

  if (teamCountLabel) {
    teamCountLabel.textContent = `${occupiedTeam.length}/${FANTASY_TEAM_SIZE}`;
  }

  if (teamPointsLabel) teamPointsLabel.textContent = `${teamPoints} pts`;
  if (teamPointsMatchdayLabel) teamPointsMatchdayLabel.textContent = viewedMatchday?.name || 'No matchday selected';
  if (teamRankLabel) {
    const currentUser = getCurrentFantasyUser();
    const rankRows = viewedMatchday && viewedMatchday.status !== 'draft'
      ? getSubmittedFantasyUsers().map((user) => ({
        username: user.username,
        points: user.fantasyMatchdayPoints?.[viewedMatchday.id] !== undefined
          ? Number(user.fantasyMatchdayPoints[viewedMatchday.id]) || 0
          : calculateFantasyManagerPoints(user, viewedMatchday)
      })).sort((left, right) => right.points - left.points)
      : [];
    const rank = currentUser ? rankRows.findIndex((row) => row.username === currentUser.username) : -1;
    teamRankLabel.textContent = rank >= 0 ? `#${rank + 1}` : '--';
  }

  if (budgetBar) {
    const usage = budget > 0 ? Math.min((total / budget) * 100, 100) : 100;
    budgetBar.style.width = `${usage}%`;
  }

  const selectedPlayers = occupiedTeam.map((playerId) => getPlayerById(playerId)).filter(Boolean);
  const captain = getFantasyBuilderCaptain();
  const editorLocked = transfersAreLocked();
  if (teamSummary) {
    if (selectedPlayers.length === 0) {
      teamSummary.innerHTML = '<p class="empty-state">Your squad is empty. Pick your five-man team from the list below.</p>';
    } else {
      teamSummary.innerHTML = selectedPlayers.map((player) => `
        <div class="selected-player">
          ${player.team ? `<span class="team-avatar"><img src="${getTeamLogoPath(player.team)}" alt="" loading="lazy" onerror="this.remove()"></span>` : ''}
          <div>
            <strong>${player.name} ${getPlayerAvailabilityBadge(player)}</strong>
            <span class="player-role">${team.indexOf(player.id) < 4 ? 'Starter' : 'Substitute'} · ${player.team || 'Team unknown'} · ${getPlayerMatchdayPoints(player)} pts</span>
          </div>
          <div class="selected-player-actions">
            ${team.indexOf(player.id) < 4 ? `<button class="small-btn captain-btn ${captain === player.id ? 'selected' : ''}" type="button" onclick="setFantasyCaptain('${player.id}')" ${editorLocked ? 'disabled' : ''}>${captain === player.id ? 'Captain' : 'Make captain'}</button>` : ''}
          </div>
        </div>
      `).join('');
    }
  }

  document.querySelectorAll('[data-slot]').forEach((slot) => {
    const slotIndex = Number(slot.dataset.slot);
    const player = getPlayerById(team[slotIndex]);
    slot.innerHTML = player ? `
      <div class="slot-player-card">
        <button class="shirt-player" type="button" draggable="${!editorLocked}" ondragstart="startFantasySlotDrag(event, ${slotIndex})" onclick="openPlayerDetails('${player.id}')" aria-label="View ${player.name} profile">
          <span class="shirt-wrap">
            <span class="team-shirt" style="--shirt-color: ${player.teamColor || '#00f0ff'}"></span>
            ${captain === player.id ? '<span class="court-captain-badge">C</span>' : ''}
          </span>
          <strong>${player.name} ${getPlayerAvailabilityBadge(player)}</strong>
          <small>${slotIndex === 4 ? 'Substitute' : 'Starter'} · ${player.team || 'Team unknown'} · ${getPlayerMatchdayPoints(player)} pts</small>
        </button>
        <div class="slot-player-actions">
          <button class="slot-action-btn" type="button" onclick="openPlayerPicker(${slotIndex})" aria-label="Change ${player.name}" ${editorLocked ? 'disabled' : ''}>Change</button>
          <button class="slot-action-btn" type="button" onclick="removePlayerFromSlot(${slotIndex})" aria-label="Remove ${player.name}" ${editorLocked ? 'disabled' : ''}>Remove</button>
        </div>
      </div>
    ` : `<button class="add-slot" type="button" onclick="openPlayerPicker(${slotIndex})" aria-label="Add ${slotIndex === 4 ? 'substitute' : 'starter'}" ${editorLocked ? 'disabled' : ''}><span>+</span><small>${slotIndex === 4 ? 'Add substitute' : 'Add player'}</small></button>`;
    slot.ondragover = (event) => {
      event.preventDefault();
      if (!transfersAreLocked()) slot.classList.add('is-drag-target');
    };
    slot.ondragleave = () => slot.classList.remove('is-drag-target');
    slot.ondrop = (event) => {
      event.preventDefault();
      slot.classList.remove('is-drag-target');
      dropFantasySlot(event, slotIndex);
    };
  });
}

window.startFantasySlotDrag = function (event, slotIndex) {
  if (!ensureFantasyLogin() || transfersAreLocked()) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', String(slotIndex));
};

window.dropFantasySlot = function (event, targetIndex) {
  if (!ensureFantasyLogin() || transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
  if (!Number.isInteger(sourceIndex) || sourceIndex === targetIndex) return;
  const team = Array.from({ length: FANTASY_TEAM_SIZE }, (_, index) => getFantasyBuilderTeam()[index] || null);
  [team[sourceIndex], team[targetIndex]] = [team[targetIndex], team[sourceIndex]];
  saveFantasyBuilderTeam(team);
  renderBuildBoard();
  saveActiveFantasyTransfer();
};

function openPlayerPicker(slotIndex) {
  if (!ensureFantasyLogin()) return;
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const picker = document.getElementById('player-picker');
  const list = document.getElementById('player-picker-list');
  const team = getFantasyBuilderTeam();
  const selected = team[slotIndex];
  document.getElementById('player-picker-title').textContent = slotIndex === 4 ? 'Choose substitute' : `Choose starter ${slotIndex + 1}`;
  list.innerHTML = FANTASY_PLAYERS.filter((player) => !team.includes(player.id) || player.id === selected).map((player) => {
    const availability = getPlayerAvailability(player.id);
    const reason = availability?.reason ? `<small class="availability-reason-copy">${escapeFantasyHtml(availability.reason)}</small>` : '';
    return `
      <button class="picker-player" type="button" onclick="selectPlayerForSlot('${player.id}', ${slotIndex})">
        <span class="team-shirt mini-shirt" style="--shirt-color: ${player.teamColor || '#00f0ff'}"></span>
        <span><strong>${player.name} ${getPlayerAvailabilityBadge(player)}</strong><small>${player.team || 'Team unknown'} · ${formatMoney(player.value)} · ${getPlayerMatchdayPoints(player)} pts</small>${reason}</span>
      </button>
    `;
  }).join('') || '<p class="empty-state">All players are already in your squad.</p>';
  picker.hidden = false;
}

window.openPlayerPicker = openPlayerPicker;

window.selectPlayerForSlot = function (playerId, slotIndex) {
  if (!ensureFantasyLogin() || transfersAreLocked()) {
    if (transfersAreLocked()) showTransferLockMessage();
    return;
  }
  const team = Array.from({ length: FANTASY_TEAM_SIZE }, (_, index) => getFantasyBuilderTeam()[index] || null);
  if (team[slotIndex] === playerId) return;
  const existingIndex = team.indexOf(playerId);
  const hasTransferBaseline = Boolean(getFantasySubmissionState(getFantasyBuilderMatchday()?.id));
  const isTransfer = existingIndex < 0
    && (team.filter(Boolean).length === FANTASY_TEAM_SIZE || hasTransferBaseline);
  if (existingIndex >= 0) team[existingIndex] = null;
  team[slotIndex] = playerId;

  const transferType = getFantasySubmissionState(getFantasyBuilderMatchday()?.id)?.pendingReplacements > 0 ? 'incoming' : 'direct';
  if (isTransfer && !recordFantasyTransfer(transferType)) return;
  saveFantasyBuilderTeam(team);
  document.getElementById('player-picker').hidden = true;
  renderBuildBoard();
  saveActiveFantasyTransfer();
};

window.removePlayerFromSlot = function (slotIndex) {
  if (!ensureFantasyLogin() || transfersAreLocked()) return;
  const team = Array.from({ length: FANTASY_TEAM_SIZE }, (_, index) => getFantasyBuilderTeam()[index] || null);
  const playerId = team[slotIndex];
  if (!playerId || !recordFantasyTransfer('outgoing')) return;
  team[slotIndex] = null;
  if (playerId === getFantasyBuilderCaptain()) saveFantasyBuilderCaptain(null);
  saveFantasyBuilderTeam(team);
  renderBuildBoard();
};

window.setFantasyCaptain = function (playerId) {
  if (!ensureFantasyLogin()) return;
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const team = getFantasyBuilderTeam();
  if (team.indexOf(playerId) > FANTASY_STARTER_COUNT - 1) return;
  saveFantasyBuilderCaptain(getFantasyBuilderCaptain() === playerId ? null : playerId);
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

  const team = getFantasyBuilderTeam();
  if (team.includes(playerId)) {
    removePlayerFromTeam(playerId);
    return;
  }

  if (team.length >= FANTASY_TEAM_SIZE) {
    alert('Your team already has 5 players. Remove one before adding another.');
    return;
  }

  const transferType = getFantasySubmissionState(getFantasyBuilderMatchday()?.id)?.pendingReplacements > 0 ? 'incoming' : 'direct';
  if (!recordFantasyTransfer(transferType)) return;

  team.push(playerId);
  saveFantasyBuilderTeam(team);
  renderBuildBoard();
  saveActiveFantasyTransfer();
};

window.removePlayerFromTeam = function (playerId) {
  if (!ensureFantasyLogin()) {
    return;
  }
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const currentTeam = getFantasyBuilderTeam();
  if (!currentTeam.includes(playerId) || !recordFantasyTransfer('outgoing')) return;
  const team = currentTeam.filter((id) => id !== playerId);
  if (playerId === getFantasyBuilderCaptain()) saveFantasyBuilderCaptain(null);
  saveFantasyBuilderTeam(team);
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
  const team = getFantasyBuilderTeam();
  const hasTransferBaseline = Boolean(getFantasySubmissionState(getFantasyBuilderMatchday()?.id));
  const isTransfer = !team.includes(playerId)
    && (team.filter(Boolean).length === FANTASY_TEAM_SIZE || hasTransferBaseline);
  const transferType = getFantasySubmissionState(getFantasyBuilderMatchday()?.id)?.pendingReplacements > 0 ? 'incoming' : 'direct';
  if (isTransfer && !recordFantasyTransfer(transferType)) return;
  event.preventDefault();
  const list = team.filter((id) => id !== playerId);
  if (list.length >= FANTASY_TEAM_SIZE) {
    list.splice(FANTASY_STARTER_COUNT, 1);
  }
  list.push(playerId);
  while (list.length > FANTASY_TEAM_SIZE) {
    list.shift();
  }
  saveFantasyBuilderTeam(list);
  renderBuildBoard();
  saveActiveFantasyTransfer();
};

window.saveFantasyTeamToStorage = async function () {
  if (!ensureFantasyLogin()) {
    return;
  }
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const targetMatchday = getFantasyDraftMatchday();
  if (!targetMatchday) {
    if (fantasyMatchday) showTransferLockMessage();
    else alert('There is no upcoming matchday to submit for yet.');
    return;
  }
  if (hasFantasyLockPassed(targetMatchday)) {
    showTransferLockMessage();
    return;
  }
  if (String(getFantasyBuilderMatchday()?.id) !== String(targetMatchday.id)) {
    showTransferLockMessage();
    return;
  }
  const team = getFantasyBuilderTeam(targetMatchday).filter(Boolean);
  if (team.length !== FANTASY_TEAM_SIZE) {
    alert('Your squad must contain exactly 5 players.');
    return;
  }
  if (team.length > FANTASY_TEAM_SIZE) {
    alert('Your squad cannot exceed 5 players.');
    return;
  }
  const budget = getCurrentFantasyBudget(team);
  if (getTeamTotal(team) > budget) {
    alert(`Your squad exceeds your ${formatMoney(budget)} budget.`);
    return;
  }
  const starterCount = team.slice(0, FANTASY_STARTER_COUNT).length;
  if (starterCount < FANTASY_STARTER_COUNT) {
    alert('Your squad must include 4 starters and 1 substitute.');
    return;
  }
  const captain = getFantasyBuilderCaptain(targetMatchday);
  if (!captain || team.slice(0, FANTASY_STARTER_COUNT).indexOf(captain) < 0) {
    alert('Choose a captain from your four starters.');
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

    const activeMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active');
    if (activeMatchday && !activeMatchday.managerSnapshots) {
      const managerSnapshots = buildFantasyManagerSnapshots(users, activeMatchday.id);
      fantasyMatchdays = fantasyMatchdays.map((matchday) => matchday.id === activeMatchday.id
        ? { ...matchday, managerSnapshots }
        : matchday);
      fantasyMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active') || null;
    }

    const currentSubmission = getFantasySubmissionState(targetMatchday.id);
    const transfersUsed = Number(currentSubmission?.transfersUsed) || 0;
    const currentMatchdaySquad = getStoredFantasyMatchdaySquad(targetMatchday.id) || {};
    const savedMatchdaySquads = { ...(users[accountKey].fantasyMatchdaySquads || {}) };
    const previousMatchdayId = users[accountKey].fantasySubmittedMatchdayId
      ?? getOrderedFantasyMatchdays()
        .filter((matchday) => String(matchday.id) !== String(targetMatchday.id) && matchday.status !== 'draft')
        .at(-1)?.id;
    const previousSquad = savedMatchdaySquads[String(previousMatchdayId)];
    const previousSquadHasTeam = Array.isArray(previousSquad?.fantasyTeam)
      || previousSquad?.fantasyTeam && typeof previousSquad.fantasyTeam === 'object';
    const previousMatchday = getOrderedFantasyMatchdays()
      .find((matchday) => String(matchday.id) === String(previousMatchdayId));
    const previousManagerSnapshot = previousMatchday?.managerSnapshots?.[accountKey];
    if (previousMatchdayId !== undefined && previousMatchdayId !== null
      && String(previousMatchdayId) !== String(targetMatchday.id)
      && Array.isArray(previousManagerSnapshot?.fantasyTeam)) {
      savedMatchdaySquads[String(previousMatchdayId)] = {
        ...previousSquad,
        ...previousManagerSnapshot,
        fantasyTeam: [...previousManagerSnapshot.fantasyTeam],
        submitted: true,
        transfersUsed: Number(previousSquad?.transfersUsed) || 0
      };
    } else if (previousMatchdayId !== undefined && previousMatchdayId !== null
      && String(previousMatchdayId) !== String(targetMatchday.id)
      && Array.isArray(users[accountKey].fantasyTeam)
      && !previousSquadHasTeam) {
      savedMatchdaySquads[String(previousMatchdayId)] = {
        ...previousSquad,
        fantasyTeam: [...users[accountKey].fantasyTeam],
        fantasyCaptain: users[accountKey].fantasyCaptain || null,
        fantasyPowerups: users[accountKey].fantasyPowerups || {},
        transferPenalty: Number(users[accountKey].fantasyTransferPenalty) || 0,
        submitted: true,
        transfersUsed: Number(users[accountKey].fantasyTransfersUsed) || 0
      };
    }
    const budgetState = getFantasyBudgetState({
      ...users[accountKey],
      fantasyBudget: currentMatchdaySquad.fantasyBudget ?? users[accountKey].fantasyBudget,
      fantasyPriceSnapshot: currentMatchdaySquad.fantasyPriceSnapshot ?? users[accountKey].fantasyPriceSnapshot
    }, team);
    const transferPenalty = Number(currentSubmission?.transferPenalty) || 0;
    const fantasyMatchdaySquads = {
      ...savedMatchdaySquads,
      [targetMatchday.id]: {
        ...currentMatchdaySquad,
        fantasyTeam: team,
        fantasyCaptain: captain,
        fantasyBudget: budgetState.budget,
        fantasyPriceSnapshot: budgetState.snapshot,
        submitted: true,
        transfersUsed,
        transferPenalty
      }
    };
    users[accountKey] = {
      ...users[accountKey],
      fantasyMatchdaySquads,
      fantasyTeam: team,
      fantasyCaptain: captain,
      fantasyBudget: budgetState.budget,
      fantasyPriceSnapshot: budgetState.snapshot,
      fantasySubmittedMatchdayId: targetMatchday.id,
      fantasyTransfersUsed: transfersUsed,
      fantasyTransferPenalty: transferPenalty
    };
    fantasyAccount = users[accountKey];
    await saveFantasyDb({ ...db, users, fantasyMatchdays });
    saveFantasySubmissionState({ matchdayId: targetMatchday.id, transfersUsed });
    renderSquadSubmissionStatus();
    alert(`Squad submitted for ${targetMatchday.name}.`);
  } catch (error) {
    alert(error.message || 'Unable to save your team. Please try again.');
  }
};

window.saveFantasyDraftToStorage = function () {
  if (!ensureFantasyLogin()) return;
  if (transfersAreLocked()) {
    showTransferLockMessage();
    return;
  }
  const team = getFantasyBuilderTeam().filter(Boolean);
  const budget = getCurrentFantasyBudget(team);
  if (getTeamTotal(team) > budget) {
    alert(`Your draft exceeds your ${formatMoney(budget)} budget. Remove or replace players before saving.`);
    return;
  }
  renderSquadSubmissionStatus();
  alert('Draft saved on this device. Submit the squad before the matchday starts.');
};

async function renderLeaderboard() {
  const table = document.getElementById('leaderboardTable');
  if (!table) return;

  table.innerHTML = '<tbody><tr><td colspan="4">Loading rankings...</td></tr></tbody>';
  try {
    const currentUser = getCurrentFantasyUser();
    const db = await getFantasyDb();
    const orderedMatchdays = getOrderedFantasyMatchdays();
    const matchdayForLastPoints = orderedMatchdays.find((matchday) => matchday.status === 'active')
      || orderedMatchdays.filter((matchday) => matchday.status === 'ended').at(-1);
    const rows = Object.entries(db.users || {})
      .filter(([, user]) => Array.isArray(user.fantasyTeam) && user.fantasyTeam.length === FANTASY_TEAM_SIZE)
      .map(([accountKey, user]) => {
        const savedPoints = user.fantasyMatchdayPoints || {};
        const total = orderedMatchdays
          .filter((matchday) => matchday.status === 'ended' || matchday.status === 'active')
          .reduce((sum, matchday) => sum + (savedPoints[matchday.id] === undefined
            ? calculateFantasyManagerPoints(user, matchday)
            : Number(savedPoints[matchday.id]) || 0), 0);
        const lastPoints = matchdayForLastPoints
          ? savedPoints[matchdayForLastPoints.id] === undefined
            ? calculateFantasyManagerPoints(user, matchdayForLastPoints)
            : Number(savedPoints[matchdayForLastPoints.id]) || 0
          : 0;
        return {
          accountKey,
          user,
          username: user.username || accountKey,
          total,
          lastPoints
        };
      });
    rows.sort((left, right) => {
      const leftValue = left[leaderboardSort.key];
      const rightValue = right[leaderboardSort.key];
      const comparison = leaderboardSort.key === 'username'
        ? String(leftValue).localeCompare(String(rightValue))
        : Number(leftValue) - Number(rightValue);
      return comparison * leaderboardSort.direction || right.total - left.total || left.username.localeCompare(right.username);
    });

    table.innerHTML = `
      <thead>
        <tr>
          <th>Rank</th>
          ${[
            { key: 'username', label: 'Manager' },
            { key: 'lastPoints', label: 'Last MD Points' },
            { key: 'total', label: 'Total' }
          ].map(({ key, label }) => {
            const active = leaderboardSort.key === key;
            const direction = active ? (leaderboardSort.direction === 1 ? 'asc' : 'desc') : '';
            return `<th aria-sort="${active ? direction : 'none'}"><button class="table-sort-button" type="button" data-leaderboard-sort="${key}">${label}<span class="table-sort-indicator">${direction}</span></button></th>`;
          }).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.length === 0 ? '<tr><td colspan="4">No teams have been submitted yet.</td></tr>' : rows.map((entry, index) => `
          <tr>
            <td>#${index + 1}</td>
            <td><button class="manager-name-button" type="button" data-manager-index="${index}" aria-haspopup="dialog"></button></td>
            <td>${entry.lastPoints}</td>
            <td>${entry.total}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    table.querySelectorAll('[data-manager-index]').forEach((button) => {
      const entry = rows[Number(button.dataset.managerIndex)];
      if (!entry) return;
      button.textContent = `${entry.username}${currentUser && entry.username === currentUser.username ? ' (You)' : ''}`;
      button.addEventListener('click', () => openManagerTeamPreview(entry));
    });
    table.querySelectorAll('[data-leaderboard-sort]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.leaderboardSort;
        leaderboardSort = {
          key,
          direction: leaderboardSort.key === key ? leaderboardSort.direction * -1 : key === 'username' ? 1 : -1
        };
        renderLeaderboard();
      });
    });
  } catch (error) {
    table.innerHTML = '<tbody><tr><td colspan="4">Unable to load rankings right now.</td></tr></tbody>';
  }
  renderMatchdaySnapshots();
}

function openManagerTeamPreview(entry) {
  const overlay = document.getElementById('manager-team-overlay');
  const closeButton = document.getElementById('close-manager-team');
  const title = document.getElementById('manager-team-title');
  const selector = document.getElementById('manager-team-matchday');
  const details = document.getElementById('manager-team-details');
  if (!overlay || !closeButton || !title || !selector || !details) return;

  title.textContent = entry.username;
  const availableMatchdays = getOrderedFantasyMatchdays().filter((matchday) =>
    getFantasyTeamPlayerIds(entry.user, matchday.id).length === FANTASY_TEAM_SIZE
  );
  selector.replaceChildren();
  availableMatchdays.forEach((matchday) => {
    const option = document.createElement('option');
    option.value = String(matchday.id);
    option.textContent = matchday.name;
    selector.append(option);
  });

  const preferredMatchday = availableMatchdays.find((matchday) => String(matchday.id) === String(viewedFantasyMatchdayId))
    || availableMatchdays.at(-1);
  if (!preferredMatchday) {
    selector.disabled = true;
    details.innerHTML = '<p class="empty-state">No saved team is available for this manager yet.</p>';
  } else {
    selector.disabled = false;
    selector.value = String(preferredMatchday.id);
    renderManagerTeamPreviewDetails(entry, preferredMatchday, details);
  }

  selector.onchange = () => {
    const matchday = availableMatchdays.find((item) => String(item.id) === String(selector.value));
    if (matchday) renderManagerTeamPreviewDetails(entry, matchday, details);
  };

  if (!overlay.dataset.listenersBound) {
    closeButton.addEventListener('click', () => { overlay.hidden = true; });
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.hidden = true;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !overlay.hidden) overlay.hidden = true;
    });
    overlay.dataset.listenersBound = 'true';
  }

  overlay.hidden = false;
  closeButton.focus();
}

function renderManagerTeamPreviewDetails(entry, matchday, details) {
  const squad = getFantasyMatchdaySquad(entry.user, matchday.id);
  const team = getFantasyTeamPlayerIds(entry.user, matchday.id);
  const captain = getPlayerById(squad?.fantasyCaptain);
  const savedPoints = entry.user.fantasyMatchdayPoints?.[matchday.id];
  const points = savedPoints === undefined
    ? calculateFantasyManagerPoints(entry.user, matchday)
    : Number(savedPoints) || 0;
  const powerups = Object.entries(squad?.fantasyPowerups || {})
    .filter(([, powerup]) => powerup?.used && String(powerup.matchdayId) === String(matchday.id))
    .map(([key]) => key === 'tripleCaptain' ? 'Triple Captain' : 'Unlimited Transfers');

  details.replaceChildren();
  const heading = document.createElement('div');
  heading.className = 'snapshot-heading';
  const matchdayName = document.createElement('strong');
  matchdayName.textContent = matchday.name;
  const captainName = document.createElement('span');
  captainName.textContent = `Captain: ${captain?.name || 'Not selected'}`;
  heading.append(matchdayName, captainName);

  const playerList = document.createElement('ul');
  playerList.className = 'snapshot-player-list manager-preview-player-list';
  const substitution = getFantasySubstitution(team, matchday);
  const replacedPlayer = getPlayerById(substitution?.replacedPlayerId);
  team.forEach((playerId, index) => {
    const player = getPlayerById(playerId);
    if (!player) return;
    const item = document.createElement('li');
    const identity = document.createElement('div');
    identity.className = 'manager-player-identity';
    const playerName = document.createElement('span');
    playerName.textContent = player.name;
    const role = document.createElement('small');
    const roleLabel = index < FANTASY_STARTER_COUNT ? 'Starter' : 'Substitute';
    const captainLabel = player.id === squad?.fantasyCaptain ? ' · Captain' : '';
    const substitutionLabel = matchday.status === 'ended' && index === FANTASY_STARTER_COUNT
      ? substitution
        ? ` · Came on for ${replacedPlayer?.name || 'a starter'}`
        : ' · Did not come on'
      : '';
    role.textContent = `${roleLabel}${captainLabel}${substitutionLabel}`;
    identity.append(playerName, role);
    const playerPoints = document.createElement('strong');
    playerPoints.className = 'manager-player-points';
    playerPoints.textContent = `${Number(matchday.playerStats?.[playerId]?.matchdayPoints) || 0} pts`;
    item.append(identity, playerPoints);
    playerList.append(item);
  });

  const summary = document.createElement('p');
  summary.className = 'snapshot-powerups';
  const usedTransfers = Number(squad?.transfersUsed) || 0;
  const transferPenalty = Number(squad?.transferPenalty) || 0;
  summary.textContent = `${points} points · ${usedTransfers} transfers · ${transferPenalty}-point penalty · Powerups: ${powerups.length ? powerups.join(', ') : 'None'}`;
  details.append(heading, playerList, summary);
}

function renderMatchdaySnapshots(selectedMatchdayId) {
  const selector = document.getElementById('snapshot-matchday-select');
  const details = document.getElementById('snapshot-details');
  if (!selector || !details) return;
  const currentUser = getCurrentFantasyUser();
  const snapshots = getOrderedFantasyMatchdays().filter((matchday) => matchday.status === 'ended' && matchday.managerSnapshots);
  if (!currentUser) {
    selector.innerHTML = '<option value="">Sign in to view your snapshots</option>';
    selector.disabled = true;
    details.innerHTML = '<p class="empty-state">Sign in to view the squad and powerups you used in previous matchdays.</p>';
    return;
  }
  if (snapshots.length === 0) {
    selector.innerHTML = '<option value="">No completed matchdays</option>';
    selector.disabled = true;
    details.innerHTML = '<p class="empty-state">Snapshots will appear when a matchday ends.</p>';
    return;
  }
  const activeSnapshot = snapshots.find((matchday) => String(matchday.id) === String(selectedMatchdayId)) || snapshots.at(-1);
  selector.disabled = false;
  selector.innerHTML = snapshots.map((matchday) => `<option value="${matchday.id}" ${matchday.id === activeSnapshot.id ? 'selected' : ''}>${matchday.name}</option>`).join('');
  const snapshot = activeSnapshot.managerSnapshots[currentUser.username.toLowerCase()];
  if (!snapshot) {
    details.innerHTML = `<p class="empty-state">No snapshot was recorded for your team in ${activeSnapshot.name}.</p>`;
  } else {
    const captain = getPlayerById(snapshot.fantasyCaptain);
    const powerups = Object.keys(snapshot.fantasyPowerups || {}).map((powerup) => powerup === 'tripleCaptain' ? 'Triple Captain' : 'Unlimited Transfers');
    details.innerHTML = `
      <div class="snapshot-heading"><strong>${activeSnapshot.name}</strong><span>Captain: ${captain?.name || 'Not selected'}</span></div>
      <ul class="snapshot-player-list">
        ${snapshot.fantasyTeam.map((playerId, index) => {
          const player = getPlayerById(playerId);
          return player ? `<li><span>${player.name}</span><small>${index < FANTASY_STARTER_COUNT ? 'Starter' : 'Substitute'}${player.id === snapshot.fantasyCaptain ? ' · Captain' : ''}</small></li>` : '';
        }).join('')}
      </ul>
      <p class="snapshot-powerups"><strong>Powerups used:</strong> ${powerups.length ? powerups.join(' · ') : 'None'}</p>
    `;
  }
  selector.onchange = (event) => renderMatchdaySnapshots(event.target.value);
}

function renderPlayersTable() {
  const table = document.getElementById('playersTable');
  if (!table) return;

  const managerCount = getSubmittedFantasyUsers().length;
  const columns = [
    { key: 'name', label: 'Player', type: 'text' },
    { key: 'team', label: 'Team', type: 'text' },
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'form', label: 'Form', type: 'number' },
    { key: 'goals', label: 'G', type: 'number' },
    { key: 'ownGoals', label: 'OG', type: 'number' },
    { key: 'mvps', label: 'MVPs', type: 'number' },
    { key: 'fantasyPoints', label: 'Matchday Pts', type: 'number' },
    { key: 'selectionPercentage', label: 'Selected By', type: 'number' },
    { key: 'ownershipTrend', label: 'Ownership Trend', type: 'number' },
    { key: 'fixtureDifficulty', label: 'Next Fixture', type: 'number' }
  ];
  const selectionStats = new Map(FANTASY_PLAYERS.map((player) => [player.id, getPlayerSelectionStats(player.id)]));
  const ownershipTrends = new Map(FANTASY_PLAYERS.map((player) => [player.id, getFantasyOwnershipTrend(player.id)]));
  const nextFixtures = new Map(FANTASY_PLAYERS.map((player) => [player.id, getFantasyNextFixture(player)]));
  const sortedPlayers = [...FANTASY_PLAYERS];
  if (playerStatsSort.key) {
    const column = columns.find(({ key }) => key === playerStatsSort.key);
    sortedPlayers.sort((left, right) => {
      const leftStats = selectionStats.get(left.id);
      const rightStats = selectionStats.get(right.id);
      const getValue = (player, stats) => ({
        name: player.name,
        team: player.team || '',
        value: Number(player.value) || 0,
        form: getPlayerForm(player) ?? -1,
        goals: Number(player.goals) || 0,
        ownGoals: Number(player.ownGoals) || 0,
        mvps: Number(player.mvps) || 0,
        fantasyPoints: getPlayerMatchdayPoints(player),
        selectionPercentage: stats.percentage,
        ownershipTrend: ownershipTrends.get(player.id) || 0,
        fixtureDifficulty: nextFixtures.get(player.id) ? getFantasyFixtureDifficulty(nextFixtures.get(player.id).opponent) : 0
      }[column.key]);
      const leftValue = getValue(left, leftStats);
      const rightValue = getValue(right, rightStats);
      const comparison = column.type === 'text'
        ? String(leftValue).localeCompare(String(rightValue))
        : leftValue - rightValue;
      return comparison * playerStatsSort.direction || left.name.localeCompare(right.name);
    });
  }
  const sortHeader = ({ key, label }) => {
    const active = playerStatsSort.key === key;
    const direction = active ? (playerStatsSort.direction === 1 ? 'asc' : 'desc') : '';
    return `<th aria-sort="${active ? direction : 'none'}"><button class="table-sort-button" type="button" data-sort-key="${key}">${label}<span class="table-sort-indicator">${direction}</span></button></th>`;
  };

  table.innerHTML = `
    <thead>
      <tr>
        ${columns.map(sortHeader).join('')}
      </tr>
    </thead>
    <tbody>
      ${sortedPlayers.map((player) => `
        <tr class="player-table-row" onclick="openPlayerDetails('${player.id}')" tabindex="0" onkeydown="if(event.key === 'Enter' || event.key === ' ') openPlayerDetails('${player.id}')">
          <td><span class="player-name-cell">${player.name} ${getPlayerAvailabilityBadge(player)}</span></td>
          <td><span class="table-team" title="${player.team || 'Unknown team'}"><img src="${getTeamLogoPath(player.team)}" alt="${player.team || 'Unknown team'}" loading="lazy" onerror="this.remove()"></span></td>
          <td>${formatMoney(player.value)}${player.priceTrend
            ? `<small class="price-trend ${getPlayerPriceStatus(player) === 'Likely to rise' ? 'rising' : getPlayerPriceStatus(player) === 'Likely to fall' ? 'falling' : ''}">${getPlayerPriceStatus(player)}</small>`
            : ''}</td>
          <td>${formatPlayerForm(player)}</td>
          <td>${player.goals}</td>
          <td>${player.ownGoals}</td>
          <td>${player.mvps}</td>
          <td>${getPlayerMatchdayPoints(player)}</td>
          <td><strong>${selectionStats.get(player.id).percentage}%</strong><small class="selection-rate-count">${selectionStats.get(player.id).selectedCount}/${managerCount} managers</small></td>
          <td>${ownershipTrends.get(player.id) === null
            ? '<span class="ownership-trend neutral">-</span>'
            : `<strong class="ownership-trend ${ownershipTrends.get(player.id) > 0 ? 'up' : ownershipTrends.get(player.id) < 0 ? 'down' : 'neutral'}">${ownershipTrends.get(player.id) > 0 ? '+' : ''}${ownershipTrends.get(player.id)}%</strong><small class="selection-rate-count">this matchday</small>`}</td>
          <td>${nextFixtures.get(player.id)
            ? `<span class="next-fixture-logo" title="${nextFixtures.get(player.id).opponent}"><img src="${getTeamLogoPath(nextFixtures.get(player.id).opponent)}" alt="${nextFixtures.get(player.id).opponent}" loading="lazy" onerror="this.remove()"><small class="fixture-difficulty difficulty-${getFantasyFixtureDifficulty(nextFixtures.get(player.id).opponent)}">${getFantasyFixtureDifficulty(nextFixtures.get(player.id).opponent)}/5</small></span>`
            : '<span class="ownership-trend neutral">No fixture</span>'}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  table.querySelectorAll('[data-sort-key]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.sortKey;
      playerStatsSort = {
        key,
        direction: playerStatsSort.key === key
          ? playerStatsSort.direction * -1
          : ['name', 'team'].includes(key) ? 1 : -1
      };
      renderPlayersTable();
    });
  });
}

function formatPlayerName(player) {
  const parts = player.name.split(' ');
  if (parts.length < 2) return { first: player.name, last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts.at(-1) };
}

function openPlayerDetails(playerId) {
  const player = getPlayerById(playerId);
  const overlay = document.getElementById('player-detail-overlay');
  const content = document.getElementById('player-detail-content');
  if (!player || !overlay || !content) return;

  const name = formatPlayerName(player);
  const fixtures = getFantasyPlayerFixtures(player);
  const recentPoints = getPlayerMatchPoints(player).slice(-5);
  const availability = getPlayerAvailability(player.id);
  const availabilityReason = availability?.reason
    ? `<p class="availability-reason-copy">${escapeFantasyHtml(availability.reason)}</p>`
    : '';
  const trend = recentPoints.length ? recentPoints.map((points) => `<span>${points}</span>`).join('') : '<span class="detail-empty">No matchday points yet</span>';
  const fixtureMarkup = fixtures.length
    ? fixtures.slice(0, 6).map((fixture) => `<div class="fixture-card"><small>${fixture.gameweek || 'Next'} · Difficulty ${getFantasyFixtureDifficulty(fixture.opponent)}/5</small><div class="fixture-teams"><span><img src="${getTeamLogoPath(player.team)}" alt="" loading="lazy" onerror="this.remove()">${player.team || 'TBC'}</span><b>vs</b><span><img src="${getTeamLogoPath(fixture.opponent)}" alt="" loading="lazy" onerror="this.remove()">${fixture.opponent || 'TBC'}</span></div></div>`).join('')
    : '<p class="detail-empty">Fixtures will appear when matchday schedules are added.</p>';
  const photoPath = getPlayerPhotoPath(player);
  const selectedTeam = getFantasyBuilderTeam();
  const selectedIndex = selectedTeam.indexOf(player.id);
  const selectedInBuild = document.body.dataset.page === 'build' && selectedIndex >= 0;
  const changesAvailable = selectedInBuild && !transfersAreLocked();
  const profileActions = selectedInBuild && changesAvailable
    ? `<button class="primary-btn" type="button" onclick="setFantasyCaptain('${player.id}'); document.getElementById('player-detail-overlay').hidden = true" ${selectedIndex >= FANTASY_STARTER_COUNT ? 'disabled' : ''}>${selectedIndex >= FANTASY_STARTER_COUNT ? 'Starter only' : getFantasyBuilderCaptain() === player.id ? 'Captain' : 'Make Captain'}</button><button class="secondary-btn" type="button" onclick="document.getElementById('player-detail-overlay').hidden = true; removePlayerFromTeam('${player.id}')">Remove from team</button>`
    : document.body.dataset.page === 'build'
      ? '<button class="secondary-btn" type="button" onclick="document.getElementById(\'player-detail-overlay\').hidden = true">Close</button>'
      : '<a class="primary-btn" href="fantasy-build.html">Add to squad <span aria-hidden="true">&nearr;</span></a><button class="secondary-btn" type="button" onclick="document.getElementById(\'player-detail-overlay\').hidden = true">Close</button>';

  content.innerHTML = `
    <div class="detail-hero" style="--shirt-color: ${player.teamColor || '#00f0ff'}">
      <div class="detail-player-visual">
        ${photoPath ? `<img class="detail-player-photo" src="${photoPath}" alt="${player.name}" loading="lazy">` : ''}
        <div class="detail-shirt team-shirt"></div>
      </div>
      <div class="detail-identity">
        <p>${player.position || 'Player'}${player.team ? ` · ${player.team}` : ''} ${getPlayerAvailabilityBadge(player)}</p>
        ${availabilityReason}
        <h2 id="player-detail-name">${name.first}<br><strong>${name.last}</strong></h2>
        <span>${formatMoney(player.value)}</span>
      </div>
    </div>
    <div class="detail-actions">
      ${profileActions}
    </div>
    <div class="detail-price-line"><span>Price</span><strong>${formatMoney(player.value)}</strong><em>${getPlayerPriceStatus(player)}</em></div>
    <div class="detail-metrics">
      <div><small>Form</small><strong>${formatPlayerForm(player)}</strong></div>
      <div><small>Matchday points</small><strong>${getPlayerMatchdayPoints(player)}</strong></div>
    </div>
    <section class="detail-section"><div class="detail-section-heading"><h3>Recent form</h3><span>Last ${recentPoints.length || 0} matches</span></div><div class="points-strip">${trend}</div></section>
    <section class="detail-section"><div class="detail-section-heading"><h3>Fixtures</h3><span>Upcoming</span></div><div class="fixture-grid">${fixtureMarkup}</div></section>
    <div class="detail-stat-grid"><div><small>Goals</small><strong>${player.goals || 0}</strong></div><div><small>Own goals</small><strong>${player.ownGoals || 0}</strong></div><div><small>MVPs</small><strong>${player.mvps || 0}</strong></div></div>
  `;
  overlay.hidden = false;
}

window.openPlayerDetails = openPlayerDetails;

function renderAdminState() {
  const status = document.getElementById('admin-matchday-status');
  const startButton = document.getElementById('admin-start-matchday');
  const endButton = document.getElementById('admin-end-matchday');
  const cancelStartButton = document.getElementById('admin-cancel-start-matchday');
  const deleteButton = document.getElementById('admin-delete-matchday');
  const settingsButton = document.getElementById('admin-save-matchday-settings');
  const transferInput = document.getElementById('admin-transfer-limit');
  const startInput = document.getElementById('admin-matchday-start');
  const selector = document.getElementById('admin-matchday-select');
  const orderMenu = document.getElementById('admin-matchday-order');
  if (!status) return;

  if (selector) {
    selector.innerHTML = fantasyMatchdays.length === 0
      ? '<option value="">No matchdays created</option>'
      : getOrderedFantasyMatchdays().map((matchday) => `<option value="${matchday.id}">${matchday.name} (${matchday.status})</option>`).join('');
    selector.value = selectedFantasyMatchdayId || '';
  }

  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!selected) {
    status.textContent = 'No matchday created';
    if (startButton) startButton.disabled = true;
    if (endButton) endButton.disabled = true;
    if (cancelStartButton) cancelStartButton.disabled = true;
    if (deleteButton) deleteButton.disabled = true;
    if (settingsButton) settingsButton.disabled = true;
    if (orderMenu) orderMenu.innerHTML = '<p class="order-menu-empty">Create matchdays to set their season order.</p>';
    return;
  }

  status.textContent = `${selected.name} (${selected.status})`;
  if (transferInput) transferInput.value = getMatchdayTransferLimit(selected);
  if (startInput) startInput.value = getDateTimeLocalValue(selected.startAt);
  if (startButton) startButton.disabled = selected.status !== 'draft'
    || fantasyMatchdays.some((matchday) => matchday.status === 'active');
  if (endButton) endButton.disabled = selected.status !== 'active';
  if (cancelStartButton) cancelStartButton.disabled = selected.status !== 'active';
  if (deleteButton) deleteButton.disabled = selected.status === 'active';
  if (settingsButton) settingsButton.disabled = selected.status === 'ended';
  renderAdminMatchdayOrder();
}

function renderAdminMatchdayOrder() {
  const container = document.getElementById('admin-matchday-order');
  if (!container) return;
  const orderedMatchdays = getOrderedFantasyMatchdays();
  container.innerHTML = `
    <div class="order-menu-heading">
      <div><p class="section-title">Season order</p><strong>Matchday sequence</strong></div>
      <span>${orderedMatchdays.length} matchday${orderedMatchdays.length === 1 ? '' : 's'}</span>
    </div>
    <div class="order-menu-list">
      ${orderedMatchdays.map((matchday, index) => `
        <div class="order-menu-row ${String(matchday.id) === String(selectedFantasyMatchdayId) ? 'is-selected' : ''}">
          <span class="order-menu-number">${index + 1}</span>
          <div class="order-menu-details">
            <strong>${matchday.name}</strong>
            <span>${matchday.name} · ${matchday.status}</span>
          </div>
          <div class="order-menu-actions">
            <button class="secondary-btn order-move-button" type="button" data-matchday-id="${matchday.id}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>Move up</button>
            <button class="secondary-btn order-move-button" type="button" data-matchday-id="${matchday.id}" data-direction="1" ${index === orderedMatchdays.length - 1 ? 'disabled' : ''}>Move down</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  container.querySelectorAll('.order-move-button').forEach((button) => {
    button.addEventListener('click', () => moveFantasyMatchday(button.dataset.matchdayId, Number(button.dataset.direction))
      .catch((error) => alert(error.message)));
  });
}

function renderAdminPlayers() {
  const container = document.getElementById('admin-player-list');
  if (!container) return;
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  const selectedStats = selected?.playerStats || {};
  const selectedAvailability = selected?.playerAvailability || {};
  container.innerHTML = FANTASY_PLAYERS.map((player) => {
    const availability = selectedAvailability[player.id] || {};
    const status = ['injured', 'unavailable'].includes(availability.status) ? availability.status : 'available';
    const chance = Math.max(0, Math.min(100, Number(availability.chance ?? 100) || 0));
    return `
    <div class="admin-player-row" data-player-id="${player.id}">
      <strong>${player.name}</strong>
      <label>Goals <input type="number" min="0" value="${Number(selectedStats[player.id]?.goals) || 0}" data-stat="goals"></label>
      <label>Own goals <input type="number" min="0" value="${Number(selectedStats[player.id]?.ownGoals) || 0}" data-stat="ownGoals"></label>
      <label>MVPs <input type="number" min="0" value="${Number(selectedStats[player.id]?.mvps) || 0}" data-stat="mvps"></label>
      <label>Matchday points <input class="point-input ${Object.prototype.hasOwnProperty.call(selectedStats[player.id] || {}, 'matchdayPoints') ? 'edited' : 'untouched'}" type="number" value="${Number(selectedStats[player.id]?.matchdayPoints) || 0}" data-stat="matchdayPoints"></label>
      <label>Availability
        <select data-availability-status>
          <option value="available" ${status === 'available' ? 'selected' : ''}>Available</option>
          <option value="injured" ${status === 'injured' ? 'selected' : ''}>Injured</option>
          <option value="unavailable" ${status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
        </select>
      </label>
      <label class="availability-chance-field" ${status !== 'unavailable' ? 'hidden' : ''}>Chance (%)
        <input type="number" min="0" max="100" step="1" value="${chance}" data-availability-chance ${status !== 'unavailable' ? 'disabled' : ''}>
      </label>
      <label class="availability-reason-field" ${status !== 'unavailable' ? 'hidden' : ''}>Reason
        <input type="text" maxlength="120" placeholder="e.g. Work commitments" data-availability-reason ${status !== 'unavailable' ? 'disabled' : ''}>
      </label>
    </div>
    `;
  }).join('');
  container.querySelectorAll('.admin-player-row').forEach((row) => {
    row.querySelector('[data-availability-reason]').value = selectedAvailability[row.dataset.playerId]?.reason || '';
  });
  container.querySelectorAll('[data-availability-status]').forEach((select) => {
    select.addEventListener('change', () => {
      const row = select.closest('.admin-player-row');
      const isUnavailable = select.value === 'unavailable';
      ['.availability-chance-field', '.availability-reason-field'].forEach((selector) => {
        const field = row.querySelector(selector);
        field.hidden = !isUnavailable;
        field.querySelector('input').disabled = !isUnavailable;
      });
    });
  });
}

function renderAdminTeams(selectedUsername) {
  const selector = document.getElementById('admin-team-select');
  const details = document.getElementById('admin-team-details');
  if (!selector || !details) return;

  const managers = Object.entries(fantasyUsers)
    .map(([accountKey, user]) => ({ accountKey, user }))
    .map(({ accountKey, user }) => {
      const squad = getFantasyMatchdaySquad(user, selectedFantasyMatchdayId);
      return {
        accountKey,
        user,
        squad,
        team: Array.isArray(squad?.fantasyTeam) ? squad.fantasyTeam : Object.values(squad?.fantasyTeam || {})
      };
    })
    .filter(({ team }) => team.length > 0)
    .sort((left, right) => String(left.user.username || left.accountKey).localeCompare(String(right.user.username || right.accountKey)));

  if (managers.length === 0) {
    selector.innerHTML = '<option value="">No teams submitted yet</option>';
    selector.disabled = true;
    details.innerHTML = '<p class="empty-state">No players have been selected yet.</p>';
    return;
  }

  const activeManager = managers.find(({ accountKey }) => accountKey === selectedUsername) || managers[0];
  selector.disabled = false;
  selector.innerHTML = managers.map(({ accountKey, user }) => `<option value="${accountKey}" ${accountKey === activeManager.accountKey ? 'selected' : ''}>${user.username || accountKey}</option>`).join('');
  const team = activeManager.team.map((playerId) => getPlayerById(playerId)).filter(Boolean);
  const captain = getPlayerById(activeManager.squad.fantasyCaptain);
  details.innerHTML = `
    <div class="admin-team-heading">
      <strong>${activeManager.user.username || activeManager.accountKey}</strong>
      <span>Captain: ${captain?.name || 'Not selected'}</span>
    </div>
    <ul class="admin-team-list">
      ${team.map((player, index) => `<li><span>${player.name}</span><small>${index < FANTASY_STARTER_COUNT ? 'Starter' : 'Substitute'}${player.id === activeManager.squad.fantasyCaptain ? ' · Captain' : ''}</small></li>`).join('')}
    </ul>
  `;
}

function buildFantasyManagerSnapshots(users, matchdayId) {
  return Object.fromEntries(Object.entries(users || {})
    .filter(([, user]) => getFantasyTeamPlayerIds(user, matchdayId).length === FANTASY_TEAM_SIZE)
    .map(([accountKey, user]) => {
      const squad = getFantasyMatchdaySquad(user, matchdayId) || user;
      return [accountKey, {
        username: user.username || accountKey,
        fantasyTeam: getFantasyTeamPlayerIds(squad),
        fantasyCaptain: squad.fantasyCaptain || user.fantasyCaptain || null,
        fantasyPowerups: Object.fromEntries(Object.entries(squad.fantasyPowerups || user.fantasyPowerups || {})
          .filter(([, powerup]) => powerup?.used && String(powerup.matchdayId) === String(matchdayId))),
        transferPenalty: Number(squad.transferPenalty) || 0
      }];
    }));
}

async function createFantasyMatchday() {
  if (!isFantasyAdmin()) return;
  const nameInput = document.getElementById('admin-matchday-name');
  const name = nameInput.value.trim();
  if (!name) {
    alert('Enter a matchday name first.');
    return;
  }
  const db = await getFantasyDb();
  const activeMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active');
  if (activeMatchday && !activeMatchday.managerSnapshots) {
    const managerSnapshots = buildFantasyManagerSnapshots(db.users || {}, activeMatchday.id);
    fantasyMatchdays = fantasyMatchdays.map((matchday) => matchday.id === activeMatchday.id
      ? { ...matchday, managerSnapshots }
      : matchday);
  }
  const matchday = {
    id: fantasyMatchdays.reduce((highest, current) => Math.max(highest, Number(current.id) || 0), 0) + 1,
    name,
    transferLimit: Math.max(0, Number(document.getElementById('admin-transfer-limit')?.value) || 0),
    startAt: document.getElementById('admin-matchday-start')?.value
      ? new Date(document.getElementById('admin-matchday-start').value).toISOString()
      : null,
    status: 'draft',
    order: fantasyMatchdays.reduce((highest, current, index) => Math.max(highest, Number(current.order ?? index)), -1) + 1,
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

async function moveFantasyMatchday(matchdayId, direction) {
  if (!isFantasyAdmin()) return;
  const orderedMatchdays = getOrderedFantasyMatchdays();
  const selectedIndex = orderedMatchdays.findIndex((matchday) => String(matchday.id) === String(matchdayId));
  const targetIndex = selectedIndex + direction;
  if (selectedIndex < 0 || targetIndex < 0 || targetIndex >= orderedMatchdays.length) return;
  const current = orderedMatchdays[selectedIndex];
  const target = orderedMatchdays[targetIndex];
  const currentOrder = Number(current.order ?? selectedIndex);
  const targetOrder = Number(target.order ?? targetIndex);
  const db = await getFantasyDb();
  fantasyMatchdays = fantasyMatchdays.map((matchday) => {
    if (matchday.id === current.id) return { ...matchday, order: targetOrder };
    if (matchday.id === target.id) return { ...matchday, order: currentOrder };
    return matchday;
  });
  await saveFantasyDb({ ...db, fantasyMatchdays });
  renderAdminState();
}

async function startFantasyMatchday() {
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!isFantasyAdmin() || !selected || selected.status !== 'draft') return;
  if (fantasyMatchdays.some((matchday) => matchday.status === 'active')) return;
  const db = await getFantasyDb();
  const playerOwnership = buildFantasyOwnershipSnapshot(db.users || {}, selected.id);
  const managerSnapshots = buildFantasyManagerSnapshots(db.users || {}, selected.id);
  fantasyMatchdays = fantasyMatchdays.map((matchday) => matchday.id === selected.id
    ? { ...matchday, status: 'active', startedAt: new Date().toISOString(), playerOwnership, managerSnapshots }
    : matchday);
  fantasyMatchday = fantasyMatchdays.find((matchday) => matchday.status === 'active');
  await saveFantasyDb({ ...db, fantasyMatchdays });
  renderAdminState();
}

async function cancelFantasyMatchdayStart() {
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!isFantasyAdmin() || !selected || selected.status !== 'active') return;
  if (!confirm(`Cancel the start of ${selected.name}? It will return to draft status.`)) return;
  const db = await getFantasyDb();
  fantasyMatchdays = fantasyMatchdays.map((matchday) => {
    if (matchday.id !== selected.id) return matchday;
    const { startedAt, ...draftMatchday } = matchday;
    return { ...draftMatchday, status: 'draft' };
  });
  fantasyMatchday = null;
  await saveFantasyDb({ ...db, fantasyMatchdays });
  renderAdminState();
  renderAdminPlayers();
}

async function endFantasyMatchday() {
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!isFantasyAdmin() || !selected || selected.status !== 'active') return;
  const db = await getFantasyDb();
  const users = { ...(db.users || {}) };
  const managerSnapshots = {
    ...buildFantasyManagerSnapshots(users, selected.id),
    ...(selected.managerSnapshots || {})
  };
  const endedMatchdays = fantasyMatchdays.map((matchday) => matchday.id === selected.id
    ? { ...matchday, status: 'ended', endedAt: new Date().toISOString(), managerSnapshots }
    : matchday);
  fantasyMatchdays = endedMatchdays;
  fantasyMatchday = null;
  Object.keys(users).forEach((accountKey) => {
    const user = users[accountKey];
    const snapshot = managerSnapshots[accountKey];
    if (!snapshot) return;
    const fantasyMatchdayPoints = { ...(user.fantasyMatchdayPoints || {}) };
    fantasyMatchdayPoints[selected.id] = calculateFantasyTeamPoints(snapshot.fantasyTeam, snapshot.fantasyCaptain, { ...selected, status: 'ended' }, snapshot.fantasyPowerups, snapshot.transferPenalty);
    users[accountKey] = { ...user, fantasyMatchdayPoints };
  });
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
  if (!confirm(`Delete ${selected.name}?`)) return;
  const db = await getFantasyDb();
  fantasyMatchdays = fantasyMatchdays.filter((matchday) => matchday.id !== selected.id);
  selectedFantasyMatchdayId = getOrderedFantasyMatchdays()[0]?.id || null;
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

async function saveFantasyMatchdaySettings() {
  const selected = fantasyMatchdays.find((matchday) => String(matchday.id) === String(selectedFantasyMatchdayId));
  if (!isFantasyAdmin() || !selected || selected.status === 'ended') return;
  const transferLimit = Math.max(0, Number(document.getElementById('admin-transfer-limit').value) || 0);
  const startValue = document.getElementById('admin-matchday-start').value;
  const startAt = startValue ? new Date(startValue).toISOString() : null;
  const db = await getFantasyDb();
  fantasyMatchdays = fantasyMatchdays.map((matchday) => matchday.id === selected.id ? { ...matchday, transferLimit, startAt } : matchday);
  await saveFantasyDb({ ...db, fantasyMatchdays });
  renderAdminState();
  alert('Matchday settings saved.');
}

async function resetFantasyPowerups() {
  if (!isFantasyAdmin()) return;
  if (!confirm('Reset both powerups for every user?')) return;
  const db = await getFantasyDb();
  const users = Object.fromEntries(Object.entries(db.users || {}).map(([accountKey, user]) => {
    const { fantasyPowerups, ...account } = user;
    return [accountKey, account];
  }));
  await saveFantasyDb({ ...db, users });
  fantasyUsers = { ...users };
  const currentUser = getCurrentFantasyUser();
  if (currentUser) fantasyAccount = users[currentUser.username.toLowerCase()] || null;
  renderAdminTeams();
  alert('Powerups reset for every user.');
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
  const playerAvailability = { ...(selected.playerAvailability || {}) };
  document.querySelectorAll('.admin-player-row').forEach((row) => {
    const playerId = row.dataset.playerId;
    const stats = {};
    row.querySelectorAll('[data-stat]').forEach((input) => {
      stats[input.dataset.stat] = Number(input.value) || 0;
    });
    const existing = playerStats[playerId] || {};
    playerStats[playerId] = { ...existing, ...stats };
    const availabilityStatus = row.querySelector('[data-availability-status]')?.value || 'available';
    if (availabilityStatus === 'injured') {
      playerAvailability[playerId] = { status: 'injured' };
    } else if (availabilityStatus === 'unavailable') {
      const chanceValue = row.querySelector('[data-availability-chance]')?.value.trim();
      const chance = chanceValue === '' ? 100 : Number(chanceValue);
      const reason = row.querySelector('[data-availability-reason]')?.value.trim() || '';
      playerAvailability[playerId] = {
        status: 'unavailable',
        chance: Math.max(0, Math.min(100, Number.isFinite(chance) ? chance : 100)),
        ...(reason ? { reason } : {})
      };
    } else {
      delete playerAvailability[playerId];
    }
  });
  fantasyMatchdays = fantasyMatchdays.map((matchday) => matchday.id === selected.id ? { ...matchday, playerStats, playerAvailability } : matchday);
  const users = { ...(db.users || {}) };
  recalculateManagerTotals(users, fantasyMatchdays);
  await saveFantasyDb({ ...db, users, fantasyMatchdays });
  applyAggregatedPlayerStats(fantasyMatchdays);
  renderPlayersTable();
  alert('Player stats and availability saved.');
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
    selectedFantasyMatchdayId = getOrderedFantasyMatchdays().at(-1)?.id || null;
  }
  renderAdminState();
  renderAdminPlayers();
  renderAdminTeams();
  document.getElementById('admin-matchday-select')?.addEventListener('change', (event) => {
    selectedFantasyMatchdayId = Number(event.target.value) || null;
    renderAdminState();
    renderAdminPlayers();
    saveSelectedMatchdayId(selectedFantasyMatchdayId).catch((error) => alert(error.message));
  });
  document.getElementById('admin-team-select')?.addEventListener('change', (event) => {
    renderAdminTeams(event.target.value);
  });
  document.getElementById('admin-create-matchday')?.addEventListener('click', () => createFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-save-matchday-settings')?.addEventListener('click', () => saveFantasyMatchdaySettings().catch((error) => alert(error.message)));
  document.getElementById('admin-reset-powerups')?.addEventListener('click', () => resetFantasyPowerups().catch((error) => alert(error.message)));
  document.getElementById('admin-start-matchday')?.addEventListener('click', () => startFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-cancel-start-matchday')?.addEventListener('click', () => cancelFantasyMatchdayStart().catch((error) => alert(error.message)));
  document.getElementById('admin-end-matchday')?.addEventListener('click', () => endFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-delete-matchday')?.addEventListener('click', () => deleteFantasyMatchday().catch((error) => alert(error.message)));
  document.getElementById('admin-save-stats')?.addEventListener('click', () => saveFantasyPlayerStats().catch((error) => alert(error.message)));
}
