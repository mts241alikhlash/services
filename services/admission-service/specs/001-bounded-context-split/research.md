# Research: Admission Bounded-Context Split

## Decision

Split by aggregate and user-facing concept before applying technical layers.

## Evidence

- `docs/ARCHITECTURE.md` explicitly requires two stages.
- Current entities and repository ports already expose the seven seams.
- Controllers are audience-based, so they stay with the aggregate whose use case
  they call rather than being mechanically split by controller file.
- Applicant repository currently spans document, payment, wave, announcement,
  and notification operations. Stage 1 preserves that port; Stage 2 separates
  ports only when each context is layered.

## Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| Move one context per slice | Limits import churn and makes behavior checks local | Move all files at once, which hides regressions |
| Keep flat layout inside each context in Stage 1 | Separates navigation change from layering change | Layer while moving, which mixes two failure causes |
| Keep audience controllers intact | Existing routes are organized by caller audience | Split controllers mechanically and risk route drift |
| Keep root module as composition root | Avoids premature Nest module cycles | Create seven Nest modules before imports are understood |
| No compatibility aliases | Old paths are internal and all consumers are in the repo | Duplicate exports that prolong the flat layout |

## Known Risks

- Cross-context repository methods will look misplaced until Stage 2.
- Current documentation counts differ from source counts; source inventory wins.
- Git commit checkpoints cannot be created because repository metadata is absent.
