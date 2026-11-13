# Changelog

## [3.0.0] - 2026-11-13

### Breaking changes

- 💥 require Node.js 24 and develop on Node.js 26

### Security

- 🔒 add vite as dev dependency to fix security advisories

### Dependencies

- ⬆️ update pnpm to v12
- ⬆️ update @clack/prompts to v1
- ⬆️ update execa to v10
- ⬆️ update vitest to v5
- ⬆️ update oxfmt to 0.78
- ➖ remove unused yargs and typescript dependencies
- ⬆️ update dependencies

### CI

- 👷 stage npm releases for 2FA approval
- 👷 add tag-triggered npm release workflow and git-cliff changelog config
- 👷 test on Node.js 24 and 26 and update actions

### Chores

- 📦 publish only runtime files and complete package metadata

## [2.1.0] - 2026-08-04

### Features

- ✨ add commit message preview in force mode
- feat: added debug options
- ✨ add truncation indicator to executeCommand output
- ✨ add force mode configuration option
- ✨ Add error handling to command execution and bump version to 1.0.1
- ✨ Add git push functionality and improve user feedback
- ✨ Add README and improve workflow with early exit check

### Bug fixes

- 🐛 correct return logic in extractResult function

### Security

- 🔒 add shell escape utility to prevent command injection vulnerabilities

### Refactoring

- 🔨 use git branch --show-current instead of git rev-parse
- refactor: Add spinner and user input for commit message refinement
- refactor(cli): add cancellation handling and extract commit message prompt
- 🔨 remove redundant commit message log
- 🔨 improve code formatting and exit handling
- 🔨 restructure codebase and simplify architecture
- ♻️ Refactor code formatting and add git pull before push

### Tests

- 🧪 add comprehensive test suite with 100% coverage threshold
- 🧪 add comprehensive test coverage for core modules and utilities
- 🧪 add unit tests for add command and update test script
- 🧪 make it great
- 🧪 make it great
- 🧪 make it great
- ✅ Add API key validation check on startup

### Style

- 🎨 add newline at end of package.json
- 🎨 add newline at end of package.json file
- 🎨 format code with prettier and fix linting issues

### Chores

- 🔧 migrate from Yarn to pnpm and Jest to Vitest
- 🔧 bump version to 2.0.0 and improve test coverage
- 🔧 add coverage reporting and status badges
- 🔧 migrate CI workflow from npm to yarn
- 🔧 Update utility functions for better code structure
- 📦 Add project documentation and configure for npm publishing

### Other

- Based on the changes, I can see:
- 🛠️ split CI install step from combined command
- undefined
- 🛠️ add CI workflow and update npm scripts
- Based on the git changes, here's the commit message:
- :tada: There is no sin but ignorance.
- Refactor addFiles function to simplify git add output handling
- Refactor git workflow to automate staging and committing
- 🎉 Initial commit: LangGraph-powered Git commit message generator
