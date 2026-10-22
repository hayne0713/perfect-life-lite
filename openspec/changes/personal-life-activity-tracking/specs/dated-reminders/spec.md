# Spec Delta

## Purpose

Let the user keep future or past-dated commitments visible in the app, separately from the activity intervals that record what actually happened.

## ADDED Requirements

### Requirement: Create a dated reminder
The system SHALL let the user create a reminder with a title and a user-selected due date.

#### Scenario: Create a reminder for another day
- **WHEN** the user enters a title and selects a date
- **THEN** the system saves the reminder for that date without requiring a duration or activity timer

#### Scenario: Reject a blank reminder title
- **WHEN** the user saves a reminder with a blank title
- **THEN** the system does not save it and asks the user to enter a title

### Requirement: Review and complete reminders by date
The system SHALL show reminders for the selected date and allow the user to edit, complete, reopen, or delete each reminder.

#### Scenario: Review reminders due today
- **WHEN** the user opens the home view for today
- **THEN** the system shows incomplete reminders due today and any earlier incomplete reminders as overdue

#### Scenario: Review another date
- **WHEN** the user selects a date in the calendar
- **THEN** the system shows reminders due on that date

#### Scenario: Complete and reopen a reminder
- **WHEN** the user marks a reminder complete or reopens it
- **THEN** the system persists the updated state locally and reflects it in the selected date view

### Requirement: Keep reminders in-app only
The system SHALL present reminders when the user opens the app and SHALL NOT require or schedule background push notifications.

#### Scenario: App is not open at the due date
- **WHEN** a reminder becomes due while the app is closed
- **THEN** no background notification is sent, and the reminder appears in the app the next time it is opened
