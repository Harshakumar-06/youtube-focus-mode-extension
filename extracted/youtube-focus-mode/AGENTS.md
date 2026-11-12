# YouTube Focus Mode

## Project Context
A simple Manifest V3 Chrome Extension that enforces a strict "theater mode" on YouTube to block distractions.

## Standards
- Vanilla JS, HTML, CSS (No bundlers).
- Use `chrome.storage.local` to track `studyModeEnabled` and `sessionStartTime`.

## Constraints
- Must handle YouTube SPA navigation (`yt-navigate-finish`).
- Must not use `setInterval` in background workers for timers (calculate from Unix timestamp in content script).
