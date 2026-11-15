const FANTASY_PLAYERS = [
  { id: 'dimitris-gavalas', priceTrend: 'stable', value: 15.0, name: 'Dimitris Gavalas', team: 'BADiles', teamColor: 'linear-gradient(135deg, #168a45 0 50%, #111 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-filippou', priceTrend: 'rising', value: 14.0, name: 'Giorgos Filippou', team: 'Axtarmades', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'thanos-chatziiordanou', priceTrend: 'stable', value: 14.0, name: 'Thanos Chatziiordanou', team: 'BADiles', teamColor: 'linear-gradient(135deg, #168a45 0 50%, #111 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'michalis-lerogiannis', priceTrend: 'rising', value: 13.5, name: 'Michalis Lerogiannis', team: 'R1', teamColor: 'linear-gradient(135deg, #102c66 0 50%, #d7ad32 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-akridas', priceTrend: 'stable', value: 13.0, name: 'Giannis Akridas', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'jordan-aslanis', priceTrend: 'falling', value: 12.3, name: 'Jordan Aslanis', team: 'Basement Boys', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #4a4f55 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'nikolas-moschonas', priceTrend: 'stable', value: 12.6, name: 'Nikolas Moschonas', team: 'R1', teamColor: 'linear-gradient(135deg, #102c66 0 50%, #d7ad32 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'alexandros-kalofolias', priceTrend: 'rising', value: 10.9, name: 'Alexandros Kalofolias', team: 'Thryloi', teamColor: '#fff', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'vasilis-efstathiou', priceTrend: 'stable', value: 10.0, name: 'Vasilis Efstathiou', team: 'Thryloi', teamColor: '#fff', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'taxiarchis-kassotakis', priceTrend: 'stable', value: 9.2, name: 'Taxiarchis Kassotakis', team: 'Spasmena Mila', teamColor: 'linear-gradient(135deg, #d63838 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'spyros-koskinas', priceTrend: 'falling', value: 8.2, name: 'Spyros Koskinas', team: 'Basement Boys', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #4a4f55 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'filippos-efstathiou', priceTrend: 'stable', value: 8.1, name: 'Filippos Efstathiou', team: 'Axtarmades', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-zacharopoulos', priceTrend: 'stable', value: 8.0, name: 'Giorgos Zacharopoulos', team: 'Volos Drummers', teamColor: 'linear-gradient(135deg, #2f6edb 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'johan-pilichos', priceTrend: 'stable', value: 7.3, name: 'Johan Pilichos', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'vasilis-tziovanis', priceTrend: 'stable', value: 7.5, name: 'Vasilis Tziovanis', team: 'Volos Drummers', teamColor: 'linear-gradient(135deg, #2f6edb 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'tzannis-mermigas', priceTrend: 'stable', value: 6.9, name: 'Tzannis Mermigas', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'aris-tsertos', priceTrend: 'stable', value: 6.5, name: 'Aris Tsertos', team: 'Spasmena Mila', teamColor: 'linear-gradient(135deg, #d63838 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'harris-rigas', priceTrend: 'stable', value: 6.6, name: 'Harris Rigas', team: 'Axtarmades', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stavros-stavropoulos', priceTrend: 'stable', value: 6.5, name: 'Stavros Stavropoulos', team: 'Lampater', teamColor: 'linear-gradient(135deg, #c93636 0 50%, #f1ce3d 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stefanos-mavrogiannis', priceTrend: 'rising', value: 6.5, name: 'Stefanos Mavrogiannis', team: 'Midi Kidz', teamColor: '#7d1823', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-stefanis', priceTrend: 'stable', value: 6.0, name: 'Giannis Stefanis', team: 'Volos Drummers', teamColor: 'linear-gradient(135deg, #2f6edb 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'panos-chardas', priceTrend: 'stable', value: 6.0, name: 'Panos Chardas', team: 'Warriors', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #2f6edb 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'sokratis-gkiolias-sr', priceTrend: 'stable', value: 6.0, name: 'Sokratis Gkiolias Sr', team: 'Warriors', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #2f6edb 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'dimitris-antoninis', priceTrend: 'rising', value: 5.8, name: 'Dimitris Antoninis', team: 'Polo', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #48c6cf 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'filippos-laskaris', priceTrend: 'rising', value: 5.9, name: 'Filippos Laskaris', team: 'Polo', teamColor: 'linear-gradient(135deg, #9fdcff 0 50%, #48c6cf 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-kordopatis', priceTrend: 'stable', value: 5.1, name: 'Giannis Kordopatis', team: 'Air Condition', teamColor: '#d9f6ff', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giorgos-karamolegkos', priceTrend: 'rising', value: 5.0, name: 'Giorgos Karamolegkos', team: 'Team Till Death', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'miltos-kapnakis', priceTrend: 'rising', value: 5.0, name: 'Miltos Kapnakis', team: 'Team Till Death', teamColor: 'linear-gradient(135deg, #f0cf3e 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'christos-katopodis', priceTrend: 'falling', value: 4.5, name: 'Christos Katopodis', team: 'Hornets', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #9d5ce8 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'dionysis-chalikias', priceTrend: 'falling', value: 4.5, name: 'Dionysis Chalikias', team: 'Niki Alimou', teamColor: '#176b3a', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'foivos-dousis', priceTrend: 'stable', value: 4.3, name: 'Foivos Dousis', team: 'Ksades', teamColor: 'linear-gradient(135deg, #f15b2a 0 50%, #c62828 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'panagiotis-perdikis', priceTrend: 'falling', value: 4.5, name: 'Panagiotis Perdikis', team: 'Niki Alimou', teamColor: '#176b3a', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'pavlos-tsonis', priceTrend: 'stable', value: 4.5, name: 'Pavlos Tsonis', team: 'Air Condition', teamColor: '#d9f6ff', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'avaris-ntzamilis', priceTrend: 'stable', value: 4.2, name: 'Avaris Ntzamilis', team: 'EX7T', teamColor: '#fff0a3', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'ennio-georgopoulos', priceTrend: 'stable', value: 4.0, name: 'Ennio Georgopoulos', team: 'Hornets', teamColor: 'linear-gradient(135deg, #00d9e8 0 50%, #9d5ce8 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'giannis-katsavounis', priceTrend: 'stable', value: 4.0, name: 'Giannis Katsavounis', team: 'Golden B.', teamColor: '#e2b93b', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'kalliopi-tsertou', priceTrend: 'stable', value: 4.0, name: 'Kalliopi Tsertou', team: 'Spasmena Mila', teamColor: 'linear-gradient(135deg, #d63838 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'konstantinos-sfikas', priceTrend: 'stable', value: 4.0, name: 'Konstantinos Sfikas', team: 'Ksades', teamColor: 'linear-gradient(135deg, #f15b2a 0 50%, #c62828 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'markos-kanellidis', priceTrend: 'stable', value: 4.0, name: 'Markos Kanellidis', team: 'Golden B.', teamColor: '#e2b93b', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'orfeas-maragkos', priceTrend: 'stable', value: 4.0, name: 'Orfeas Maragkos', team: 'Niki Alimou', teamColor: '#176b3a', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'sokratis-gkiolias-jr', priceTrend: 'stable', value: 4.1, name: 'Sokratis Gkiolias Jr', team: 'EX7T', teamColor: '#fff0a3', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'stavros-moutaftsidis', priceTrend: 'stable', value: 4.0, name: 'Stavros Moutaftsidis', team: 'Midi Kidz', teamColor: '#7d1823', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'petros-papaspyropoulos', priceTrend: 'stable', value: 5.5, name: 'Petros Papaspyropoulos', team: 'Spasmena Mila', teamColor: 'linear-gradient(135deg, #d63838 0 50%, #fff 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'iro-ganti', priceTrend: 'stable', value: 4.7, name: 'Iro Ganti', team: 'Hitters', teamColor: 'linear-gradient(135deg, #FF99E7 0 50%, #FFE3F8 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'theofania-sotiropoulou', priceTrend: 'stable', value: 4.7, name: 'Theofania Sotiropoulou', team: 'Hitters', teamColor: 'linear-gradient(135deg, #FF99E7 0 50%, #FFE3F8 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
  { id: 'polixeni-toussi', priceTrend: 'stable', value: 5.1, name: 'Polixeni Toussi', team: 'Hitters', teamColor: 'linear-gradient(135deg, #FF99E7 0 50%, #FFE3F8 50%)', lastFiveMatches: [], goals: 0, ownGoals: 0, mvps: 0 },
];

const FANTASY_GROUP_STAGE_FIXTURES = [
  { md: 1, h: 'EX7T', a: 'Midi Kidz' },
  { md: 1, h: 'Hornets', a: 'BADiles' },
  { md: 1, h: 'Team Till Death', a: 'Volos Drummers' },
  { md: 2, h: 'BADiles', a: 'EX7T' },
  { md: 2, h: 'Volos Drummers', a: 'Midi Kidz' },
  { md: 2, h: 'Team Till Death', a: 'Hornets' },
  { md: 3, h: 'EX7T', a: 'Volos Drummers' },
  { md: 3, h: 'BADiles', a: 'Team Till Death' },
  { md: 3, h: 'Midi Kidz', a: 'Hornets' },
  { md: 4, h: 'Team Till Death', a: 'EX7T' },
  { md: 4, h: 'Hornets', a: 'Volos Drummers' },
  { md: 4, h: 'Midi Kidz', a: 'BADiles' },
  { md: 5, h: 'EX7T', a: 'Hornets' },
  { md: 5, h: 'Team Till Death', a: 'Midi Kidz' },
  { md: 5, h: 'Volos Drummers', a: 'BADiles' },
  { md: 1, h: 'Lampater', a: 'Polo' },
  { md: 1, h: 'Air Condition', a: 'Ksades' },
  { md: 1, h: 'Basement Boys', a: 'R1' },
  { md: 2, h: 'Ksades', a: 'Lampater' },
  { md: 2, h: 'R1', a: 'Polo' },
  { md: 2, h: 'Basement Boys', a: 'Air Condition' },
  { md: 3, h: 'Lampater', a: 'R1' },
  { md: 3, h: 'Ksades', a: 'Basement Boys' },
  { md: 3, h: 'Polo', a: 'Air Condition' },
  { md: 4, h: 'Basement Boys', a: 'Lampater' },
  { md: 4, h: 'Air Condition', a: 'R1' },
  { md: 4, h: 'Polo', a: 'Ksades' },
  { md: 5, h: 'Lampater', a: 'Air Condition' },
  { md: 5, h: 'Basement Boys', a: 'Polo' },
  { md: 5, h: 'R1', a: 'Ksades' },
  { md: 1, h: 'Axtarmades', a: 'Niki Alimou' },
  { md: 1, h: 'Thryloi', a: 'Golden B.' },
  { md: 1, h: 'Spasmena Mila', a: 'Hitters' },
  { md: 2, h: 'Golden B.', a: 'Axtarmades' },
  { md: 2, h: 'Hitters', a: 'Niki Alimou' },
  { md: 2, h: 'Spasmena Mila', a: 'Thryloi' },
  { md: 3, h: 'Axtarmades', a: 'Hitters' },
  { md: 3, h: 'Golden B.', a: 'Spasmena Mila' },
  { md: 3, h: 'Niki Alimou', a: 'Thryloi' },
  { md: 4, h: 'Spasmena Mila', a: 'Axtarmades' },
  { md: 4, h: 'Thryloi', a: 'Hitters' },
  { md: 4, h: 'Niki Alimou', a: 'Golden B.' },
  { md: 5, h: 'Axtarmades', a: 'Thryloi' },
  { md: 5, h: 'Spasmena Mila', a: 'Niki Alimou' },
  { md: 5, h: 'Hitters', a: 'Golden B.' }
];

const FANTASY_CUP_ROUNDS = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];
let FANTASY_FIXTURES = [];

function getFantasyPlayerFixtures(player) {
  if (!player?.team) return [];
  const teamFixtures = FANTASY_FIXTURES.filter((fixture) => fixture.h === player.team || fixture.a === player.team);
  const mapFixture = (fixture) => {
    const home = fixture.h === player.team;
    return {
      gameweek: fixture.gameweek,
      opponent: home ? fixture.a : fixture.h,
      home,
      completed: fixture.completed,
      blank: false
    };
  };
  const cupFixtures = FANTASY_CUP_ROUNDS.map((round) => {
    const fixture = teamFixtures.find((item) => item.competition === 'PSL Cup' && item.round === round);
    return fixture
      ? mapFixture(fixture)
      : { gameweek: `PSL Cup · ${round}`, opponent: '', home: false, completed: true, blank: true };
  });
  return [
    ...teamFixtures.filter((fixture) => fixture.competition === 'PSL6 Group Stage').map(mapFixture),
    ...cupFixtures,
    ...teamFixtures.filter((fixture) => fixture.competition === 'League Phase').map(mapFixture)
  ];
}

const FANTASY_TEAM_LIMIT = 40.0;
const FANTASY_TEAM_SIZE = 5;
const FANTASY_STARTER_COUNT = 4;
const FANTASY_SUB_COUNT = 1;

const FANTASY_STORAGE_KEY = 'pitchballFantasyTeam';
const FANTASY_MATCHDAY_SQUADS_KEY = 'pitchballFantasyMatchdaySquads';
const FANTASY_SESSION_KEY = 'psl_session';

function getFantasyUserStorageKey(suffix) {
  const user = getCurrentFantasyUser();
  return user ? `${suffix}:${user.username.toLowerCase()}` : suffix;
}

function getPlayerById(playerId) {
  return FANTASY_PLAYERS.find((player) => player.id === playerId) || null;
}

function getPlayerPriceStatus(player) {
  const trend = String(player?.priceTrend || 'stable').toLowerCase();
  if (trend === 'rising' || trend.includes('rise') || trend.includes('up')) return 'Likely to rise';
  if (trend.includes('fall') || trend.includes('down') || trend.includes('drop')) return 'Likely to fall';
  return 'Price stable';
}

const FANTASY_PLAYER_PHOTOS = {
  'dimitris-gavalas': 'photos/dimitris-gavalas-removebg-preview.png',
  'giorgos-filippou': null,
  'thanos-chatziiordanou': 'photos/thanos-chatziiordanou-removebg-preview.png',
  'michalis-lerogiannis': null,
  'giannis-akridas': null,
  'jordan-aslanis': null,
  'nikolas-moschonas': null,
  'alexandros-kalofolias': null,
  'vasilis-efstathiou': null,
  'taxiarchis-kassotakis': null,
  'spyros-koskinas': null,
  'filippos-efstathiou': null,
  'giorgos-zacharopoulos': null,
  'johan-pilichos': 'photos/johan-pilichos-removebg-preview.png',
  'vasilis-tziovanis': null,
  'tzannis-mermigas': 'photos/tzannis-mermigas-removebg-preview.png',
  'aris-tsertos': 'photos/aris-tsertos-removebg-preview.png',
  'harris-rigas': null,
  'stavros-stavropoulos': null,
  'stefanos-mavrogiannis': null,
  'giannis-stefanis': null,
  'panos-chardas': null,
  'sokratis-gkiolias-sr': null,
  'dimitris-antoninis': null,
  'filippos-laskaris': null,
  'giannis-kordopatis': null,
  'giorgos-karamolegkos': 'photos/giorgos-karamolegkos-removebg-preview.png',
  'miltos-kapnakis': null,
  'christos-katopodis': null,
  'dionysis-chalikias': null,
  'foivos-dousis': null,
  'panagiotis-perdikis': null,
  'pavlos-tsonis': null,
  'avaris-ntzamilis': null,
  'ennio-georgopoulos': null,
  'giannis-katsavounis': null,
  'kalliopi-tsertou': null,
  'konstantinos-sfikas': null,
  'markos-kanellidis': null,
  'orfeas-maragkos': null,
  'sokratis-gkiolias-jr': null,
  'stavros-moutaftsidis': null
};

function getPlayerPhotoPath(player) {
  return player ? FANTASY_PLAYER_PHOTOS[player.id] || '' : '';
}

function getTeamLogoPath(team) {
  const logoFiles = {
    'Air Condition': 'ac.png',
    'Axtarmades': 'axtar.png',
    'BADiles': 'badiles.png',
    'Basement Boys': 'basement.png',
    'EX7T': 'ex7t.png',
    'Golden B.': 'gb.png',
    'Hornets': 'hornets.png',
    'Ksades': 'ksades.png',
    'Lampater': 'lpc.png',
    'Midi Kidz': 'midi.png',
    'Niki Alimou': 'alimou.png',
    'Polo': 'polo.png',
    'R1': 'r1.png',
    'Spasmena Mila': 'spasmena.png',
    'Team Till Death': 'ttd.png',
    'Thryloi': 'thryloi.png',
    'Volos Drummers': 'volos.png',
    'Warriors': 'warriors.png',
    'Hitters': 'hitters.png'
  };
  if (logoFiles[team]) return `logos/${logoFiles[team]}`;
  const slug = String(team || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug ? `logos/${slug}.png` : '';
}

function getFantasyStorageMatchdayId(matchdayId) {
  if (matchdayId !== undefined && matchdayId !== null) return String(matchdayId);
  const draft = typeof getFantasyDraftMatchday === 'function' ? getFantasyDraftMatchday() : null;
  const active = typeof fantasyMatchday !== 'undefined' ? fantasyMatchday : null;
  return String(draft?.id ?? active?.id ?? 'draft');
}

function getStoredFantasyMatchdaySquads() {
  try {
    const user = getCurrentFantasyUser();
    if (!user) return {};
    const raw = localStorage.getItem(getFantasyUserStorageKey(FANTASY_MATCHDAY_SQUADS_KEY));
    const squads = raw ? JSON.parse(raw) : {};
    return squads && typeof squads === 'object' && !Array.isArray(squads) ? squads : {};
  } catch (error) {
    return {};
  }
}

function getStoredFantasyMatchdaySquad(matchdayId) {
  const id = getFantasyStorageMatchdayId(matchdayId);
  const localSquad = getStoredFantasyMatchdaySquads()[id];
  const account = typeof fantasyAccount !== 'undefined' ? fantasyAccount : null;
  const accountSquad = account?.fantasyMatchdaySquads?.[id];
  if (localSquad || accountSquad) return { ...(accountSquad || {}), ...(localSquad || {}) };

  const allSquads = { ...(account?.fantasyMatchdaySquads || {}), ...getStoredFantasyMatchdaySquads() };
  const priorId = Object.keys(allSquads)
    .filter((squadId) => squadId !== 'draft' && Number(squadId) < Number(id) && allSquads[squadId]?.fantasyTeam)
    .sort((left, right) => Number(right) - Number(left))[0];
  if (priorId) return { ...allSquads[priorId] };
  if (!Object.keys(allSquads).some((squadId) => squadId !== 'draft') && allSquads.draft) {
    return { ...allSquads.draft };
  }

  try {
    const user = getCurrentFantasyUser();
    if (!user) return null;
    const rawTeam = localStorage.getItem(getFantasyUserStorageKey(FANTASY_STORAGE_KEY));
    const team = rawTeam ? JSON.parse(rawTeam) : account?.fantasyTeam;
    if (!Array.isArray(team)) return null;
    const rawCaptain = localStorage.getItem(getFantasyUserStorageKey('pitchballFantasyCaptain'));
    return {
      fantasyTeam: team,
      fantasyCaptain: rawCaptain || account?.fantasyCaptain || null,
      fantasyBudget: account?.fantasyBudget,
      fantasyPriceSnapshot: account?.fantasyPriceSnapshot
    };
  } catch (error) {
    return null;
  }
}

function getStoredFantasyTeam(matchdayId) {
  return getStoredFantasyMatchdaySquad(matchdayId)?.fantasyTeam || [];
}

function saveFantasyTeam(team, matchdayId) {
  const user = getCurrentFantasyUser();
  if (user) {
    const id = getFantasyStorageMatchdayId(matchdayId);
    const squads = getStoredFantasyMatchdaySquads();
    squads[id] = { ...(getStoredFantasyMatchdaySquad(id) || {}), fantasyTeam: team };
    localStorage.setItem(getFantasyUserStorageKey(FANTASY_MATCHDAY_SQUADS_KEY), JSON.stringify(squads));
  }
}

function getStoredFantasyCaptain(matchdayId) {
  const squad = getStoredFantasyMatchdaySquad(matchdayId);
  return squad?.fantasyCaptain || null;
}

function saveFantasyCaptain(playerId, matchdayId) {
  const user = getCurrentFantasyUser();
  if (!user) return;
  const id = getFantasyStorageMatchdayId(matchdayId);
  const squads = getStoredFantasyMatchdaySquads();
  squads[id] = { ...(getStoredFantasyMatchdaySquad(id) || {}), fantasyCaptain: playerId || null };
  localStorage.setItem(getFantasyUserStorageKey(FANTASY_MATCHDAY_SQUADS_KEY), JSON.stringify(squads));
}

function getFantasySubmissionState(matchdayId) {
  try {
    const id = getFantasyStorageMatchdayId(matchdayId);
    const raw = localStorage.getItem(getFantasyUserStorageKey('pitchballFantasySubmission'));
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && String(saved.matchdayId) === id) return saved;
    if (saved && typeof saved === 'object' && saved[id]) return saved[id];
    const account = typeof fantasyAccount !== 'undefined' ? fantasyAccount : null;
    const squad = account?.fantasyMatchdaySquads?.[id];
    if (squad?.submitted || squad?.transfersUsed !== undefined) {
      return {
        ...squad,
        matchdayId: id,
        transfersUsed: Number(squad.transfersUsed) || 0,
        transferPenalty: Number(squad.transferPenalty) || 0
      };
    }
    if (String(account?.fantasySubmittedMatchdayId) === id) {
      return {
        matchdayId: id,
        transfersUsed: Number(account.fantasyTransfersUsed) || 0,
        transferPenalty: Number(account.fantasyTransferPenalty) || 0
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

function saveFantasySubmissionState(state) {
  const id = getFantasyStorageMatchdayId(state?.matchdayId);
  const key = getFantasyUserStorageKey('pitchballFantasySubmission');
  let states = {};
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      states = saved.matchdayId !== undefined ? { [String(saved.matchdayId)]: saved } : saved;
    }
  } catch (error) {
    states = {};
  }
  states[id] = { ...state, matchdayId: id };
  localStorage.setItem(key, JSON.stringify(states));
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
