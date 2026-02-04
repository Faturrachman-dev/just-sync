# Workflow & Tooling Rules

## 1. Build & Deployment Cycle
This project uses a custom deployment script to push changes directly to the Obsidian plugin folder.

- **Standard Build**: `npm run build` (Fast, <1s, no i18n)
- **Deploy Build**: `npm run build:deploy`
  - **Action**: Builds production mode AND copies files to `E:\FATUR\master\.obsidian\plugins\just-sync`.
  - **Rule**: ALWAYS use this when the user wants to "try" or "see" the changes in Obsidian.

## 2. Testing Strategy
Separation of concerns is strict in the testing suite.

- **Unit Tests**: `npm run test:unit`
  - **Location**: `src/**/*.unit.test.ts`
  - **Scope**: Logic, Parsers, Utilities. Fast execution.
- **Integration Tests**: `npm run test` (Vitest default)
  - **Location**: `test/` (Avoid unless modifying core replication engine).

## 3. Command Execution (Windows/PowerShell)
- Use standard PowerShell syntax.
- Chain commands with `;` not `&&` (mostly).
- **Tunneling**: When testing cloudflared, remember the command syntax: `cloudflared tunnel run <NAME>`.

## 4. Documentation Standards
- **Architecture**: `docs/architecture.md` (Source of Truth)
- **Handover**: `.agent/current_state.md` (Session State)
- **Changelog**: `updates.md` (User facing)
