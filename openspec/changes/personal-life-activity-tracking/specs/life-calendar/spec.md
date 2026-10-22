# Spec Delta

## Purpose

Give the user a month-at-a-glance way to navigate their local life records and dated reminders instead of stepping through dates one day at a time.

## ADDED Requirements

### Requirement: Browse and select dates in a monthly calendar
The system SHALL display a calendar month and let the user move between months and select any date for review or backfilling.

#### Scenario: Select a date in the current month
- **WHEN** the user taps a day cell
- **THEN** the app selects that date and displays its records and reminders

#### Scenario: Move to another month
- **WHEN** the user moves to the previous or next month
- **THEN** the calendar displays the correct month and its dates

### Requirement: Show record indicators on calendar days
The system SHALL show small indicators for dates with activity, sleep, meal, or reminder data.

#### Scenario: Inspect dates with different records
- **WHEN** a month contains days with different categories of data
- **THEN** each applicable day displays small category indicators that do not prevent selecting the day

#### Scenario: Refresh indicators after a record changes
- **WHEN** the user adds, edits, or deletes a record or reminder
- **THEN** the affected calendar day's indicators update to match the stored data

### Requirement: Identify the selected date
The system SHALL visually distinguish the selected date and provide a clear way to return to today.

#### Scenario: Return to today
- **WHEN** the user activates the today control
- **THEN** the app selects today's date and displays today's view
