# AWS-Flavored Incident Intelligence Upgrade Plan

## TL;DR

> **Quick Summary**: Upgrade Incident Intelligence Fast-Path to produce explicit AWS-flavored incident diagnosis proof (service impact, cloud dependency reasoning, blast radius), then mirror that proof in portfolio landing/demo pages.
>
> **Deliverables**:
> - AWS incident context + cloud dependency artifacts in repo docs
> - Intelligence-core outputs and support-console UI showing AWS impact rationale
> - README sections with explicit cloud-service diagnosis wording
> - Landing/demo page updates + required screenshot proof wiring
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves + final verification wave
> **Critical Path**: T1 → T4 → T5 → T8 → T13 → F1-F4

---

## Context

### Original Request
Create a planning-phase upgrade plan for `/Users/martin/Desktop/Projects/SUP_incident-intelligence-fastpath` following `08-incident-intelligence-console.md`, including repo upgrades plus portfolio landing/demo updates at:
- `/Users/martin/Desktop/Projects/PortfolioProject/projects/incident-intelligence/index.html`
- `/Users/martin/Desktop/Projects/PortfolioProject/projects/incident-intelligence/demo/index.html`

### Interview Summary
**Key Discussions**:
- Instruction source was resolved at `PortfolioProject/docs/plans/08-incident-intelligence-console.md` (user-provided draft location did not exist).
- Scope is incident-intelligence-first AWS-flavored diagnosis proof (not generic cloud dashboarding).
- Portfolio and demo updates are in-scope and mandatory.

**Research Findings**:
- Existing incident pipeline and console exist but lack explicit AWS/cloud dependency proof fields and UI sections.
- `docs/incident-schema.md` and `README.md` need explicit cloud-diagnosis language.
- Existing tests are custom Node assert runners (`npm test`, `npm run test:integration`), no CI/coverage configuration.

### Metis Review
**Identified Gaps (addressed in this plan)**:
- Need explicit acceptance criteria for AWS context shape, blast-radius rationale, and screenshot evidence.
- Need guardrails to prevent scope creep into Slack/Grafana/Kubernetes, AWS SDK integration, and generic dashboard expansion.
- Need backward-compatibility checks for incidents without AWS context.

---

## Work Objectives

### Core Objective
Add explicit AWS-flavored incident diagnosis and cloud-service impact analysis proof to this repo’s artifact pipeline and support-console UX, then reflect that proof in the portfolio landing/demo surfaces.

### Concrete Deliverables
- AWS context contract and incident-ops docs artifacts:
  - `docs/incident-ops/aws-incident-context.json`
  - `docs/incident-ops/cloud-service-topology.md`
  - `docs/incident-ops/probable-origin-analysis.md`
- Updated incident intelligence outputs and schemas:
  - `intelligence-core/promotion/engine.js`
  - `intelligence-core/evidence/snapshot.js`
  - `intelligence-core/summaries/summary.js`
  - `docs/incident-schema.md`
- Updated support-console detail/evidence/probable-origin presentation:
  - `support-console/ui/index.html`
- Updated tests and docs:
  - `tests/run-tests.js`
  - `tests/integration.js`
  - `README.md`
- Updated portfolio project pages:
  - `PortfolioProject/projects/incident-intelligence/index.html`
  - `PortfolioProject/projects/incident-intelligence/demo/index.html`
  - Screenshot assets for required proof views

### Definition of Done
- [ ] Incident artifacts visibly connect noisy telemetry → probable origin → AWS-flavored cloud-service diagnosis.
- [ ] Console detail view shows AWS impacted services, cloud dependency notes, and blast-radius rationale.
- [ ] Required docs and README sections exist with explicit wording from instruction doc.
- [ ] Landing/demo pages explicitly communicate incident correlation + AWS cloud diagnosis + dependency analysis.
- [ ] Required screenshot proof assets are present and referenced.

### Must Have
- Explicit impacted AWS-service context (e.g., ALB/ECS-Lambda/RDS/SQS/Route53 family examples).
- Severity + probable origin expressed in cloud-service terms.
- Runbook linkage + incident ID retained in AWS context flow.
- One topology/routing artifact + one dependency/probable-origin artifact.

