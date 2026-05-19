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
- Hosting a public website beyond the static viewer in `site/` (GitHub Pages wiring is optional).

## Quick start

```bash
npm install
npm test
npm run validate
npm run verify:harness   # bronze compose + silver WebIR import (+ runtime Hono checks)
npm run site:validate    # static matrix site loads JSON
npm run compose -- --path openapi-ir-hono --in fixtures/petstore-mini.openapi.json --out ./out --verify
```

Open `site/index.html` locally, or use **GitHub Pages** after enabling Pages on this repo (workflow `pages.yml` deploys `_site/` on push to `main`).

Matrix viewer shows **20 edges** + **10 composer paths** with grade filters.

**Optional Chrysalis paths (local):** set `CHRYSALIS_ROOT` to a built Chrysalis checkout (`pnpm -r build`), then `npm run verify:harness` also runs:

- **Silver:** `openapi-ir-hono-chrysalis`, `har-ir-hono-chrysalis` (IR → WebIR → `emit-webir-bundle-hono`)
- **Gold:** `php-webir-hono` (`chrysalis status` on tiny-blog; requires **100%** correctness)
```

## Related

- [WPTP global scope](https://github.com/theorem6/chrysalis/blob/main/docs/WPTP-GLOBAL-SCOPE.md)
- [wptp-ir](https://github.com/theorem6/wptp-ir)
- [Chrysalis](https://github.com/theorem6/chrysalis)
