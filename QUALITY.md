# Quality Infrastructure

This document describes the quality check infrastructure for organon-create-image and notes for setting it up on a new machine.

## Overview

All checks run via a single command:

```bash
npm run check:all
```

The checks are designed so that a review agent can invoke `npm run check:all` and parse the output without knowing project-specific details.

## Setup on a New Machine

### Node.js packages (automatic)

Most tools are installed via `npm install` as devDependencies:

- ESLint, Prettier, typescript-eslint — linting & formatting
- Vitest, @vitest/coverage-v8 — testing & coverage
- lockfile-lint — lockfile integrity checking
- cross-env — cross-platform environment variable setting

### Semgrep (manual installation required)

Semgrep is a Python-based SAST tool and is **not** included in `package.json`. It must be installed separately:

```bash
pip install --user semgrep
```

On Windows, this installs to `%APPDATA%\Python\Python3XX\Scripts`. This directory must be on your PATH:

```
C:\Users\<username>\AppData\Roaming\Python\Python312\Scripts
```

Add it to your Windows user environment variables (System > Advanced > Environment Variables > User variables > Path).

#### Windows cp932 encoding issue

On Windows with a Japanese locale, Semgrep crashes with a `UnicodeEncodeError: 'cp932' codec can't encode character` error when downloading rule configs. The `sast` script uses `cross-env PYTHONUTF8=1` to force UTF-8 encoding as a workaround.

## Check Details

### typecheck — `tsc --noEmit`

TypeScript compiler in strict mode. Catches type errors without emitting files.

### lint — `eslint .`

ESLint with typescript-eslint. Includes:

- `typescript-eslint/recommended` rules
- `complexity` rule: warns when cyclomatic complexity exceeds 10
- `eslint-config-prettier`: disables formatting rules that conflict with Prettier

Config: `eslint.config.js` (flat config format).

### format:check — `prettier --check .`

Verifies all files match Prettier formatting. Run `npm run format` to auto-fix.

Config: `.prettierrc`.

### test:coverage — `vitest run --coverage`

Runs all tests and reports V8 coverage to the terminal. Coverage output is text-only (no HTML dashboard).

Test files are co-located with source files (`src/foo.test.ts`). They are excluded from the TypeScript build via `tsconfig.json` `exclude`.

Config: `vitest.config.ts`.

### audit — `npm audit`

Checks dependencies for known CVEs in the npm advisory database.

### audit:lockfile — `lockfile-lint`

Validates `package-lock.json` integrity:

- All packages fetched over HTTPS
- All packages have integrity hashes (sha512)
- Allowed hosts: npm registry only

**Note:** `--validate-package-names` is intentionally omitted because npm package aliases (e.g., `string-width-cjs` → `string-width`) trigger false positives.

### sast — `semgrep scan`

Semgrep static analysis using the `auto` config (2800+ community rules). Scans `src/` only. Runs in `--error` mode (exits non-zero on findings) and `--quiet` mode (minimal output).

## Known Issues

### npm audit signatures

`npm audit signatures` verifies that packages were signed by the npm registry. However, it currently fails due to an expired registry signing key:

```
npm ERR! code EEXPIREDSIGNATUREKEY
npm ERR! js-tokens@4.0.0 has a registry signature with keyid:
SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA
but the corresponding public key has expired 2025-01-29T00:00:00.000Z
```

This is a known issue with npm's key rotation — the package itself is safe, but its signature was made with a key that has since expired. For this reason, `npm audit signatures` is **not** included in `check:all`. It can be run manually:

```bash
npm audit signatures
```

### ESLint version

ESLint is pinned to v9 (not v10) because ESLint 10's default `stylish` formatter uses `util.styleText`, which requires Node.js 20.12.0+. The project currently runs on Node.js 20.11.1. When upgrading Node.js, ESLint can be upgraded to v10.
