# Proposal

## Why

Perfect Life Lite currently records sleep, manually entered daily tasks, and meals, but its single-screen structure makes it hard to grow into the personal life notebook the owner wants. The next version should make it easy to record what is actually happening throughout the day, remember future commitments, and review past days without relying on background execution or cloud services.

## What Changes

- Add timestamp-based activity sessions: enter any activity name and start; starting another activity ends the current one; repeated sessions with the same name contribute to that day's total. Rest may be tracked as an activity or left as an unrecorded gap.
- Add start/stop sleep recording while preserving manual correction of past times.
- Change daily tasks into date-based reminders that appear in the app on their due date; do not add background notifications.
- Add a month calendar for direct date selection with small indicators for days containing records.
- Reorganize the app into feature-oriented modules so activity tracking, sleep, reminders, meals, calendar, and shared persistence can evolve independently.
- Keep all records local in IndexedDB and include new records in JSON export/import, preserving support for existing version 1 backups.
- Keep existing meal logging, photo storage, PWA installation, and offline use.

## Capabilities

### New Capabilities
- `activity-tracking`: Record and review timestamped activity sessions and totals.
- `dated-reminders`: Create and complete tasks associated with a selected due date, surfaced inside the app.
- `life-calendar`: Navigate by month and select dates with record indicators.
- `sleep-tracking`: Record sleep with start/stop controls while retaining editable historical intervals.
- `data-backup`: Back up and restore all local records, including new activity and reminder data.

## Impact

- Affected UI and application structure: `src/App.tsx`, `src/data.ts`, and new feature-focused modules and components.
- IndexedDB schema will be upgraded to add activity sessions and reminder dates while retaining current sleep and meal data.
- JSON backup format will advance while accepting version 1 data.
- No server, account, push notification, or new runtime service is introduced. PWA assets and GitHub Pages deployment remain in place.
- Standalone free-text journal entries are not included in this change; the activity log covers timed descriptions of what happened. A separate notes feature can be explored later.
