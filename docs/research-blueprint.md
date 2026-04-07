# Incident Intelligence Fast-Path Console — Research Blueprint

## Verified Ingredients Used
- Event vs Incident separation (FIR-style model)
- Dwell-time correlation bucket (Cortex-style grouping)
- Timeline reconstruction (OneUptime/Rootly patterns)
- Immutable evidence snapshotting (Istio/pi_agent_rust patterns)
- Support-facing summary generation
- Service/component health modeling (Cachet/Statping patterns)
- Deterministic fault injection (ITBench-style scenarios)
- Runbook linkage

## Rejected Ingredients
- Generic dashboard templates (UI theater risk)
- Vendor-heavy incident product pages (no implementation value)
- SRE/platform-heavy systems (misaligned with app support)
- Hypothetical/unverified repos from initial research

## Original Design Decisions
- App-under-test: async queue + worker + DB topology (not microservice theater)
- Evidence-first output model (artifacts over UI)
- Support-facing summary tone (factual, short, evidence-backed)
- Deterministic scenarios for reproducible demo
- README as systems proof document, not tutorial
