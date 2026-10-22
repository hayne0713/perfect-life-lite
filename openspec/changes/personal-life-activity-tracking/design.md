# Design

## Context

The current app is a React/Vite PWA. `src/App.tsx` owns the page, record loading, editing forms, and all three current record areas; `src/data.ts` owns a single IndexedDB database at version 1. Existing tasks contain a date, title, duration, and completion state. Sleep records require both timestamps, so they cannot represent an active sleep timer. There are no existing OpenSpec capability specs.

## Goals / Non-Goals

**Goals:**
- Separate the app shell, feature UI, and local persistence so new personal features can be added without expanding one component.
- Make activity and sleep timing resilient to browser suspension by persisting timestamps, not relying on a continuously running interval.
- Upgrade local data and backups without discarding existing records.
- Keep features usable offline and without accounts or a backend.

**Non-Goals:**
- Add background notifications, cloud sync, accounts, or native Android background services.
- Add a standalone prose journal, habit streaks, social features, or predefined activity catalogs.
- Introduce a generalized plugin framework or state-management library.

## Decisions

### Use feature-oriented UI modules with a small shared app shell

Move page-level orchestration into `src/app`, place each capability's view and feature logic under `src/features/<capability>`, and keep shared database setup, date/time helpers, and reusable controls under `src/shared` or `src/data`. The app shell owns selected date, navigation, active timer refresh, and backup/restore; feature modules own their own forms and record presentation.

This gives each capability a clear home while staying proportionate to a single-user app. A layered enterprise architecture or plugin registry was considered and rejected because it would add indirection before there are independent teams or third-party extensions.

### Persist interval timestamps and derive elapsed time

Store each activity interval as its own record with a free-form trimmed name, start timestamp, and nullable end timestamp. Store an active sleep interval the same way. A shared active-interval rule ensures only one activity or sleep timer is active: starting a new interval closes the previous interval at the same timestamp. Repeated activities remain separate intervals; daily summaries group by exact trimmed name and local date.

The browser may suspend or discard the page, so the visible clock is only a presentation refresh. IndexedDB retains the start timestamp; elapsed time is derived from that value and the current time whenever the page opens or resumes. An active-page interval updates the display, and a visibility change triggers an immediate refresh. The implementation does not depend on a background JavaScript loop.

Using a conventional continuously incremented counter was considered and rejected because a suspended or terminated page could lose elapsed time. A native foreground service was rejected because it would violate the no-native/no-backend PWA scope.

### Keep reminders distinct from actual activity intervals

Continue using the existing `tasks` object store for date-based reminders to avoid discarding current task records. New reminders use a title, due date, completion state, and timestamps; the old optional duration field is retained only for reading legacy data and is no longer used for activity totals. The home view shows due-today and overdue incomplete reminders. No OS notification is scheduled.

Separate reminder planning from actual activity sessions: a reminder expresses intent; an activity interval records what happened. Automatic linking by title was rejected because it would silently conflate similarly named records.

### Upgrade IndexedDB in place and version the backup format

Increase the database version and add an activity interval object store and indexes needed for date/time queries. Keep the current sleep and task stores so their records survive the upgrade. Represent an active sleep record with a nullable end timestamp. Meal records and embedded compressed photos remain unchanged.

Export a new versioned backup containing sleep, reminders/tasks, activity intervals, meals, and photos. Import version 1 backups by restoring their existing sleep, task, and meal data and initializing activity intervals as empty. Validate all input before opening the replacement transaction so invalid files cannot partially overwrite local data. The existing confirmation remains in front of replacement.

### Make the calendar a date selector and record overview

Render a local-time monthly grid. Selecting a day updates the shared selected date and all feature views. Small category markers summarize sleep, activity, meal, and reminder presence; selecting a date is never dependent on tapping a marker. Month navigation and a return-to-today control remain available.

### Keep dependencies and runtime behavior small

Use the existing React, TypeScript, `idb`, and icon dependencies. Do not add a server, push service, or new runtime dependency. Keep the PWA service worker responsible for app-shell caching only; it does not run timers or deliver scheduled reminders.

## Risks / Trade-offs

- [The OS can suspend the page, so the display will not visibly tick while hidden] → Persist the start timestamp and recompute as soon as the app resumes; the recorded elapsed time does not depend on the display loop.
- [A user may forget to stop an activity] → Keep active state obvious, allow correction of historical intervals, and close an active interval when another starts.
- [Legacy tasks contain manually entered durations] → Preserve stored records and their fields during migration/export, but stop counting those durations as completed activity time.
- [A schema upgrade or import can affect local-only data] → Use an additive IndexedDB upgrade, validate imports before clearing stores, and preserve version 1 import support.
- [Calendar markers can become visually noisy] → Use compact category dots with a legend and retain a clear selected-day state.

## Migration Plan

1. Upgrade IndexedDB additively, keeping current object stores and records.
2. Deploy the new app shell and feature views; active intervals are restored from their stored timestamps on launch.
3. Export new backups in the current format while continuing to accept version 1 backups.
4. If the deployment needs rollback, the previous app can continue reading the original sleep, task, and meal stores; the new activity store is additive and can remain unused.

## Open Questions

None. A standalone prose journal was explicitly left for a future change.
