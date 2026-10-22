# Tasks

## 1. Persistence and feature structure

- [x] 1.1 Create feature-oriented app/shared module boundaries and move database setup behind typed data access helpers; verify `npm run build` passes and the current app still loads existing sleep, task, and meal stores.
- [x] 1.2 Upgrade IndexedDB additively with activity intervals and active sleep support; add focused tests for elapsed-time calculation, local-date grouping, and one-active-interval switching, and verify old version 1 data remains readable.
- [x] 1.3 Update versioned backup validation/export/import to include activity intervals and reminders while accepting version 1 files; verify valid round trips, legacy import, and invalid-file non-destructive behavior.

## 2. Timed activity and sleep features

- [x] 2.1 Build the activity timer view for free-form names, active elapsed time, stop/switch behavior, rest entries, and per-day totals; verify switching closes the prior interval at the same timestamp and repeated names aggregate without losing individual intervals.
- [x] 2.2 Build start/stop sleep controls and preserve historical editing; verify intervals crossing midnight calculate correctly and active timers restore after a page reload.
- [x] 2.3 Add correction and deletion flows for historical activity intervals; verify edits immediately recalculate timeline ordering and totals.

## 3. Dated reminders and calendar

- [x] 3.1 Replace duration-oriented daily-task UI with date-based reminder create/edit/complete/delete flows and today/overdue display; verify reminders remain separate from activity totals and appear for their due date.
- [x] 3.2 Build a monthly date picker with month navigation, today shortcut, selected-day state, and category dots; verify markers update after adding or deleting activity, sleep, meal, or reminder records.

## 4. Integration and usage guidance

- [x] 4.1 Integrate the feature views into a mobile-first home/day review and preserve existing meal logging and photo behavior; verify the production build succeeds and all day views respond to calendar selection.
- [x] 4.2 Update README with the feature model, local data/backup behavior, Android PWA use, and testing steps; verify documented local commands match `package.json`.
- [ ] 4.3 Run final build and available automated tests, then manually verify start/switch/stop, app reload with active timer, sleep across midnight, dated reminders, calendar markers, and backup compatibility.
