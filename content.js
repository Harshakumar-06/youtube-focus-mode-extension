let _timerIntervalId    = null;
let _lastBreakMilestone = 0;   // tracks the last 40-min milestone shown; reset on session end

// Granular setting keys and their corresponding data-attributes on <html>
const SETTING_ATTRS = {
  hideSidebar:  'data-hide-sidebar',
  hideShorts:   'data-hide-shorts',
  hideComments: 'data-hide-comments',
};

// Defaults mirror options.js so the extension is useful out of the box
const SETTING_DEFAULTS = {
  hideSidebar:  true,
  hideShorts:   true,
  hideComments: false,
};

function enforceStudyMode() {
  const keys = ['studyModeEnabled', 'studyGoal', 'sessionStartTime', ...Object.keys(SETTING_ATTRS)];

  chrome.storage.local.get(keys, (result) => {
    const html = document.documentElement;

    if (result.studyModeEnabled) {
      html.setAttribute('data-study-mode', 'true');

      // Apply (or remove) each granular attribute based on saved prefs
      for (const [key, attr] of Object.entries(SETTING_ATTRS)) {
        const enabled = (key in result) ? result[key] : SETTING_DEFAULTS[key];
        if (enabled) {
          html.setAttribute(attr, 'true');
        } else {
          html.removeAttribute(attr);
        }
      }

      // Homepage: show the void overlay; other pages: remove it
      if (window.location.pathname === '/') {
        injectVoidOverlay(result.studyGoal || 'Focusing...');
      } else {
        removeVoidOverlay();
      }

      injectTimerPanel(result.studyGoal || "Focusing...");
    } else {
      // Study mode off — scrub every attribute we own
      html.removeAttribute('data-study-mode');
      for (const attr of Object.values(SETTING_ATTRS)) {
        html.removeAttribute(attr);
      }
      removeVoidOverlay();
      removeTimerPanel();
    }
  });
}

// ── Void overlay (homepage search-only view) ──────────────────────────────

function injectVoidOverlay(goalText) {
  if (document.getElementById('nyc-void-overlay')) return;

  // Measure the masthead so the overlay starts exactly below it
  const mastheadEl = document.querySelector('#masthead-container, #masthead');
  const mastheadH  = mastheadEl ? mastheadEl.offsetHeight : 56;

  const overlay = document.createElement('div');
  overlay.id = 'nyc-void-overlay';
  overlay.style.cssText = [
    'position: fixed',
    `top: ${mastheadH}px`,
    'left: 0',
    'right: 0',
    'bottom: 0',
    'z-index: 99998',           // below the timer panel (999999) but above everything else
    'background: #0f0f0f',
    'display: flex',
    'flex-direction: column',
    'align-items: center',
    'justify-content: center',
    'color: white',
    'font-family: sans-serif',
    'text-align: center',
    'padding: 24px',
  ].join(';');

  // Use textContent for user-supplied strings to avoid XSS
  const h1 = document.createElement('h1');
  h1.style.cssText = 'font-size: 3rem; margin: 0 0 10px;';
  h1.textContent = 'Distractions Blocked.';

  const goal = document.createElement('p');
  goal.style.cssText = 'font-size: 1.5rem; color: #ff4e45; margin: 0 0 20px;';
  goal.textContent = `Current Goal: ${goalText}`;

  const hint = document.createElement('p');
  hint.style.cssText = 'color: #888; margin: 0;';
  hint.textContent = 'Use the search bar above to find your study material.';

  overlay.append(h1, goal, hint);
  document.body.appendChild(overlay);
}

function removeVoidOverlay() {
  const overlay = document.getElementById('nyc-void-overlay');
  if (overlay) overlay.remove();
}

// ── Timer panel ───────────────────────────────────────────────────────────

