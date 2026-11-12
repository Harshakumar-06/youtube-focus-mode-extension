function enforceStudyMode() {
  chrome.storage.local.get(['studyModeEnabled', 'studyGoal', 'sessionStartTime'], (result) => {
    if (result.studyModeEnabled) {
      document.documentElement.setAttribute('data-study-mode', 'true');
      injectTimerPanel(result.studyGoal || "Focusing...");
    } else {
      document.documentElement.removeAttribute('data-study-mode');
      removeTimerPanel();
    }
  });
}

function injectTimerPanel(goalText) {
  if (document.getElementById('nyc-study-panel')) return;

  const host = document.createElement('div');
  host.id = 'nyc-study-panel';
  host.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 999999;';

  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `
    <style>
      .panel {
        background: #0f0f0f; border: 1px solid #333; color: white;
        padding: 16px; border-radius: 8px; font-family: sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 220px;
      }
      .goal { font-weight: bold; margin-bottom: 8px; font-size: 14px;}
      .timer { font-size: 24px; color: #ff4e45; font-weight: bold; }
    </style>
    <div class="panel">
      <div class="goal">Goal: ${goalText}</div>
      <div class="timer" id="time-spent">0m</div>
    </div>
  `;

  document.body.appendChild(host);
  startTimerDisplay(shadow);
}

function removeTimerPanel() {
  const panel = document.getElementById('nyc-study-panel');
  if (panel) panel.remove();
}

function startTimerDisplay(shadowRoot) {
  const timerElement = shadowRoot.getElementById('time-spent');
  
  chrome.storage.local.get(['sessionStartTime'], (result) => {
    if (!result.sessionStartTime) return;

    const updateTimer = () => {
      const elapsedMs = Date.now() - result.sessionStartTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      timerElement.innerText = `${elapsedMinutes}m`;
    };

    updateTimer(); // Run immediately
    setInterval(updateTimer, 1000); // Update UI every second
  });
}

// Run on initial load, on YouTube SPA navigation, and when popup is toggled
enforceStudyMode();
document.addEventListener('yt-navigate-finish', enforceStudyMode);
chrome.storage.onChanged.addListener(enforceStudyMode);