### Must NOT Have (Guardrails)
- No Slack/Grafana/Kubernetes expansion in this repo.
- No generic cloud dashboard transformation.
- No new data tooling or QA tooling frameworks.
- No AWS SDK/runtime integration additions for this phase (proof stays scenario/artifact based).

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - All verification below is agent-executed.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: Custom Node assert runners via npm scripts
- **Commands**: `npm test` and `npm run test:integration`

### QA Policy
Every task includes executable QA scenarios with evidence file outputs under `.sisyphus/evidence/`.

- **Frontend/UI**: Playwright
- **API/Backend/Artifacts**: Bash + curl + jq
- **Doc/Schema checks**: Bash + grep + jq

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start immediately - contracts/docs/foundation):
- T1 Schema contract extension (`docs/incident-schema.md`) [quick]
- T2 AWS context artifact seed (`docs/incident-ops/aws-incident-context.json`) [quick]
- T3 Cloud topology and origin rationale docs (`docs/incident-ops/*.md`) [writing]
- T4 Promotion engine AWS mapping and rationale [unspecified-high]
- T5 Evidence snapshot AWS context + dependency notes [unspecified-high]

Wave 2 (After Wave 1 - rendering + tests + README):
- T6 Summary generator AWS narrative sections (depends: T1,T4,T5) [quick]
- T7 Support console AWS impact panels (depends: T1,T5,T6) [visual-engineering]
- T8 Unit tests for AWS context rules (depends: T1,T4,T5,T6) [quick]
- T9 Integration tests for AWS diagnosis flow + compatibility (depends: T4,T5,T6) [unspecified-high]
- T10 README explicit AWS/cloud diagnosis sections (depends: T1,T3,T6) [writing]

Wave 3 (After Wave 2 - portfolio/demo and proof packaging):
- T11 Capture required screenshots (depends: T7) [unspecified-high]
- T12 Landing page messaging/proof updates (depends: T10,T11) [visual-engineering]
- T13 Demo page AWS-flavored evidence/dependency messaging updates (depends: T7,T11) [visual-engineering]

Wave FINAL (After all tasks):
- F1 Plan compliance audit (oracle)
- F2 Code quality review (unspecified-high)
- F3 Real manual QA execution (unspecified-high)
- F4 Scope fidelity check (deep)

Critical Path: T1 → T4 → T5 → T6 → T7 → T11 → T13 → F1-F4
Parallel Speedup: ~55-65% vs fully sequential execution
Max Concurrent: 5

### Dependency Matrix
- T1: Blocked By none -> Blocks T6,T7,T8,T10
- T2: Blocked By none -> Blocks T5,T8,T9
- T3: Blocked By none -> Blocks T10,T12
- T4: Blocked By T1,T2 -> Blocks T6,T8,T9
- T5: Blocked By T1,T2 -> Blocks T6,T7,T8,T9
- T6: Blocked By T1,T4,T5 -> Blocks T7,T8,T9,T10
- T7: Blocked By T1,T5,T6 -> Blocks T11,T13
- T8: Blocked By T1,T4,T5,T6 -> Blocks FINAL evidence confidence
- T9: Blocked By T4,T5,T6 -> Blocks FINAL evidence confidence
- T10: Blocked By T1,T3,T6 -> Blocks T12
- T11: Blocked By T7 -> Blocks T12,T13
- T12: Blocked By T10,T11 -> Blocks FINAL
- T13: Blocked By T7,T11 -> Blocks FINAL

### Agent Dispatch Summary
- Wave 1: T1 quick, T2 quick, T3 writing, T4 unspecified-high, T5 unspecified-high
- Wave 2: T6 quick, T7 visual-engineering, T8 quick, T9 unspecified-high, T10 writing
- Wave 3: T11 unspecified-high, T12 visual-engineering, T13 visual-engineering
- FINAL: F1 oracle, F2 unspecified-high, F3 unspecified-high (+playwright), F4 deep

---

## TODOs

