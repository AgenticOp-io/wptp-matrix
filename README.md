# wptp-matrix

## Purpose

Public **compatibility matrix** for the [Web Platform Translation Program](https://github.com/theorem6/chrysalis/blob/main/docs/MASTER-PROGRAM.md): which **source platform → target platform** edges exist, their **verification grade**, and **evidence** pointers. Prevents “false green” marketing claims.

## Public API

- `assertCompatibilityMatrix(json)` — structural validation + **Gold requires harness + corpus or CI**
- CLI: `npm run validate` → `data/matrix.v0.json`

## Invariants

- **Gold** edges must be `status: supported` with `evidence.harness` and (`evidence.corpus` or `evidence.ci`).
- **Planned** edges cannot be **Gold**.
- Edge `id` values are unique.

## Non-goals

- Running verify or ingest (see Chrysalis and adapter repos).
- Hosting a public website (JSON in-repo for now; site is optional later).

## Quick start

```bash
npm install
npm test
npm run validate
```

## Related

- [WPTP global scope](https://github.com/theorem6/chrysalis/blob/main/docs/WPTP-GLOBAL-SCOPE.md)
- [wptp-ir](https://github.com/theorem6/wptp-ir)
- [Chrysalis](https://github.com/theorem6/chrysalis)
