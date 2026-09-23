const FANTASY_ACCOUNT_DB_URL = 'https://ptchbl4-default-rtdb.europe-west1.firebasedatabase.app/.json';
const FANTASY_ACCOUNT_SESSION_KEY = 'psl_session';
const FANTASY_ACCOUNT_TEAM_KEY = 'pitchballFantasyTeam';
const FANTASY_ACCOUNT_CAPTAIN_KEY = 'pitchballFantasyCaptain';
const FANTASY_ACCOUNT_SUBMISSION_KEY = 'pitchballFantasySubmission';

async function restoreSubmittedFantasyTeam() {
  if (document.body.dataset.page !== 'build') return;

  let session;
  try {
    session = JSON.parse(localStorage.getItem(FANTASY_ACCOUNT_SESSION_KEY) || 'null');
  } catch (error) {
    return;
  }
  if (!session?.username) return;

  try {
    const response = await fetch(FANTASY_ACCOUNT_DB_URL);
    if (!response.ok) return;
    const db = await response.json();
    const account = db.users?.[session.username.toLowerCase()];
    if (!Array.isArray(account?.fantasyTeam) || account.fantasyTeam.length !== 5) return;

    const userKey = session.username.toLowerCase();
    localStorage.setItem(`${FANTASY_ACCOUNT_TEAM_KEY}:${userKey}`, JSON.stringify(account.fantasyTeam));
    if (account.fantasyCaptain) {
      localStorage.setItem(`${FANTASY_ACCOUNT_CAPTAIN_KEY}:${userKey}`, account.fantasyCaptain);
    }
    if (account.fantasySubmittedMatchdayId !== undefined) {
      localStorage.setItem(`${FANTASY_ACCOUNT_SUBMISSION_KEY}:${userKey}`, JSON.stringify({
        matchdayId: account.fantasySubmittedMatchdayId,
        transfersUsed: Number(account.fantasyTransfersUsed) || 0
      }));
    }

    if (typeof renderBuildBoard === 'function') renderBuildBoard();
  } catch (error) {
    // The main fantasy app displays its normal offline/error state.
  }
}

document.addEventListener('DOMContentLoaded', restoreSubmittedFantasyTeam);
