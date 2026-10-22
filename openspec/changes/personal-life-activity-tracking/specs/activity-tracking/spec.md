# Spec Delta

## Purpose

Let the user record what they are doing as it happens, then review the day's activity timeline and time spent without maintaining a predefined activity catalog.

## ADDED Requirements

### Requirement: Start a free-form activity
The system SHALL let the user enter an activity name and start recording it immediately.

#### Scenario: Start an activity when none is active
- **WHEN** the user enters a non-empty activity name and starts it
- **THEN** the system records a new activity interval beginning at the current time and shows it as active

#### Scenario: Reject an empty activity name
- **WHEN** the user attempts to start an activity with a blank name
- **THEN** the system does not create an interval and asks the user to enter a name

### Requirement: Keep activity intervals non-overlapping
The system SHALL allow at most one activity or sleep interval to be active at a time.

#### Scenario: Switch directly to another activity
- **WHEN** an activity is active and the user starts a different activity
- **THEN** the system ends the active interval at the switch time and starts the new interval at that same time

#### Scenario: Start an activity while sleep is active
- **WHEN** sleep recording is active and the user starts an activity
- **THEN** the system ends the sleep interval at the activity start time and starts the activity

### Requirement: Stop an activity and accumulate repeated sessions
The system SHALL preserve each activity interval and show the combined duration of intervals with the same trimmed name on the same local date.

#### Scenario: Stop the active activity
- **WHEN** the user ends the active activity
- **THEN** the system records its end time and includes its elapsed duration in that day's total

#### Scenario: Repeat an activity later that day
- **WHEN** the user records another interval with the same activity name on the same local date
- **THEN** the day view shows both intervals and their combined duration for that name

### Requirement: Preserve active timer state across app suspension
The system SHALL preserve the active interval's start time locally and calculate elapsed time from timestamps when the app is reopened or resumed.

#### Scenario: Return to an active timer after leaving the app
- **WHEN** the app was backgrounded, closed, or suspended while an interval was active
- **THEN** the active interval remains active and its elapsed time reflects the time since its recorded start

### Requirement: Review and correct activity history
The system SHALL let the user review a selected day's activity intervals in time order and edit or delete an interval.

#### Scenario: Correct a forgotten or inaccurate interval
- **WHEN** the user edits an interval's name or start/end time
- **THEN** the timeline and per-name totals are recalculated from the updated interval

#### Scenario: Leave time unrecorded
- **WHEN** the user ends an interval without starting another one
- **THEN** the system leaves the remaining time unrecorded and does not create an implicit activity
