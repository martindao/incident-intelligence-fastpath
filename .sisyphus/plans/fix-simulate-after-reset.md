# Fix: Simulate Buttons Don't Work After Reset

## TL;DR

> **Quick Summary**: After "Reset Console", simulation buttons appear to work (health changes) but no incidents appear. The intelligence engine's internal state (`promotedIncidents`, `activeBuckets`, `lastProcessedEventCount`) is never reset, so it skips re-promoting incidents with the same bucket keys.
> 
> **Deliverables**: Working simulate→reset→simulate cycle
> **Estimated Effort**: Quick (2 lines changed in 1 file)
> **Parallel Execution**: NO — single task

---

## Context

### Root Cause (Verified via Playwright browser testing)

1. User clicks "Reset Console" → calls `POST /api/reset`
2. `server.js:resetConsole()` calls `store.resetRuntime()` and deletes `artifacts/incidents/`
3. **BUG**: `engine.js` internal state is NOT reset:
   - `promotedIncidents` array still contains old incidents
   - `activeBuckets` still has old correlation buckets  
   - `lastProcessedEventCount` is stale
4. User clicks "Poison Pill" → events are created, `processEvents()` runs
5. `engine.js:40` checks `if (promotedIncidents.find(inc => inc.promoted_from_event_bucket === bucketKey))` → finds old entry → **SKIPS promotion**
6. No incident artifacts are written → API returns empty array → UI shows 0 incidents

### Evidence
- Backend simulation endpoints return `{success: true}` ✓
- Health status changes after simulation ✓ (proves events are created)
- `GET /api/incidents` returns `[]` after simulate-reset-simulate ✗
- `resetEngine()` exists in `engine.js:93-97` but is never called from `server.js`

---

## Work Objectives

### Core Objective
Call `resetEngine()` when the console is reset so the intelligence engine clears its internal state.

### Must Have
- Import `resetEngine` from `../intelligence-core/engine` in `server.js`
- Call `resetEngine()` inside `server.js:resetConsole()` before clearing artifacts

### Must NOT Have
- No changes to `engine.js` — `resetEngine()` already exists and works correctly
- No changes to `index.html` — frontend is correct
- No changes to `store.js` — `resetRuntime()` already works correctly

---

## TODOs

- [x] 1. Fix reset to clear engine state

  **What to do**:
  - In `support-console/server.js` line 8: change `const { processEvents } = require('../intelligence-core/engine');` to `const { processEvents, resetEngine } = require('../intelligence-core/engine');`
  - In `support-console/server.js` inside `resetConsole()` function (line 121), add `resetEngine();` right after `store.resetRuntime();` (line 121)
  - That's it. Two line changes.

  **Must NOT do**:
  - Do not modify any other files
  - Do not change the frontend
  - Do not add error handling beyond what exists

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — single task
  - **Blocks**: Nothing
  - **Blocked By**: None

  **References**:
  - `support-console/server.js:8` — Current import line (add `resetEngine`)
  - `support-console/server.js:119-130` — `resetConsole()` function (add `resetEngine()` call after line 121)
  - `intelligence-core/engine.js:93-97` — `resetEngine()` function already exists, resets all 3 state variables

  **Acceptance Criteria**:
  - [ ] Server starts without errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Simulate works after reset
    Tool: Playwright
    Preconditions: Server running on localhost:3003
    Steps:
      1. Navigate to http://localhost:3003
      2. Click button "Poison Pill P1" 
      3. Wait 4 seconds for auto-poll
      4. Verify incident queue shows at least 1 incident card
      5. Click button "Reset Console", accept the confirm dialog
      6. Wait 2 seconds
      7. Verify incident queue shows "No incidents yet"
      8. Click button "Poison Pill P1" again
      9. Wait 4 seconds for auto-poll
      10. Verify incident queue shows at least 1 incident card again
    Expected Result: Incidents appear both before and after reset
    Evidence: .sisyphus/evidence/task-1-simulate-after-reset.png

  Scenario: All three simulation types work after reset
    Tool: Playwright
    Preconditions: Server running, just reset
    Steps:
      1. Click "Reset Console", accept dialog, wait 2s
      2. Click "Queue Backlog" button, wait 4s — verify incidents appear
      3. Click "Reset Console", accept dialog, wait 2s
      4. Click "DB Exhaustion" button, wait 4s — verify incidents appear
    Expected Result: Each simulation type creates incidents after a fresh reset
    Evidence: .sisyphus/evidence/task-1-all-simulations.png
  ```

  **Commit**: YES
  - Message: `fix(console): reset engine state when clearing incidents`
  - Files: `support-console/server.js`

---

## Final Verification Wave

- [x] F1. Verify the fix by running simulate → reset → simulate cycle in browser

---

## Success Criteria

### Verification Commands
```bash
# Start server, then in browser: Simulate → Reset → Simulate → incidents should appear
node support-console/server.js
```

### Final Checklist
- [ ] Simulate buttons create incidents on fresh start
- [ ] Reset clears all incidents
- [ ] Simulate buttons create incidents AGAIN after reset
- [ ] All 3 simulation types work after reset
