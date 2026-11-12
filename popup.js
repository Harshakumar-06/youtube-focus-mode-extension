const toggleBtn     = document.getElementById('toggleBtn');
const goalInput     = document.getElementById('goal');
const mathChallenge = document.getElementById('mathChallenge');
const mathQuestion  = document.getElementById('mathQuestion');
const mathAnswer    = document.getElementById('mathAnswer');
const mathSubmit    = document.getElementById('mathSubmit');
const mathCancel    = document.getElementById('mathCancel');
const mathError     = document.getElementById('mathError');

// Stored so the submit handler can verify without regenerating
let _expectedAnswer = null;

// ── Boot: reflect saved state ──────────────────────────────────────────────
chrome.storage.local.get(['studyModeEnabled', 'studyGoal'], (result) => {
  goalInput.value = result.studyGoal || '';
  updateButtonUI(result.studyModeEnabled);
});

// ── Main toggle button ─────────────────────────────────────────────────────
toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['studyModeEnabled'], (result) => {
    if (result.studyModeEnabled) {
      // Guard: make them solve a math problem before turning off
      showMathChallenge();
    } else {
      // Turning ON — no gate needed
      applyToggle(true);
    }
  });
});

// ── Math challenge: show ───────────────────────────────────────────────────
function showMathChallenge() {
  const num1 = Math.floor(Math.random() * 20) + 10;
  const num2 = Math.floor(Math.random() * 20) + 10;
  _expectedAnswer = num1 + num2;

  mathQuestion.textContent = `Solve to exit: ${num1} + ${num2} = ?`;
  mathAnswer.value = '';
  mathError.style.display = 'none';
  mathChallenge.style.display = 'block';
  mathAnswer.focus();
}

// ── Math challenge: submit ─────────────────────────────────────────────────
mathSubmit.addEventListener('click', () => {
  if (parseInt(mathAnswer.value, 10) === _expectedAnswer) {
    hideMathChallenge();
    applyToggle(false);       // Correct — now actually turn it off
  } else {
    mathError.style.display = 'block';
    mathAnswer.value = '';
    mathAnswer.focus();
  }
});

// Allow Enter key to submit
mathAnswer.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') mathSubmit.click();
});

// ── Math challenge: cancel ─────────────────────────────────────────────────
mathCancel.addEventListener('click', hideMathChallenge);

function hideMathChallenge() {
  mathChallenge.style.display = 'none';
  mathError.style.display = 'none';
  _expectedAnswer = null;
}

// ── Shared save + UI update ────────────────────────────────────────────────
function applyToggle(newState) {
  const newGoal = goalInput.value.trim() || "Stay Focused!";

  const storageData = {
    studyModeEnabled: newState,
    studyGoal: newGoal
  };

  // Only stamp a fresh start time when turning ON
  if (newState) {
    storageData.sessionStartTime = Date.now();
  }

  chrome.storage.local.set(storageData, () => {
    updateButtonUI(newState);
  });
}

// ── Button appearance ──────────────────────────────────────────────────────
function updateButtonUI(isEnabled) {
  toggleBtn.innerText = isEnabled ? 'Turn Off Study Mode' : 'Turn On Study Mode';
  toggleBtn.style.backgroundColor = isEnabled ? '#ff4e45' : '#4CAF50';
  toggleBtn.style.color = 'white';
}
