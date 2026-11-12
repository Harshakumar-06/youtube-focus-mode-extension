const toggleBtn = document.getElementById('toggleBtn');
const goalInput = document.getElementById('goal');

// Load current state when popup opens
chrome.storage.local.get(['studyModeEnabled', 'studyGoal'], (result) => {
  goalInput.value = result.studyGoal || '';
  updateButtonUI(result.studyModeEnabled);
});

// Handle toggling on/off
toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['studyModeEnabled'], (result) => {
    const newState = !result.studyModeEnabled;
    const newGoal = goalInput.value.trim() || "Stay Focused!";
    
    const storageData = {
      studyModeEnabled: newState,
      studyGoal: newGoal
    };

    // Only set a new start time if we are turning it ON
    if (newState) {
      storageData.sessionStartTime = Date.now();
    }

    chrome.storage.local.set(storageData, () => {
      updateButtonUI(newState);
    });
  });
});

function updateButtonUI(isEnabled) {
  toggleBtn.innerText = isEnabled ? 'Turn Off Study Mode' : 'Turn On Study Mode';
  toggleBtn.style.backgroundColor = isEnabled ? '#ff4e45' : '#4CAF50';
  toggleBtn.style.color = 'white';
}