- [x] 1. Extend incident schema with AWS context contract

  **What to do**:
  - Update `docs/incident-schema.md` with new `aws_context` shape for incident + evidence artifacts.
  - Define required fields: `account_id`, `region`, `impacted_services[]`, `event_type_code`, `blast_radius`, `dependency_notes`, `routing_artifact_ref`.
  - Document backward compatibility behavior when AWS context is absent.

  **Must NOT do**:
  - Do not replace existing schema sections.
  - Do not introduce non-incident domain fields.

  **Recommended Agent Profile**:
  - **Category**: `quick` (single-doc contract extension)
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `playwright` (not a browser task)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T4, T5, T6, T7, T8, T10
  - **Blocked By**: None

  **References**:
  - `docs/incident-schema.md` - Existing canonical schema format and table style.
  - `intelligence-core/promotion/engine.js` - Current incident object fields to extend safely.
  - `intelligence-core/evidence/snapshot.js` - Existing evidence bundle shape.
  - `PortfolioProject/docs/plans/08-incident-intelligence-console.md` - Required AWS/cloud proof scope.

  **Acceptance Criteria**:
  - [ ] `docs/incident-schema.md` contains an explicit `aws_context` section for incident and evidence.
  - [ ] Existing Event/Incident/Timeline definitions remain intact.
  - [ ] Schema text includes backward compatibility guidance.

  **QA Scenarios**:
  ```
  Scenario: AWS context schema appears in docs
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "aws_context" docs/incident-schema.md
      2. Run: grep -n "impacted_services" docs/incident-schema.md
    Expected Result: Both matches exist with non-empty line numbers
    Evidence: .sisyphus/evidence/task-1-schema-grep.txt

  Scenario: Existing schema sections preserved
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "## Event Schema" docs/incident-schema.md
      2. Run: grep -n "## Incident Schema" docs/incident-schema.md
      3. Run: grep -n "## Evidence Bundle Schema" docs/incident-schema.md
    Expected Result: All section headers still present
    Evidence: .sisyphus/evidence/task-1-schema-backcompat.txt
  ```

  **Commit**: NO

- [x] 2. Add machine-readable AWS incident context artifact

  **What to do**:
  - Create `docs/incident-ops/aws-incident-context.json` with sample AWS-flavored incident context payload.
  - Include representative services (Lambda, RDS, SQS), severity, probable origin rationale, runbook linkage, incident ID.
  - Include one routing/topology reference field.

  **Must NOT do**:
  - Do not add real AWS credentials/endpoints.
  - Do not add SDK-specific config.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `writing` (JSON contract is structured, not prose-heavy)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T4, T5, T8, T9
  - **Blocked By**: None

  **References**:
  - `docs/incident-schema.md` - Field naming consistency.
  - `artifacts/incidents/<id>/incident.json` pattern from `intelligence-core/engine.js` - Artifact placement conventions.
  - `PortfolioProject/docs/plans/08-incident-intelligence-console.md` lines 32-44 - Mandatory AWS proof content.

  **Acceptance Criteria**:
  - [ ] JSON parses successfully with `jq .`.
  - [ ] Contains incident ID, runbook ref, probable origin cloud rationale, impacted services, blast radius/dependency notes.

  **QA Scenarios**:
  ```
  Scenario: JSON artifact validity
    Tool: Bash (jq)
    Steps:
      1. Run: jq '.' docs/incident-ops/aws-incident-context.json
    Expected Result: Valid JSON output with no parse errors
    Evidence: .sisyphus/evidence/task-2-json-valid.txt

  Scenario: Required AWS keys exist
    Tool: Bash (jq)
    Steps:
      1. Run: jq '.incident_id,.probable_origin,.impacted_services,.runbook_ref,.blast_radius' docs/incident-ops/aws-incident-context.json
    Expected Result: No null for required keys
    Evidence: .sisyphus/evidence/task-2-json-keys.txt
  ```

  **Commit**: NO

