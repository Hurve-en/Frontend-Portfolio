# Modern Digital Clock

Files:
- `clock.html` — main HTML
- `clock.css` — styles (light/dark)
- `clock.js` — behavior (timezone, alarm, analog)

## How to run
Open `clock.html` in any modern browser (double-click file or `File → Open`).

No build tools required.

## Features
- Displays current local time (hours:minutes:seconds), updates every second.
- 12-hour (AM/PM) and 24-hour modes (toggle).
- Displays current date (weekday, month, day, year).
- Two view modes: **Digital + Analog** (default) and **Minimal** (time only).
- Timezone selection (presets): Local, UTC, New York, London, Tokyo — plus the browser's detected timezone.
- Alarm: set a single alarm time (HH:MM). When matching, shows visual alarm state and plays a short beep.
  - Stop and Snooze (5 minutes) controls.
  - If alarm time is in the past for today, it will trigger next day when time matches.
- Persisted settings: 12/24-hour mode, selected timezone, chosen view mode, theme, alarm time (via `localStorage`).
- Light / Dark theme with persistent toggle.
- Accessible: `aria-live` for time updates, keyboard-operable controls, visible focus outlines.

## Keyboard shortcuts
- Tab / Shift+Tab to navigate controls.
- Enter or Space on focused controls to activate.
- Esc while focused on alarm time input clears that input.

## Design decisions & limitations
- Timezone approach: uses `Intl.DateTimeFormat.formatToParts` to extract timezone-local numeric parts for the current instant. This avoids trying to construct Date objects in arbitrary timezones.
- Alarm compares HH:MM on that timezone. If current timezone-local time matches alarm HH:MM, alarm triggers. If the alarm time was already earlier today, it will trigger the next day when matching again.
- Audio: primary alarm uses Web Audio API oscillator. Fallback is a tiny embedded `<audio>` sample. Browser autoplay policies may prevent sound until the user interacts — the UI notifies the user when audio is blocked.
- Single alarm only (design choice for simplicity).
- Time precision: clock updates aligned to system clock, using `setTimeout` aligned to next second to avoid drift.
- Time formatting: rounding/padding follows human readable conventions. Leading zeros shown.

## Manual test cases
1. **Default load**: opens showing local time; default theme follows system preference; 12/24 persisted if changed.
2. **12/24 toggle**: click `12/24` button — AM/PM appears/disappears appropriately.
3. **Change timezone**: select `UTC` — the displayed time should match UTC current time (compare with an online UTC clock).
4. **Alarm test**:
   - Set alarm to one minute ahead (input HH:MM). Wait — when the chosen timezone's minute matches, visual alarm appears and beep plays (if audio allowed). Click **Snooze 5m** — alarm stops and will re-trigger 5 minutes later. Click **Stop** — alarm stops and cleared display.
5. **Persist settings**: change theme, timezone, view mode, toggle 24-hour, set alarm. Reload page — settings should persist.
6. **Past-time alarm**: set alarm time to a time earlier today — the alarm will next trigger the following day at that time.
7. **Minimal view**: switch to **Minimal** view — analog hides and time grows.
8. **Background tab**: leave the tab for 10 minutes and return — the clock shows correct current time (no significant drift).
9. **Keyboard**: Tab to controls, use Enter/Space to toggle theme or set alarm; Esc clears alarm input.

## Notes for developers
- Key functions in `clock.js`: `loadSettings()`, `saveSettings()`, `getPartsForZone()`, `updateTime()`, `checkAndTriggerAlarm()`, `startBeep()`, `stopBeep()`.
- The code uses an IIFE to avoid global namespace pollution and exposes a small `_clock` debug object.
- To extend: support multiple alarms, add snooze duration setting, or add "alarm repeats" and label.

If you want, I can:
- Add a small on-screen "Enable audio" button that calls `AudioContext.resume()` to satisfy autoplay policies.
- Add persistent alarm history.
- Expand timezone list or add a lookup field.
