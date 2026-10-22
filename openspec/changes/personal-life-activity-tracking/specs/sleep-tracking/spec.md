# Spec Delta

## Purpose

Make sleep logging quick enough for daily use by letting the user start recording before sleep and end it after waking, while preserving correction of historical records.

## ADDED Requirements

### Requirement: Start and stop sleep recording
The system SHALL let the user start a sleep interval and end it when they wake, storing both timestamps locally.

#### Scenario: Start sleep recording
- **WHEN** the user starts sleep recording
- **THEN** the system saves the start timestamp and shows sleep as active

#### Scenario: End sleep recording after midnight
- **WHEN** the user ends an active sleep interval on a later date
- **THEN** the system saves the end timestamp and calculates the elapsed duration across the date boundary

### Requirement: Keep sleep timing reliable across app suspension
The system SHALL retain the saved start timestamp and calculate the current elapsed duration when the app is reopened or resumed.

#### Scenario: Reopen the app while sleep recording is active
- **WHEN** the app was closed or suspended after sleep recording started
- **THEN** sleep remains active and displays the time elapsed since its stored start timestamp

### Requirement: Correct historical sleep intervals
The system SHALL allow the user to add, edit, or delete sleep intervals and SHALL reject an interval whose end is not after its start.

#### Scenario: Backfill or correct sleep times
- **WHEN** the user saves a historical sleep interval with an end after its start
- **THEN** the system stores the interval and displays its calculated duration

#### Scenario: Reject invalid sleep times
- **WHEN** the user saves an interval with an end at or before its start
- **THEN** the system does not save the interval and explains that the end must be later than the start