- [x] 3. Author cloud topology and probable-origin analysis docs

  **What to do**:
  - Create `docs/incident-ops/cloud-service-topology.md` including one cloud topology/incident-routing artifact.
  - Create `docs/incident-ops/probable-origin-analysis.md` describing dependency notes, blast radius explanation, and remediation path.
  - Keep operator-facing style aligned with existing runbook/readme tone.

  **Must NOT do**:
  - Do not include Slack/Grafana/Kubernetes workflows.
  - Do not turn content into generic architecture handbook.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `visual-engineering` (no UI implementation)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T10, T12
  - **Blocked By**: None

  **References**:
  - `README.md` - Existing narrative and positioning language.
  - `runbooks/general-triage.md` - Ops-focused structure for remediation guidance.
  - `PortfolioProject/docs/plans/08-incident-intelligence-console.md` lines 39-44,55-62 - Mandatory artifact requirements.

  **Acceptance Criteria**:
  - [ ] Topology doc includes explicit service dependency path and incident routing narrative.
  - [ ] Probable-origin doc includes blast radius and remediation path sections.

  **QA Scenarios**:
  ```
  Scenario: Topology document contains required cloud-service terms
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "ALB\|Lambda\|RDS\|SQS\|Route53\|ECS\|EKS" docs/incident-ops/cloud-service-topology.md
    Expected Result: At least one required service term appears
    Evidence: .sisyphus/evidence/task-3-topology-terms.txt

  Scenario: Probable-origin doc includes blast radius + remediation path
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "blast radius" docs/incident-ops/probable-origin-analysis.md
      2. Run: grep -n "remediation" docs/incident-ops/probable-origin-analysis.md
    Expected Result: Both sections present
    Evidence: .sisyphus/evidence/task-3-origin-sections.txt
  ```

  **Commit**: NO

- [x] 4. Extend promotion engine with AWS-flavored origin/service mapping

  **What to do**:
  - Update `intelligence-core/promotion/engine.js` to attach AWS-flavored mapping metadata for probable origin and impacted services.
  - Add cloud-service rationale text generation aligned with schema (`aws_context`/equivalent).
  - Preserve current severity and runbook decision flow while enriching output.

  **Must NOT do**:
  - Do not break non-AWS incidents.
  - Do not add AWS SDK calls.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `quick` (logic impacts incident generation)

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T5)
  - **Parallel Group**: Wave 1
  - **Blocks**: T6, T8, T9
  - **Blocked By**: T1, T2

  **References**:
  - `intelligence-core/promotion/engine.js` - Existing promotion and probable-origin logic.
  - `intelligence-core/correlation/bucket.js` - Event grouping semantics that feed promotion.
  - `docs/incident-schema.md` - New AWS field contract.
  - `runbooks/*.md` - Runbook mapping patterns.

  **Acceptance Criteria**:
  - [ ] Promoted incident object includes AWS-flavored origin/service impact fields per schema.
  - [ ] Existing scenarios (`poison-pill`, `queue-backlog`, `db-exhaustion`) still promote incidents.

  **QA Scenarios**:
  ```
  Scenario: Promotion produces AWS context for cloud-pattern incident
    Tool: Bash (node + jq)
    Steps:
      1. Run: npm run reset && npm run scenario:db-exhaustion
      2. Run: sleep 2 && ls artifacts/incidents
      3. Run: cat artifacts/incidents/$(ls artifacts/incidents | head -n 1)/incident.json | jq '.probable_origin, .aws_context'
    Expected Result: probable_origin present and aws_context object present for mapped incident
    Evidence: .sisyphus/evidence/task-4-promotion-aws.txt

  Scenario: Non-AWS compatibility remains valid
    Tool: Bash (jq)
    Steps:
      1. Run: npm run reset && npm run scenario:poison-pill
      2. Run: sleep 2 && cat artifacts/incidents/$(ls artifacts/incidents | head -n 1)/incident.json | jq '.id,.severity,.probable_origin'
    Expected Result: Incident still generated with required legacy fields
    Evidence: .sisyphus/evidence/task-4-promotion-compat.txt
  ```

  **Commit**: NO

