const FANTASY_PLAYERS = [
  { id: 'dimitris-gavalas', name: 'Dimitris Gavalas', value: 15.0, form: 8.9, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-filippou', name: 'Giorgos Filippou', value: 14.0, form: 8.7, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'thanos-chatziiordanou', name: 'Thanos Chatziiordanou', value: 14.0, form: 8.5, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'michalis-lerogiannis', name: 'Michalis Lerogiannis', value: 13.5, form: 8.4, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-akridas', name: 'Giannis Akridas', value: 13.0, form: 8.2, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'jordan-aslanis', name: 'Jordan Aslanis', value: 12.5, form: 8.1, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'nikolas-moschonas', name: 'Nikolas Moschonas', value: 12.5, form: 8.0, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'alexandros-kalofolias', name: 'Alexandros Kalofolias', value: 10.5, form: 7.8, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'vasilis-efstathiou', name: 'Vasilis Efstathiou', value: 10.0, form: 7.7, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'taxiarchis-kassotakis', name: 'Taxiarchis Kassotakis', value: 9.0, form: 7.6, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'spyros-koskinas', name: 'Spyros Koskinas', value: 8.5, form: 7.4, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'filippos-efstathiou', name: 'Filippos Efstathiou', value: 8.5, form: 7.3, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-zacharopoulos', name: 'Giorgos Zacharopoulos', value: 8.0, form: 7.2, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'johan-pilichos', name: 'Johan Pilichos', value: 7.5, form: 7.1, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'vasilis-tziovanis', name: 'Vasilis Tziovanis', value: 7.5, form: 7.0, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'tzannis-mermigas', name: 'Tzannis Mermigas', value: 7.0, form: 6.9, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'aris-tsertos', name: 'Aris Tsertos', value: 6.5, form: 6.7, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'harris-rigas', name: 'Harris Rigas', value: 6.5, form: 6.7, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stavros-stavropoulos', name: 'Stavros Stavropoulos', value: 6.5, form: 6.6, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stefanos-mavrogiannis', name: 'Stefanos Mavrogiannis', value: 6.5, form: 6.6, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-stefanis', name: 'Giannis Stefanis', value: 6.0, form: 6.4, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'panos-chardas', name: 'Panos Chardas', value: 6.0, form: 6.3, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'sokratis-gkiolias-sr', name: 'Sokratis Gkiolias Sr', value: 6.0, form: 6.2, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'dimitris-antoninis', name: 'Dimitris Antoninis', value: 5.5, form: 6.1, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'filippos-laskaris', name: 'Filippos Laskaris', value: 5.5, form: 6.0, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-kordopatis', name: 'Giannis Kordopatis', value: 5.0, form: 5.9, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-karamolegkos', name: 'Giorgos Karamolegkos', value: 5.0, form: 5.8, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'miltos-kapnakis', name: 'Miltos Kapnakis', value: 5.0, form: 5.7, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'christos-katopodis', name: 'Christos Katopodis', value: 4.5, form: 5.6, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'dionysis-chalikias', name: 'Dionysis Chalikias', value: 4.5, form: 5.5, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'foivos-dousis', name: 'Foivos Dousis', value: 4.5, form: 5.5, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'panagiotis-perdikis', name: 'Panagiotis Perdikis', value: 4.5, form: 5.4, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'pavlos-tsonis', name: 'Pavlos Tsonis', value: 4.5, form: 5.3, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'avaris-ntzamilis', name: 'Avaris Ntzamilis', value: 4.0, form: 5.2, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'ennio-georgopoulos', name: 'Ennio Georgopoulos', value: 4.0, form: 5.1, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-katsavounis', name: 'Giannis Katsavounis', value: 4.0, form: 5.0, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'kalliopi-tsertou', name: 'Kalliopi Tsertou', value: 4.0, form: 4.8, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'konstantinos-sfikas', name: 'Konstantinos Sfikas', value: 4.0, form: 4.7, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'markos-kanellidis', name: 'Markos Kanellidis', value: 4.0, form: 4.7, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'orfeas-maragkos', name: 'Orfeas Maragkos', value: 4.0, form: 4.6, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'sokratis-gkiolias-jr', name: 'Sokratis Gkiolias Jr', value: 4.0, form: 4.5, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stavros-moutaftsidis', name: 'Stavros Moutaftsidis', value: 4.0, form: 4.4, fantasyPoints: 0, goals: 0, ownGoals: 0, mvps: 0 }
];

const FANTASY_TEAM_LIMIT = 40.0;
const FANTASY_TEAM_SIZE = 5;
const FANTASY_STARTER_COUNT = 4;
const FANTASY_SUB_COUNT = 1;

const FANTASY_STORAGE_KEY = 'pitchballFantasyTeam';
const FANTASY_SESSION_KEY = 'psl_session';

const SAMPLE_LEADERBOARD = [
  { username: 'Mitsos', total: 118, matchday: 36 },
  { username: 'Kasidis', total: 110, matchday: 32 },
  { username: 'Panos', total: 102, matchday: 28 },
  { username: 'Asteras FC', total: 96, matchday: 25 },
  { username: 'Nikos', total: 89, matchday: 24 }
];

function getPlayerById(playerId) {
  return FANTASY_PLAYERS.find((player) => player.id === playerId) || null;
}

function getStoredFantasyTeam() {
  try {
    const raw = localStorage.getItem(FANTASY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveFantasyTeam(team) {
  localStorage.setItem(FANTASY_STORAGE_KEY, JSON.stringify(team));
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
