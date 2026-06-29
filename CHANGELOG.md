# Changelog
All notable changes to this project will be documented in this file.

## [1.4.5]
- Added an `npm run export:db` command to export all MongoDB collections as Extended JSON files.
- Added a MongoDB export script that requires `db_uri` and writes per-collection backups plus a manifest file.
- Changed the default backup output location from `database_backup/` to repo-ignored `backups/`.

## [1.4.4]
- Updated the timer next blinds label from `Next level:` to `Next:`.
- Increased the timer next blinds font size to `2rem`.

## [1.4.3]
- Added player profile photo support, including photo upload in admin player forms and photo display in profile, ranking, and tournament views.
- Added the tournament timer experience, including fullscreen controls, blinds structure popup, speech announcements, wake lock support, and timer state recovery improvements.
- Added admin timer management pages and API support for creating, editing, and deleting timers.
- Added league management improvements, including editing leagues and moving the default season setting to leagues.
- Added a payout calculator for pending tournaments.
- Improved authentication and validation, including stronger league, player, and season name validation and safer tournament saves against stale player data.
- Improved routing and state handling for leagues, seasons, rankings, and timer selection persistence.
- Refined the homepage, profile, tournament forms, ranking, login, and tournament table UI across the app.
- Added and updated supporting API, REST, migration, and Vercel configuration files for the new timer and league flows.

## [1.4.2] - 2025-10-02
- Fixed games from an older season being displayed when user has not selected a season.
- Fixed bug with profile page breaking of a season in which player has not played is selected
- Removed event name from header of pages
- Added changelog.md