- [x] 5. Extend evidence snapshot with cloud dependency and blast-radius context

  **What to do**:
  - Update `intelligence-core/evidence/snapshot.js` to include cloud dependency notes, impacted AWS services, event type code, blast radius, and routing artifact ref.
  - Preserve immutable snapshot + checksum behavior.

  **Must NOT do**:
  - Do not alter checksum semantics.
  - Do not remove existing evidence fields.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `writing` (implementation logic task)

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T4)
  - **Parallel Group**: Wave 1
  - **Blocks**: T6, T7, T8, T9
  - **Blocked By**: T1, T2

  **References**:
  - `intelligence-core/evidence/snapshot.js` - Current evidence fields and checksum flow.
  - `runtime/store.js` - Available runtime context sources.
  - `docs/incident-schema.md` - Evidence AWS context contract.

  **Acceptance Criteria**:
  - [ ] Evidence bundle includes new cloud dependency/AWS context fields.
  - [ ] Existing fields (`queue_depth`, `db_status`, `recent_logs`, `checksum`) still exist.

  **QA Scenarios**:
  ```
  Scenario: Evidence bundle contains AWS context keys
    Tool: Bash (jq)
    Steps:
      1. Run: npm run reset && npm run scenario:db-exhaustion
      2. Run: sleep 2 && cat artifacts/incidents/$(ls artifacts/incidents | head -n 1)/evidence-bundle.json | jq '.aws_context,.dependency_notes,.blast_radius'
    Expected Result: Keys exist and are non-null for mapped cloud incident
    Evidence: .sisyphus/evidence/task-5-evidence-aws.txt

  Scenario: Checksum still generated
    Tool: Bash (jq)
    Steps:
      1. Run: cat artifacts/incidents/$(ls artifacts/incidents | head -n 1)/evidence-bundle.json | jq -r '.checksum'
    Expected Result: Value starts with "sha256:"
    Evidence: .sisyphus/evidence/task-5-evidence-checksum.txt
  ```

  **Commit**: NO

- [x] 6. Add AWS cloud-service diagnosis narrative to generated summaries

  **What to do**:
  - Update `intelligence-core/summaries/summary.js` with sections:
    - AWS-flavored incident context
    - Cloud dependency analysis during escalation
    - Blast radius and likely remediation path
  - Keep existing summary sections intact.

  **Must NOT do**:
  - Do not remove `What Happened`, `Evidence Captured`, `Recommended Next Actions`.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `deep` (single file deterministic formatting)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T7, T8, T9, T10
  - **Blocked By**: T1, T4, T5

  **References**:
  - `intelligence-core/summaries/summary.js` - Existing markdown generation pattern.
  - `README.md` required wording sections - keep terminology consistent.
  - `PortfolioProject/docs/plans/08-incident-intelligence-console.md` lines 71-77 - explicit phrasing to mirror.

  **Acceptance Criteria**:
  - [ ] Summary output contains AWS context and dependency analysis sections.
  - [ ] Existing required sections remain present.

  **QA Scenarios**:
  ```
  Scenario: Summary includes new AWS sections
    Tool: Bash (grep)
    Steps:
      1. Run: npm run reset && npm run scenario:db-exhaustion
      2. Run: sleep 2 && grep -n "AWS-flavored incident context\|Cloud dependency analysis\|blast radius" artifacts/incidents/$(ls artifacts/incidents | head -n 1)/summary.md
    Expected Result: All phrases present in summary.md
    Evidence: .sisyphus/evidence/task-6-summary-aws.txt

  Scenario: Legacy summary sections still present
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "What Happened\|Evidence Captured\|Recommended Next Actions" artifacts/incidents/$(ls artifacts/incidents | head -n 1)/summary.md
    Expected Result: All legacy sections present
    Evidence: .sisyphus/evidence/task-6-summary-legacy.txt
  ```

  **Commit**: NO