function injectTimerPanel(goalText) {
  if (document.getElementById('nyc-study-panel')) return;

  const host = document.createElement('div');
  host.id = 'nyc-study-panel';
  host.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 999999;';

  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `
    <style>
      @keyframes nyc-aura {
        0%   { border-color: #1a1a4e; box-shadow: 0 0 12px rgba(26, 26, 78, 0.4); }
        25%  { border-color: #2d1b69; box-shadow: 0 0 12px rgba(45, 27, 105, 0.4); }
        50%  { border-color: #4a2080; box-shadow: 0 0 12px rgba(74, 32, 128, 0.4); }
        75%  { border-color: #2b3a8e; box-shadow: 0 0 12px rgba(43, 58, 142, 0.4); }
        100% { border-color: #1a1a4e; box-shadow: 0 0 12px rgba(26, 26, 78, 0.4); }
      }
      .panel {
        background: #0f0f0f;
        border: 2px solid #1a1a4e;
        color: white;
        padding: 16px;
        border-radius: 8px;
        font-family: sans-serif;
        width: 220px;
        animation: nyc-aura 10s ease infinite;
      }
      .goal { font-weight: bold; margin-bottom: 8px; font-size: 14px; }
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
  if (_timerIntervalId !== null) {
    clearInterval(_timerIntervalId);
    _timerIntervalId = null;
  }
  // Reset milestone so a fresh session starts clean
  _lastBreakMilestone = 0;
  removeBreakReminder();
}

function startTimerDisplay(shadowRoot) {
  const timerElement = shadowRoot.getElementById('time-spent');

  chrome.storage.local.get(['sessionStartTime', 'breakInterval'], (result) => {
    if (!result.sessionStartTime) return;

    // 0 means "No Breaks"; fall back to 40 if the setting was never saved
    const interval = (result.breakInterval !== undefined) ? result.breakInterval : 40;

    const updateTimer = () => {
      const elapsedMs      = Date.now() - result.sessionStartTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      timerElement.innerText = `${elapsedMinutes}m`;

      // Fire break reminder only when a valid interval is set
      if (interval > 0 &&
          elapsedMinutes > 0 &&
          elapsedMinutes % interval === 0 &&
          elapsedMinutes !== _lastBreakMilestone) {
        _lastBreakMilestone = elapsedMinutes;
        injectBreakReminder(elapsedMinutes);
      }
    };

    updateTimer(); // Run immediately
    _timerIntervalId = setInterval(updateTimer, 1000); // Update UI every second
  });
}

// ── Break reminder modal ──────────────────────────────────────────────────

function injectBreakReminder(elapsedMinutes) {
  if (document.getElementById('nyc-break-reminder')) return;

  const host = document.createElement('div');
  host.id = 'nyc-break-reminder';
  // Full-screen host, above timer panel (999999) and void overlay (99998)
  host.style.cssText = 'position: fixed; inset: 0; z-index: 1000000;';

  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `
    <style>
      .backdrop {
        position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.78);
        display: flex; align-items: center; justify-content: center;
      }
      .modal {
        background: #1a1a1a; border: 1px solid #2e2e2e; color: #fff;
        padding: 36px 32px; border-radius: 14px; text-align: center;
        max-width: 380px; width: 90%;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.7);
        font-family: sans-serif;
      }
      .icon  { font-size: 2.8rem; margin-bottom: 14px; }
      h2     { margin: 0 0 10px; font-size: 1.35rem; color: #fff; }
      p      { margin: 0 0 26px; color: #999; font-size: 0.95rem; line-height: 1.6; }
      strong { color: #ff4e45; }
      .buttons { display: flex; gap: 12px; justify-content: center; }
      button {
        padding: 11px 22px; border: none; border-radius: 7px;
        font-size: 14px; font-weight: bold; cursor: pointer;
        transition: background 0.15s;
      }
      .take-break { background: #ff4e45; color: #fff; }
      .take-break:hover { background: #d93c34; }
      .skip-break { background: #2e2e2e; color: #bbb; }
      .skip-break:hover { background: #3a3a3a; }
    </style>
    <div class="backdrop">
      <div class="modal">
        <div class="icon">⏸</div>
        <h2>Break Time!</h2>
        <p>You have been focusing for <strong>${elapsedMinutes} minutes</strong>.<br>Time for a short break!</p>
        <div class="buttons">
          <button class="take-break">Take a Break</button>
          <button class="skip-break">Skip Break</button>
        </div>
      </div>
    </div>
  `;

  // "Take a Break" — pause the video and leave the modal visible as a reminder
  shadow.querySelector('.take-break').addEventListener('click', () => {
    const video = document.querySelector('video');
    if (video && !video.paused) video.pause();
  });

  // "Skip Break" — dismiss the modal and let the user continue
  shadow.querySelector('.skip-break').addEventListener('click', () => {
    host.remove();
  });

  document.body.appendChild(host);
}

function removeBreakReminder() {
  const reminder = document.getElementById('nyc-break-reminder');
  if (reminder) reminder.remove();
}

// ── Breathe transition (plays only on explicit OFF → ON toggle) ───────────

function playBreatheTransition() {
  if (document.getElementById('nyc-breathe-overlay')) return;

  // Inject keyframes once into <head> — focus.css can't reliably style
  // dynamically created elements on YouTube's heavily overriding stylesheet
  if (!document.getElementById('nyc-breathe-styles')) {
    const style = document.createElement('style');
    style.id = 'nyc-breathe-styles';
    style.textContent = `
      @keyframes nyc-fade-overlay {
        0%   { opacity: 0; }
        8%   { opacity: 1; }
        88%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes nyc-fade-in-text {
        0%   { opacity: 0; }
        15%  { opacity: 1; }
        42%  { opacity: 1; }
        58%  { opacity: 0; }
        100% { opacity: 0; }
      }
      @keyframes nyc-fade-out-text {
        0%   { opacity: 0; }
        58%  { opacity: 0; }
        72%  { opacity: 1; }
        88%  { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Build overlay entirely with inline styles — zero dependency on focus.css
  const overlay = document.createElement('div');
  overlay.id = 'nyc-breathe-overlay';
  Object.assign(overlay.style, {
    position:        'fixed',
    inset:           '0',
    zIndex:          '2000000',
    background:      'rgba(10, 10, 15, 0.92)',
    backdropFilter:  'blur(10px)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    animation:       'nyc-fade-overlay 4s ease forwards',
  });

  const sharedTextStyle = {
    position:     'absolute',
    fontSize:     '2.4rem',
    fontWeight:   '300',
    color:        '#ffffff',
    fontFamily:   'sans-serif',
    letterSpacing:'0.06em',
    pointerEvents:'none',
  };

  const breatheIn = document.createElement('span');
  breatheIn.textContent = 'Breathe in...';
  Object.assign(breatheIn.style, sharedTextStyle, {
    animation: 'nyc-fade-in-text 4s ease forwards',
  });

  const breatheOut = document.createElement('span');
  breatheOut.textContent = 'Breathe out...';
  Object.assign(breatheOut.style, sharedTextStyle, {
    animation: 'nyc-fade-out-text 4s ease forwards',
  });

  overlay.append(breatheIn, breatheOut);
  document.body.appendChild(overlay);

  // animationend bubbles from children too — only remove when the
  // overlay's own animation fires (e.target guard)
  overlay.addEventListener('animationend', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────

enforceStudyMode();

// SPA navigation: re-apply mode state, never play the transition
document.addEventListener('yt-navigate-finish', enforceStudyMode);

// Popup toggle: re-apply mode state AND play transition on explicit OFF → ON
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  enforceStudyMode();

  // oldValue is false/undefined (never set) → newValue is true  =  user just turned it ON
  if (changes.studyModeEnabled &&
      !changes.studyModeEnabled.oldValue &&
      changes.studyModeEnabled.newValue === true) {
    playBreatheTransition();
  }
});