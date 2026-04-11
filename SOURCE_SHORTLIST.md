# SOURCE_SHORTLIST.md

## Official research sources
- Netflix incident management engineering blog
- Clerk database incident postmortem (metrics blind spot)
- Resend DB connection exhaustion postmortem
- General incident-management / postmortem structure patterns

## GitHub / implementation inspiration
- Keep / workflow-style incident automation patterns
- FIR-style separation of events vs incidents
- Status page / incident timeline UI repos (for ideas, not copying)

## What to borrow
- event-to-incident separation
- dwell-time grouping
- evidence snapshot artifacts
- runbook-linked operator workflow

## Do not copy literally
- vendor incident-management UI
- generic status-page layout 1:1
- marketing copy or terminology from incident products

## Must invent ourselves
- final incident schema
- summary generation format
- support-first operator UI tone

## Final Locked Reference Repos (Do Not Replace Casually)

### Official research sources
- Netflix: `https://netflixtechblog.com/empowering-netflix-engineers-with-incident-management-ebb967871de4`
  - Use for: incident-management workflow philosophy and fast-path diagnosis framing
- Clerk DB incident: `https://clerk.com/blog/2025-09-18-database-incident-postmortem`
  - Use for: metrics blind spots and diagnosis lessons
- Resend DB exhaustion: `https://resend.com/blog/incident-report-for-february-15-2026`
  - Use for: slow escalation and runtime evidence lessons

### GitHub / implementation inspiration
- Keep: `https://github.com/keephq/keep`
  - Use for: workflow-style incident automation ideas
- FIR: `https://github.com/certsocietegenerale/FIR`
  - Use for: event vs incident separation mindset
- Cachet: `https://github.com/CachetHQ/Cachet`
  - Use for: status/component modeling ideas only
- cstate: `https://github.com/cstate/cstate`
  - Use for: lightweight status history presentation ideas only

### What to borrow
- event-to-incident promotion logic
- component health / status communication patterns
- evidence and incident record separation
- support-facing incident summary structure

### What not to copy literally
- status page UI 1:1
- incident-management product terminology
- product layouts from Keep / Cachet / cstate