- [x] 7. Add AWS impact analysis sections to support-console detail and evidence panes

  **What to do**:
  - Update `support-console/ui/index.html` to render:
    - impacted AWS services with severity/state context
    - cloud dependency notes in evidence area
    - probable-origin cloud rationale + blast radius summary
  - Keep section ordering coherent with existing detail layout.

  **Must NOT do**:
  - Do not redesign the app into a generic cloud dashboard.
  - Do not remove existing incident/timeline/evidence/runbook panels.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `writing` (UI logic + layout task)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T11, T13
  - **Blocked By**: T1, T5, T6

  **References**:
  - `support-console/ui/index.html` - Current detail/evidence rendering and style tokens.
  - `support-console/server.js` - Artifact endpoints consumed by UI.
  - `docs/incident-schema.md` + `docs/incident-ops/aws-incident-context.json` - expected data keys and terminology.

  **Acceptance Criteria**:
  - [ ] Detail pane includes an AWS impact section.
  - [ ] Evidence pane includes dependency rationale text.
  - [ ] Probable-origin area includes blast-radius explanation.

  **QA Scenarios**:
  ```
  Scenario: AWS impact panel renders for cloud-mapped incident
    Tool: Playwright
    Steps:
      1. Start app and open http://localhost:3003
      2. Trigger db-exhaustion scenario via UI control
      3. Click newest incident card
      4. Assert selectors contain expected content:
         - [data-testid="aws-impact-panel"] exists
         - text includes "AWS" and one service (Lambda/RDS/SQS/ALB/ECS/EKS/Route53)
    Expected Result: Panel visible with cloud-service context text
    Evidence: .sisyphus/evidence/task-7-ui-aws-impact.png

  Scenario: Non-cloud incident does not crash detail rendering
    Tool: Playwright
    Steps:
      1. Trigger poison-pill scenario
      2. Open resulting incident detail
      3. Assert incident detail root remains rendered and no JS error overlay appears
    Expected Result: Graceful fallback (AWS section hidden or defaulted)
    Evidence: .sisyphus/evidence/task-7-ui-fallback.png
  ```

  **Commit**: NO

- [x] 8. Add unit tests for AWS context mapping and evidence fields

  **What to do**:
  - Extend `tests/run-tests.js` with unit checks for AWS context field creation and compatibility behavior.
  - Validate probable-origin rationale includes cloud-service terms when applicable.

  **Must NOT do**:
  - Do not introduce new test framework packages.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `unspecified-high` (single-file test extension)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL confidence
  - **Blocked By**: T1, T4, T5, T6

  **References**:
  - `tests/run-tests.js` - Existing custom unit-test harness patterns.
  - `intelligence-core/promotion/engine.js`, `intelligence-core/evidence/snapshot.js` - updated logic under test.

  **Acceptance Criteria**:
  - [ ] New AWS-focused tests added and passing within `npm test`.
  - [ ] Existing tests remain passing.

  **QA Scenarios**:
  ```
  Scenario: Unit tests pass with AWS assertions
    Tool: Bash
    Steps:
      1. Run: npm test
      2. Capture output and confirm zero failures
    Expected Result: Test run exits 0 with AWS-related checks passing
    Evidence: .sisyphus/evidence/task-8-unit-tests.txt

  Scenario: Regression guard for non-AWS behavior
    Tool: Bash
    Steps:
      1. Inspect test output for legacy suites (Correlation Engine, Promotion Engine, Runtime Store)
    Expected Result: Legacy suites still pass
    Evidence: .sisyphus/evidence/task-8-regression.txt
  ```

  **Commit**: NO

- [x] 9. Add integration tests proving telemetry→origin→AWS diagnosis chain

  **What to do**:
  - Extend `tests/integration.js` with scenario assertions verifying AWS-context propagation from promoted incident to evidence and summary outputs.
  - Add edge-case assertions for incidents without AWS context (compatibility).

  **Must NOT do**:
  - Do not add external test runners.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `quick` (multi-scenario flow assertions)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL confidence
  - **Blocked By**: T4, T5, T6

  **References**:
  - `tests/integration.js` - Existing end-to-end scenario test flow.
  - `artifacts/incidents/<id>/incident.json`, `evidence-bundle.json`, `summary.md` - required proof chain outputs.

  **Acceptance Criteria**:
  - [ ] Integration test includes assertions for AWS context fields and blast radius/dependency rationale.
  - [ ] Non-AWS scenario still passes compatibility assertions.

  **QA Scenarios**:
  ```
  Scenario: Integration suite validates AWS diagnosis chain
    Tool: Bash
    Steps:
      1. Run: npm run test:integration
      2. Confirm output includes new AWS-context assertions
    Expected Result: Exit code 0; AWS chain assertions pass
    Evidence: .sisyphus/evidence/task-9-integration.txt

  Scenario: Compatibility branch validated in integration tests
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "backward\|compat" tests/integration.js
    Expected Result: Explicit compatibility checks exist
    Evidence: .sisyphus/evidence/task-9-compat-grep.txt
  ```

  **Commit**: NO

