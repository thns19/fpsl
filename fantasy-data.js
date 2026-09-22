const FANTASY_PLAYERS = [
  { id: 'dimitris-gavalas', name: 'Dimitris Gavalas', team: 'BADiles', teamColor: 'linear-gradient(135deg, #168a45 0 50%, #111 50%)', value: 15.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-filippou', name: 'Giorgos Filippou', team: 'Axtarmades', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #fff 50%)', value: 14.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'thanos-chatziiordanou', name: 'Thanos Chatziiordanou', team: 'BADiles', teamColor: 'linear-gradient(135deg, #168a45 0 50%, #111 50%)', value: 14.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'michalis-lerogiannis', name: 'Michalis Lerogiannis', team: 'R1', teamColor: 'linear-gradient(135deg, #102c66 0 50%, #d7ad32 50%)', value: 13.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-akridas', name: 'Giannis Akridas', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', value: 13.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'jordan-aslanis', name: 'Jordan Aslanis', team: 'Basement Boys', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #4a4f55 50%)', value: 12.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'nikolas-moschonas', name: 'Nikolas Moschonas', team: 'R1', teamColor: 'linear-gradient(135deg, #102c66 0 50%, #d7ad32 50%)', value: 12.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'alexandros-kalofolias', name: 'Alexandros Kalofolias', team: 'Thryloi', teamColor: '#fff', value: 10.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'vasilis-efstathiou', name: 'Vasilis Efstathiou', team: 'Thryloi', teamColor: '#fff', value: 10.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'taxiarchis-kassotakis', name: 'Taxiarchis Kassotakis', team: 'Spasmena Mila', teamColor: 'linear-gradient(135deg, #d63838 0 50%, #fff 50%)', value: 9.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'spyros-koskinas', name: 'Spyros Koskinas', team: 'Basement Boys', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #4a4f55 50%)', value: 8.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'filippos-efstathiou', name: 'Filippos Efstathiou', team: 'Axtarmades', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #fff 50%)', value: 8.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-zacharopoulos', name: 'Giorgos Zacharopoulos', team: 'Volos Drummers', teamColor: 'linear-gradient(135deg, #2f6edb 0 50%, #fff 50%)', value: 8.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'johan-pilichos', name: 'Johan Pilichos', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', value: 7.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'vasilis-tziovanis', name: 'Vasilis Tziovanis', team: 'Volos Drummers', teamColor: 'linear-gradient(135deg, #2f6edb 0 50%, #fff 50%)', value: 7.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'tzannis-mermigas', name: 'Tzannis Mermigas', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', value: 7.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'aris-tsertos', name: 'Aris Tsertos', team: 'Spasmena Mila', teamColor: 'linear-gradient(135deg, #d63838 0 50%, #fff 50%)', value: 6.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'harris-rigas', name: 'Harris Rigas', team: 'Axtarmades', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #fff 50%)', value: 6.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stavros-stavropoulos', name: 'Stavros Stavropoulos', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', value: 6.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stefanos-mavrogiannis', name: 'Stefanos Mavrogiannis', team: 'Midi Kidz', teamColor: '#7d1823', value: 6.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-stefanis', name: 'Giannis Stefanis', team: 'Volos Drummers', teamColor: 'linear-gradient(135deg, #2f6edb 0 50%, #fff 50%)', value: 6.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'panos-chardas', name: 'Panos Chardas', team: 'Warriors', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #2f6edb 50%)', value: 6.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'sokratis-gkiolias-sr', name: 'Sokratis Gkiolias Sr', team: 'Warriors', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #2f6edb 50%)', value: 6.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'dimitris-antoninis', name: 'Dimitris Antoninis', team: 'Polo', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #48c6cf 50%)', value: 5.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'filippos-laskaris', name: 'Filippos Laskaris', team: 'Polo', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #48c6cf 50%)', value: 5.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-kordopatis', name: 'Giannis Kordopatis', team: 'Air Condition', teamColor: '#d9f6ff', value: 5.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-karamolegkos', name: 'Giorgos Karamolegkos', team: 'Team Till Death', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #fff 50%)', value: 5.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'miltos-kapnakis', name: 'Miltos Kapnakis', team: 'Team Till Death', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #fff 50%)', value: 5.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'christos-katopodis', name: 'Christos Katopodis', team: 'Hornets', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #9d5ce8 50%)', value: 4.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'dionysis-chalikias', name: 'Dionysis Chalikias', team: 'Niki Alimou', teamColor: '#176b3a', value: 4.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'foivos-dousis', name: 'Foivos Dousis', team: 'Ksades', teamColor: 'linear-gradient(135deg, #f15b2a 0 50%, #c62828 50%)', value: 4.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'panagiotis-perdikis', name: 'Panagiotis Perdikis', team: 'Niki Alimou', teamColor: '#176b3a', value: 4.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'pavlos-tsonis', name: 'Pavlos Tsonis', team: 'Air Condition', teamColor: '#d9f6ff', value: 4.5, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'avaris-ntzamilis', name: 'Avaris Ntzamilis', team: 'EX7T', teamColor: '#fff0a3', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'ennio-georgopoulos', name: 'Ennio Georgopoulos', team: 'Hornets', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #9d5ce8 50%)', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-katsavounis', name: 'Giannis Katsavounis', team: 'Golden B.', teamColor: '#e2b93b', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'kalliopi-tsertou', name: 'Kalliopi Tsertou', team: 'Spasmena Mila', teamColor: 'linear-gradient(135deg, #d63838 0 50%, #fff 50%)', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'konstantinos-sfikas', name: 'Konstantinos Sfikas', team: 'Ksades', teamColor: 'linear-gradient(135deg, #f15b2a 0 50%, #c62828 50%)', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'markos-kanellidis', name: 'Markos Kanellidis', team: 'Golden B.', teamColor: '#e2b93b', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'orfeas-maragkos', name: 'Orfeas Maragkos', team: 'Niki Alimou', teamColor: '#176b3a', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'sokratis-gkiolias-jr', name: 'Sokratis Gkiolias Jr', team: 'EX7T', teamColor: '#fff0a3', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stavros-moutaftsidis', name: 'Stavros Moutaftsidis', team: 'Midi Kidz', teamColor: '#7d1823', value: 4.0, lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 }
];

const FANTASY_TEAM_LIMIT = 40.0;
const FANTASY_TEAM_SIZE = 5;
const FANTASY_STARTER_COUNT = 4;
const FANTASY_SUB_COUNT = 1;

const FANTASY_STORAGE_KEY = 'pitchballFantasyTeam';
const FANTASY_SESSION_KEY = 'psl_session';

function getFantasyUserStorageKey(suffix) {
  const user = getCurrentFantasyUser();
  return user ? `${suffix}:${user.username.toLowerCase()}` : suffix;
}

function getPlayerById(playerId) {
  return FANTASY_PLAYERS.find((player) => player.id === playerId) || null;
}

function getStoredFantasyTeam() {
  try {
    const user = getCurrentFantasyUser();
    if (!user) return [];
    const raw = localStorage.getItem(getFantasyUserStorageKey(FANTASY_STORAGE_KEY));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveFantasyTeam(team) {
  const user = getCurrentFantasyUser();
  if (user) {
    localStorage.setItem(getFantasyUserStorageKey(FANTASY_STORAGE_KEY), JSON.stringify(team));
  }
}

function getStoredFantasyCaptain() {
  return localStorage.getItem(getFantasyUserStorageKey('pitchballFantasyCaptain')) || null;
}

function getStoredFantasyViceCaptain() {
  return localStorage.getItem(getFantasyUserStorageKey('pitchballFantasyViceCaptain')) || null;
}

function saveFantasyCaptain(playerId) {
  const key = getFantasyUserStorageKey('pitchballFantasyCaptain');
  if (playerId) localStorage.setItem(key, playerId);
  else localStorage.removeItem(key);
}

function saveFantasyViceCaptain(playerId) {
  const key = getFantasyUserStorageKey('pitchballFantasyViceCaptain');
  if (playerId) localStorage.setItem(key, playerId);
  else localStorage.removeItem(key);
}

function getFantasySubmissionState() {
  try {
    const raw = localStorage.getItem(getFantasyUserStorageKey('pitchballFantasySubmission'));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveFantasySubmissionState(state) {
  localStorage.setItem(getFantasyUserStorageKey('pitchballFantasySubmission'), JSON.stringify(state));
}

function getCurrentFantasyUser() {
  try {
    const raw = localStorage.getItem(FANTASY_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function requireFantasyLogin() {
  const user = getCurrentFantasyUser();
  if (!user) {
    const overlay = document.getElementById('fantasy-auth-overlay');
    if (overlay) {
      overlay.classList.add('visible');
    }
    return false;
  }
  return true;
}

function formatMoney(value) {
  return `${Number(value).toFixed(1)}m`;
}

function getTeamTotal(team) {
  return team.reduce((total, playerId) => {
    const player = getPlayerById(playerId);
    return total + (player ? player.value : 0);
  }, 0);
}

function getTeamStatus(team) {
  const starters = team.filter((id, index) => index < FANTASY_STARTER_COUNT).length;
  const subCount = team.length - starters;
  return { starters, subCount };
}

function buildPlayerMap() {
  const map = {};
  FANTASY_PLAYERS.forEach((player) => {
    map[player.id] = player;
  });
  return map;
}
