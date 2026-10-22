# Spec Delta

## Purpose

Let the user retain control of their local-first life records by exporting and restoring a complete portable backup, including newly added activity and reminder data.

## ADDED Requirements

### Requirement: Export all local records
The system SHALL export sleep intervals, activity sessions, dated reminders, meal descriptions, and meal photos in a versioned JSON backup.

#### Scenario: Export a complete backup
- **WHEN** the user requests an export
- **THEN** the downloaded JSON contains all supported record categories and embedded meal photos

### Requirement: Restore supported backup versions
The system SHALL validate an imported backup before replacing local data and SHALL support both the existing version 1 format and the new versioned format.

#### Scenario: Import an existing version 1 backup
- **WHEN** the user confirms importing a valid version 1 backup
- **THEN** the system restores the existing sleep, task, and meal records and initializes new record categories as empty

#### Scenario: Import a new version backup
- **WHEN** the user confirms importing a valid current-version backup
- **THEN** the system restores all record categories, including meal photos

#### Scenario: Reject an invalid or unsupported backup
- **WHEN** an imported file has an unsupported version or invalid record data
- **THEN** the system leaves existing local data unchanged and explains that the backup could not be restored

### Requirement: Confirm before replacing local data
The system SHALL ask for confirmation before an import replaces existing local records.

#### Scenario: Cancel an import
- **WHEN** the user declines the import confirmation
- **THEN** the system leaves all existing local data unchanged