- [x] 10. Upgrade README with mandatory AWS/cloud diagnosis sections

  **What to do**:
  - Update `README.md` with sections:
    - AWS-flavored incident context
    - How telemetry becomes a cloud-service incident hypothesis
    - Cloud dependency analysis during support escalation
  - Connect wording to concrete repo artifacts and UI proof.

  **Must NOT do**:
  - Do not market this as generic cloud observability dashboard.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `visual-engineering` (documentation task)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T12
  - **Blocked By**: T1, T3, T6

  **References**:
  - `README.md` existing structure and tone.
  - `docs/incident-ops/*` for canonical AWS wording.
  - `PortfolioProject/docs/plans/08-incident-intelligence-console.md` lines 71-77 (required headings).

  **Acceptance Criteria**:
  - [ ] All three mandatory section headings are present.
  - [ ] Each section references specific artifacts/UI proof.

  **QA Scenarios**:
  ```
  Scenario: Required README headings exist
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "AWS-flavored incident context" README.md
      2. Run: grep -n "How telemetry becomes a cloud-service incident hypothesis" README.md
      3. Run: grep -n "Cloud dependency analysis during support escalation" README.md
    Expected Result: Three matches returned
    Evidence: .sisyphus/evidence/task-10-readme-headings.txt

  Scenario: README links to concrete proof assets
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "docs/incident-ops\|support-console\|artifacts/incidents" README.md
    Expected Result: README includes explicit artifact/UI references
    Evidence: .sisyphus/evidence/task-10-readme-proof-links.txt
  ```

  **Commit**: NO

- [x] 11. Capture required screenshot proof set

  **What to do**:
  - Capture exactly three screenshots from working support-console flow:
    1) incident queue
    2) detail pane with AWS-flavored service impact
    3) evidence pane with cloud dependency rationale
  - Save under portfolio project path (e.g., `PortfolioProject/projects/incident-intelligence/demo/assets/`).
  - Use stable names referenced by landing/demo pages.

  **Must NOT do**:
  - Do not capture placeholders unrelated to live UI state.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `writing` (execution verification task)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3
  - **Blocks**: T12, T13
  - **Blocked By**: T7

  **References**:
  - `support-console/ui/index.html` selectors and rendered regions.
  - `PortfolioProject/projects/incident-intelligence/index.html` and `demo/index.html` for image embedding points.
  - Instruction doc lines 91-95 for exact screenshot list.

  **Acceptance Criteria**:
  - [ ] Three screenshots exist with deterministic names and correct content.
  - [ ] Evidence files are stored and reusable by both landing/demo pages.

  **QA Scenarios**:
  ```
  Scenario: Screenshot files exist and are non-empty
    Tool: Bash
    Steps:
      1. Run: ls -l /Users/martin/Desktop/Projects/PortfolioProject/projects/incident-intelligence/demo/assets | grep "incident-queue\|aws-impact-detail\|cloud-dependency-evidence"
    Expected Result: 3 files listed with size > 0
    Evidence: .sisyphus/evidence/task-11-screenshot-files.txt

  Scenario: Screenshot content corresponds to required views
    Tool: Playwright
    Steps:
      1. Open each image file locally in browser tab
      2. Assert visible text includes target markers ("Incident Queue", AWS service labels, "Evidence")
    Expected Result: Each screenshot matches required semantic content
    Evidence: .sisyphus/evidence/task-11-screenshot-content.png
  ```

  **Commit**: NO

- [x] 12. Update landing page with explicit AWS diagnosis and dependency-proof messaging

  **What to do**:
  - Update `/Users/martin/Desktop/Projects/PortfolioProject/projects/incident-intelligence/index.html` copy to explicitly mention:
    - incident correlation
    - AWS-flavored cloud incident analysis
    - cloud-service dependency diagnosis
  - Add references/previews for required screenshots.

  **Must NOT do**:
  - Do not remove portfolio navigation/CTA structure.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `quick` (layout + messaging + asset wiring)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: FINAL
  - **Blocked By**: T10, T11

  **References**:
  - `PortfolioProject/projects/incident-intelligence/index.html` existing hero/feature sections.
  - `README.md` new AWS wording for consistency.
  - Screenshot artifacts produced in T11.

  **Acceptance Criteria**:
  - [ ] Landing page includes all three mandatory mention categories.
  - [ ] Landing page references at least one required screenshot proof asset.

  **QA Scenarios**:
  ```
  Scenario: Landing page contains mandatory wording
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "incident correlation\|AWS-flavored\|cloud-service dependency" /Users/martin/Desktop/Projects/PortfolioProject/projects/incident-intelligence/index.html
    Expected Result: All phrase classes found
    Evidence: .sisyphus/evidence/task-12-landing-copy.txt

  Scenario: Landing page image references resolve
    Tool: Playwright
    Steps:
      1. Open landing page in browser
      2. Assert screenshot image elements render (naturalWidth > 0)
    Expected Result: No broken image placeholders
    Evidence: .sisyphus/evidence/task-12-landing-images.png
  ```

  **Commit**: NO

