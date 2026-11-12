# YouTube Focus Mode

> A Manifest V3 Chrome Extension that turns YouTube into a distraction-free study tool.

YouTube is full of traps — the sidebar, Shorts, autoplay, comments — all designed to pull you away from what you actually opened the tab for. **YouTube Focus Mode** removes them and replaces the experience with a clean, minimal environment built for deep work.

---

## ✨ Features

### 🚫 Distraction Blocking
Hides the elements that steal your attention. Toggle each one independently from the Settings page:
- **Sidebar & Suggested Videos** — removes the "Up Next" panel on the watch page
- **Shorts Shelves** — wipes Shorts rows from every page
- **Comments Section** — collapses the comment thread below the player

### 🏠 Search-Only Homepage ("The Void")
When Study Mode is on and you navigate to `youtube.com`, the home feed is replaced with a minimal screen showing your current goal and the search bar. Use it to find your study material — nothing else.

### ⏱️ Persistent Focus Timer
A floating panel sits in the bottom-left corner of every YouTube page, showing:
- Your current study **goal**
- **Time elapsed** in the current session (calculated from a saved Unix timestamp — no background timers)

The panel has a subtle **Dynamic Aura** border that slowly pulses through deep blues and purples.

### 🔔 Smart Break Reminders
At your chosen interval, a modal appears and pauses the video to prompt a break. Choose your rhythm from the Settings page:
| Option | Interval |
|---|---|
| Pomodoro | Every 25 minutes |
| Deep Work | Every 40 minutes |
| Long Session | Every 60 minutes |
| No Breaks | Disabled |

Dismiss with **Skip Break** to keep watching, or **Take a Break** to leave the video paused.

### 🧘 Breathe Transition
Every time you turn Study Mode **on**, a 4-second full-screen animation plays: *"Breathe in..."* fades into *"Breathe out..."* over a blurred dark overlay — a moment to reset before focusing.

### 🔒 Math-to-Unlock ("Strict Mode")
Turning Study Mode **off** requires solving a quick mental math problem first. No more mindlessly clicking away when you get bored.

### ⚙️ Settings Page
Right-click the toolbar icon → **Options** to open a full settings page where you can configure:
- Which distractions to hide
- Your break reminder interval

All settings are saved locally in your browser. Nothing ever leaves your device.

---

## 🗂️ File Structure

```
youtube-focus-mode/
├── manifest.json     # Extension config (MV3)
├── content.js        # Injected into every YouTube page
├── focus.css         # CSS rules that hide distraction elements
├── popup.html        # Toolbar popup UI
├── popup.js          # Popup logic (toggle, math gate)
├── options.html      # Settings page UI
├── options.js        # Settings page logic
├── icon.png          # Extension icon
└── README.md
```

---

## 🛠️ How to Install (No Developer Experience Needed)

You can install this extension directly in Chrome without publishing it to the Web Store. This takes about 60 seconds.

### Step 1 — Download the files

Click the green **Code** button on this GitHub page, then select **Download ZIP**.

Unzip the folder somewhere you'll remember — for example, your Desktop or Documents.

### Step 2 — Open Chrome Extensions

Open Google Chrome and type the following into the address bar, then press **Enter**:

```
chrome://extensions
```

### Step 3 — Enable Developer Mode

In the top-right corner of the Extensions page, toggle **Developer mode** ON.

You'll see three new buttons appear at the top-left.

### Step 4 — Load the Extension

Click **Load unpacked**.

In the file picker that opens, navigate to the folder you unzipped in Step 1 — the one that contains `manifest.json`. Select that folder and click **Open**.

### Step 5 — Done!

The **YouTube Focus Mode** card will appear on the Extensions page with your icon.

Pin it to your toolbar by clicking the puzzle-piece icon (🧩) in Chrome's toolbar and clicking the pin next to **YouTube Focus Mode**.

---

## 🚀 How to Use

1. Navigate to [youtube.com](https://youtube.com)
2. Click the extension icon in the toolbar
3. Type your study goal (e.g. *"Finish Chapter 4 notes"*)
4. Click **Turn On Study Mode**
5. Watch the Breathe Transition play, then get to work

To adjust what gets hidden or change your break interval, right-click the icon and select **Options**.

---

## 🔄 Updating After Code Changes

If you edit any of the source files and want Chrome to pick up the changes:

1. Go to `chrome://extensions`
2. Click the **↺ refresh** button on the YouTube Focus Mode card
3. Refresh any open YouTube tabs

---

## 🔒 Privacy

This extension has **no backend, no server, and no analytics**. It requests only the `storage` permission, which lets it save your preferences to your local browser using `chrome.storage.local`. No data is ever sent anywhere.

---

## 🧰 Built With

- Vanilla JavaScript (ES6+)
- Vanilla HTML & CSS
- Chrome Extension Manifest V3
- `chrome.storage.local` for all state management

No frameworks. No build tools. No dependencies.