- [x] 13. Update demo page with AWS-flavored incident analysis proof and dependency diagnosis

  **What to do**:
  - Update `/Users/martin/Desktop/Projects/PortfolioProject/projects/incident-intelligence/demo/index.html` to include explicit cloud-service impact framing and dependency diagnosis language.
  - Ensure demo narrative aligns with repo’s AWS incident context and screenshot set.

  **Must NOT do**:
  - Do not remove core interactive incident selection behavior.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: `writing` (interactive page update task)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: FINAL
  - **Blocked By**: T7, T11

  **References**:
  - `PortfolioProject/projects/incident-intelligence/demo/index.html` mock data and detail rendering sections.
  - `support-console/ui/index.html` AWS impact section semantics.
  - `docs/incident-ops/probable-origin-analysis.md` for rationale wording.

  **Acceptance Criteria**:
  - [ ] Demo page explicitly mentions AWS-flavored incident analysis and cloud dependency diagnosis.
  - [ ] Demo detail experience includes visible impact/rationale proof path.

  **QA Scenarios**:
  ```
  Scenario: Demo page contains mandatory AWS diagnosis messaging
    Tool: Bash (grep)
    Steps:
      1. Run: grep -n "AWS\|cloud incident\|dependency" /Users/martin/Desktop/Projects/PortfolioProject/projects/incident-intelligence/demo/index.html
    Expected Result: Required messaging terms present
    Evidence: .sisyphus/evidence/task-13-demo-copy.txt

  Scenario: Demo interaction still works after updates
    Tool: Playwright
    Steps:
      1. Open demo page
      2. Click incident card `.incident-card`
      3. Assert `#incidentDetails` updates with selected incident title and evidence section
    Expected Result: Interactive selection and detail rendering remain functional
    Evidence: .sisyphus/evidence/task-13-demo-interaction.png
  ```

  **Commit**: NO

---

## Final Verification Wave (MANDATORY)

- [x] F1. **Plan Compliance Audit** — `oracle`
  Verify every Must Have / Must NOT Have against repo and portfolio outputs; confirm required artifacts/screenshots exist.

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm test`, `npm run test:integration`, and static review for regression risks or scope drift.

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright`)
  Execute all listed QA scenarios and collect final evidence under `.sisyphus/evidence/final-qa/`.

- [x] F4. **Scope Fidelity Check** — `deep`
  Verify all changed files align 1:1 to this plan and no out-of-scope expansions were introduced.

---

## Commit Strategy

- Wave 1 docs/contracts: `docs(incident): add aws context and topology artifacts`
- Wave 2 core+ui+tests: `feat(incident): add aws-flavored diagnosis context and console impact panels`
- Wave 3 portfolio: `feat(portfolio): add aws incident diagnosis proof to landing and demo`

---

## Success Criteria

### Verification Commands
```bash
npm test
npm run test:integration
curl -s http://localhost:3003/api/incidents | jq '.[0] | {id,severity,probable_origin,aws_context}'
curl -s http://localhost:3003/api/incidents/<INCIDENT_ID>/evidence-bundle.json | jq '.aws_context'
grep -n "AWS-flavored incident context" README.md
```

### Final Checklist
- [ ] All Must Have items present
- [ ] All Must NOT Have items absent
- [ ] AWS-flavored diagnosis proof visible in artifacts + UI + portfolio surfaces
- [ ] Required screenshots captured and linked
- [ ] Test commands pass
