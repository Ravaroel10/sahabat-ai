# Codebase Cleanup — Handoff Prompt

> **Paste this entire document into the new session.** It is self-contained: it carries the mission, the safety rules, the full inventory, the execution plan, and reusable prompts. The new session needs nothing else from prior conversation.

---

## 0. WHO YOU ARE & WHAT'S HAPPENING

You are an AI coding agent picking up an **in-progress codebase cleanup** for a project called **`bantu-arah`**. The previous session completed the **detection phase** (zero edits were made — this is a clean handoff). Your job is to execute the cleanup safely, one phase at a time, with human approval at each gate.

The owner vibe-coded this app and accumulated dead code, abandoned/half-implemented features, and duplicates. They are **worried an AI will break things**. Your #1 priority is **do no harm**. Slowness is fine. Breaking the app is not.

---

## 1. NON-NEGOTIABLE SAFETY RULES (read these first)

1. **Fresh git branch before any edit.** Branch off `master` (the current/default branch). Name it `cleanup/dead-code` or similar. Every excision = **one commit** so `git revert` / `git checkout` is always trivial.
2. **One phase = one PR or one review gate.** Do NOT batch phases. Finish a phase, run verification, get human sign-off, then proceed.
3. **Behavior snapshot first.** The baseline test suite has **6 suites failing, 70 tests failing, 79 passing (149 total)**. Run `npm test` and record the output BEFORE touching anything — this is your regression detector. After each phase, re-run; if *previously passing* tests now fail, `git revert` that commit immediately.
4. **AI's role is narrow: find candidates and explain code.** A human approves every deletion after you answer "why does this exist?" When in doubt, **stop and ask.**
5. **Never auto-merge duplicates.** This is the #1 way AI breaks codebases (a real team shipped 127 bugs this way). Always produce a line-by-line diff and flag *every* difference as potentially intentional.
6. **Re-verify findings before acting.** The inventory below was accurate at handoff time, but code may have changed. Before deleting anything, re-confirm with knip/grep that it's still unreferenced.
7. **Match existing code style.** Read `AGENTS.md` first — this is a **non-standard Next.js version**; read `node_modules/next/dist/docs/` before writing Next.js code. Match comment density, naming, and idioms of surrounding code.

---

## 2. PROJECT CONTEXT

| Item | Value |
|---|---|
| **Path** | `K:\projects\dev\bantu-arah` (Windows, Git Bash shell) |
| **Framework** | Next.js **16.2.9** (⚠️ non-standard — see `AGENTS.md`) |
| **React** | 19.2.4 |
| **Language** | TypeScript (strict) |
| **ORM** | **Drizzle** (active) — but **Prisma remnants exist** (see F1) |
| **Auth** | **better-auth** (active) — `next-auth` is installed but UNUSED |
| **AI SDK** | `ai` + `@ai-sdk/openai` + `@ai-sdk/react` |
| **Styling** | Tailwind v4 + shadcn/ui |
| **Test** | Jest + ts-jest + Testing Library (jsdom) |
| **Package manager** | Both `bun.lock` and `package-lock.json` exist; `package-lock.json` is newer, npm is being used |
| **Git branch** | Currently on `master` (single branch, one commit "legacy init") |
| **Source** | 99 tracked TS/TSX files in `src/`, ~17,742 LOC |

### Shell gotchas (Windows / Git Bash)
- **`find` with parentheses fails** — use `git ls-files 'src/*.ts' 'src/*.tsx'` instead.
- **`grep` with multiple `-e` or combined `-l`/`-v` flags errors** — run separate grep calls or use `git grep`.
- Prefer `git ls-files` + `xargs grep` over `find -exec`.

### Known broken state (pre-existing, NOT caused by cleanup)
- **`nanoid` is imported but not in package.json** → `src/app/api/eligibility-search/route.ts:7`. This endpoint **crashes at runtime**. Decide with owner: add dep or remove route.
- **6 jest suites already failing** (70 tests) — establish as baseline before cleanup.

---

## 3. THE FRAMEWORK: DPEV

For every item, loop:

```
DETECT   → Re-confirm the candidate is still unreferenced (knip/grep). NO edits yet.
PIN      → Confirm current behavior works (run npm test; compare to baseline).
EXCISE   → One deletion, one commit, tightly scoped.
VERIFY   → Re-run npm test. Green matches baseline? Commit stays. Red/new failures? git revert.
```

Risk tiers (do them in this order):
- 🟢 **Dead code** — safe to delete after confirming zero references
- 🟡 **Abandoned/half-implemented** — investigate call sites and UI wiring first
- 🔴 **Duplicates** — manual diff required, never auto-merge

---

## 4. TOOLING — install before starting

The previous session installed these with `--no-save` (not persisted). Re-install:

```bash
npm install --no-save knip jscpd
```

**Commands to reproduce the inventory:**
```bash
# Dead code (filter the output to src/ — knip also flags .github/.kiro skill scripts which are NOT app code)
node_modules/.bin/knip --no-progress --reporter symbols > knip-out.txt 2>&1
# then grep '^src/' knip-out.txt

# Duplicates
node_modules/.bin/jscpd src --min-lines 6 --min-tokens 50 --format ts,tsx \
  --ignore "**/*.test.*,**/_deprecated/**" --reporters json,console

# Half-implemented markers
git ls-files 'src/*.ts' 'src/*.tsx' | xargs grep -niE "TODO|FIXME|not implemented|placeholder|stub|mock"

# Behavior baseline
npm test 2>&1 | grep -aE "Tests:|Test Suites:|PASS|FAIL"
```

---

## 5. THE FULL INVENTORY (verified at handoff — re-check before deleting)

### CATEGORY A — Dead Files 🟢 (14 files, ~2,500+ LOC)

**A1. `_deprecated/` folder (already excluded in tsconfig):**
- `src/components/_deprecated/navigator-page-backup.tsx`
- `src/components/_deprecated/scanner-page-backup.tsx`

**A2. Components never imported:**
- `src/components/chat-history-sidebar.tsx`
- `src/components/consent-modal.tsx`
- `src/components/marketplace/eligibility-filter-modal.example.tsx`
- `src/components/marketplace/index.ts` (barrel re-export, zero importers)
- `src/components/unified-chat/unified-chat-with-history.tsx` (full clone of `unified-chat-interface.tsx` — see C1)

**A3. Data never imported:**
- `src/data/content-mappings.ts`

**A4. Lib never imported (cascade: prisma.ts only feeds security/index.ts which is itself dead):**
- `src/lib/auth/permissions.ts`
- `src/lib/prisma.ts` (only used by security/index.ts below)
- `src/lib/security/index.ts`
- `src/types/auth.ts`

### CATEGORY B — Unused Exports 🟢 (~49 exports in live files)

**B1. Shadcn UI sub-component bloat (39 exports across 11 files):** `alert-dialog.tsx`, `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `progress.tsx`, `select.tsx`, `sheet.tsx`, `tabs.tsx` — each exports sub-components (e.g. `DialogPortal`, `SheetHeader`, `SelectSeparator`) that nothing imports. **Caveat:** some may be used indirectly; verify each before removing.

**B2. Application-level unused exports:**
- `getPDFTemplate` — `pdf-templates.tsx:708`
- `getDocumentTemplate` — `document-templates.ts:25`
- `generatePDFBlob` — `pdf-generator.ts:24`
- `hasFormFields`, `validatePdf`, `validatePdfSize`, `validatePdfFormat`, `PdfProcessingError`, `fillAndFlattenPdfTemplate` — `pdf-processing/index.ts`
- `PdfFormField` type (exported twice) — `pdf-uploader.tsx:27` + `pdf-processing/index.ts:13`
- `generateIds` — `utils-db.ts:14`
- `signIn`, `signOut` — `auth-client.ts:7`

### CATEGORY C — Duplicates 🔴 (22 clones, 282 lines = 3.06% of TSX)

**C1. `unified-chat-with-history.tsx` ≈ `unified-chat-interface.tsx`** — 3 clones (up to 39 lines/196 tokens). The former is **dead code** (knip) → **delete the whole file, don't merge.**

**C2. `pdf-templates.tsx` self-clones** — 10 clones (up to 29 lines/201 tokens). 3+ near-identical PDF form templates. 🔴 **Manual diff required** — subtle field differences are likely intentional.

**C3. `chat-history-sidebar.tsx` ↔ `sidebar-nav.tsx`** — 4 clones (nav-link rendering). The former is **dead** → delete it.

**C4. `programs/[id]/page.tsx` ↔ `programs/page.tsx`** — 1 clone (11 lines/100 tokens, skeleton card rendering). Extract to shared component if both stay.

**C5. `programs/page.tsx` self-clones** — 3 clones (11-19 lines, repeated UI blocks). Refactor opportunity, manual review.

**jscpd clone map (file:start-end ↔ file:start-end):**
```
#1  programs/[id]/page.tsx:85-95      <=> programs/page.tsx:280-290      (11L)
#2  programs/[id]/page.tsx:386-394    <=> programs/[id]/page.tsx:400-408 (9L)
#3  programs/page.tsx:534-552         <=> programs/page.tsx:566-584      (19L)
#4  programs/page.tsx:534-549         <=> programs/page.tsx:598-613      (16L)
#5  programs/page.tsx:534-546         <=> programs/page.tsx:618-630      (13L)
#6  chat-history-sidebar.tsx:14-34    <=> sidebar-nav.tsx:28-48          (21L)
#7  chat-history-sidebar.tsx:64-75    <=> sidebar-nav.tsx:84-95          (12L)
#8  chat-history-sidebar.tsx:79-89    <=> sidebar-nav.tsx:95-108         (11L)
#9  chat-history-sidebar.tsx:99-110   <=> sidebar-nav.tsx:140-151        (12L)
#10 pdf-templates.tsx:198-209         <=> pdf-templates.tsx:353-364      (12L)
#11 pdf-templates.tsx:198-226         <=> pdf-templates.tsx:468-496      (29L)
#12 pdf-templates.tsx:198-209         <=> pdf-templates.tsx:588-599      (12L)
#13 pdf-templates.tsx:243-253         <=> pdf-templates.tsx:382-392      (11L)
#14 pdf-templates.tsx:250-256         <=> pdf-templates.tsx:522-528      (7L)
#15 pdf-templates.tsx:262-270         <=> pdf-templates.tsx:389-397      (9L)
#16 pdf-templates.tsx:282-292         <=> pdf-templates.tsx:399-409      (11L)
#17 pdf-templates.tsx:314-322         <=> pdf-templates.tsx:449-457      (9L)
#18 pdf-templates.tsx:354-366         <=> pdf-templates.tsx:589-600      (13L)
#19 pdf-templates.tsx:377-384         <=> pdf-templates.tsx:510-517      (8L)
#20 unified-chat-interface.tsx:17-24  <=> unified-chat-with-history.tsx:15-22  (8L)
#21 unified-chat-interface.tsx:194-232<=> unified-chat-with-history.tsx:229-267(39L)
#22 unified-chat-interface.tsx:234-245<=> unified-chat-with-history.tsx:279-290(12L)
```

### CATEGORY D — Half-Implemented / Abandoned 🟡

**D1. Mock API routes (5 files, pure dev scaffolding, leak fake data if deployed):**
- `src/app/api/chat-mock/route.ts` — comment says "Temporarily change unified-chat-interface.tsx to use '/api/chat-mock'"
- `src/app/api/chat-mock-document/route.ts`
- `src/app/api/chat-mock-emergency/route.ts`
- `src/app/api/chat-mock-question/route.ts`
- `src/app/api/chat-test-inline/route.ts`
- Only `chat-mock` and `chat-test-inline` reference each other; nothing production imports these.

**D2. Fact-check page — entirely mock (`src/app/(main)/fact-check/page.tsx`):**
- Whole analysis is `setTimeout` + hardcoded if/else fake verdicts
- **Not linked in any navigation** — unreachable from UI
- Returns fabricated "fact-check" results → risk if deployed/accessible

**D3. `src/app/api/example-protected-route/route.ts`** — named "example", likely scaffolding.

**D4. Unused npm dependencies (15):** `@ai-sdk/google`, `@ai-sdk/openai`, `@better-auth/drizzle-adapter`, `@radix-ui/react-avatar`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`, `next-auth`, `openai`, `recharts`, `tailwindcss-animate`, `tesseract.js`. ⚠️ Some radix deps may be indirect shadcn deps — verify with `npm ls <pkg>` before removing.

**D5. TODOs (2 real):** `src/app/api/chat/route.ts:154` (content transformation), `src/components/unified-chat/message-parts.tsx:324` (integrate social-programs data).

**D6. Broken: `nanoid` imported but unlisted** — `src/app/api/eligibility-search/route.ts:7`. 🔴 runtime crash.

### CATEGORY E — Root Clutter 🟢 (65 `.md` scratch files)

AI session artifacts in repo root: implementation checklists, fix summaries, deploy guides. Examples: `ALL_FIXES_CHECKLIST.md`, `IMPLEMENTATION_COMPLETE_PHASE_1_2.md`, `INLINE_CARDS_VISUAL.md`, `DEPLOY_NOW.md`, `SESSION_SUMMARY.md`.
- **Keep:** `README.md`, `DESIGN.md`, `AGENTS.md`, `CLAUDE.md`, `PRODUCT.md`
- **Maybe keep:** `CLEANUP_PLAN.md`
- **Delete:** the rest (~60 files)

### CATEGORY F — Structural Issues

**F1. Dual ORM:** Drizzle is active (7 files import `src/db/`). Prisma (`prisma/schema.prisma` 149 lines, `src/lib/prisma.ts`) is only used by dead `security/index.ts`. `postinstall: "prisma generate"` still runs. Consider removing Prisma entirely after confirming.

**F2. `nanoid` missing dep** (see D6).

**F3. Test baseline:** 6 suites / 70 tests failing (pre-existing).

---

## 6. EXECUTION PLAN — DO IN THIS ORDER

Each phase = one commit. Run `npm test` after each. Revert on new failures.

| # | Phase | Risk | Action |
|---|---|---|---|
| 1 | Delete ~60 root `.md` scratch files (keep README, DESIGN, AGENTS, CLAUDE, PRODUCT) | 🟢 | `git rm` |
| 2 | Delete `src/components/_deprecated/` (2 files) | 🟢 | `git rm` |
| 3 | Delete 5 mock API routes (D1) | 🟡 | removes fake-data leak; confirm none referenced |
| 4 | Delete `fact-check` page (D2) | 🟡 | confirm not in nav (already verified: no links) |
| 5 | Delete `example-protected-route` (D3) | 🟡 | `git rm` |
| 6 | Delete dead components (A2): chat-history-sidebar, consent-modal, eligibility-filter-modal.example, marketplace/index.ts, unified-chat-with-history | 🟢 | resolves clones C1+C3 |
| 7 | Delete dead lib (A4): permissions.ts, prisma.ts, security/index.ts, types/auth.ts | 🟢 | |
| 8 | Delete `content-mappings.ts` (A3) | 🟢 | |
| 9 | Remove unused npm deps (D4) | 🟡 | verify each with `npm ls`; update package.json |
| 10 | Prune unused exports (B1+B2) from live files | 🟡 | one file per commit |
| 11 | Remove Prisma remnants (F1) if confirmed unused | 🟡 | schema, prisma.ts, postinstall hook |
| 12 | **LAST:** consolidate `pdf-templates.tsx` (C2) + `programs/page.tsx` (C5) duplicates | 🔴 | manual diff each, human-approved merge |

**Pause for human review after every phase.** Do not auto-advance.

---

## 7. REUSABLE PROMPTS (for specific operations during execution)

### Prompt — Pre-deletion verification (use before EVERY deletion)
> I'm about to delete `<file>`. Before I do: (1) grep the ENTIRE codebase via `git ls-files 'src/*.ts' 'src/*.tsx' | xargs grep -l "<exported-symbol>"` for every symbol it exports, including dynamic imports and string-based lookups; (2) show me the evidence it's truly unreferenced; (3) only after I confirm, delete it in a single commit: `chore: remove dead code — <name>`. If you find ANY reference, STOP and report it. Do not delete.

### Prompt — Duplicate handling (the dangerous one, for Phase 12)
> I'll point you at two duplicate code blocks. DO NOT merge or refactor yet. First produce a line-by-line diff and call out EVERY difference, however small — different null checks, ordering, constants, error messages. For each difference, explain what behavior it could cause. Only after I review the diff will I say whether merging is safe. Treat every difference as potentially intentional.

### Prompt — Dependency removal (Phase 9)
> For each unused dependency, run `npm ls <package>` to check for dependents, then check `git grep "<package>"` across all files. Report: (a) direct importers, (b) packages that depend on it, (c) whether removing it is safe. Do NOT run `npm uninstall` until I approve each one individually.

---

## 8. CURRENT STATUS

- ✅ **Detection complete** (knip + jscpd + grep) — inventory above
- ✅ **Zero edits made** — clean handoff
- ⬜ **Execution not started** — begins at Phase 1

**First action for the new session:**
1. Read this whole document.
2. Read `AGENTS.md` and acknowledge the non-standard Next.js constraint.
3. Create branch `cleanup/dead-code` off `master`.
4. Run `npm test`, save the baseline output.
5. Confirm with the owner before starting Phase 1.

---

## 9. RESEARCH-BACKED RATIONALE (why these rules exist)

- A 2025 study (arXiv 2511.02922): AI made legacy refactoring **faster but not smarter**; the strongest predictor of actually understanding changes was **how often the dev verified** (r=0.96). → This is why we verify after every commit.
- GitClear (211M lines): AI tools **duplicate more and consolidate less** over time. → Duplicate removal works against AI's default; it needs guardrails.
- Real case study: a team let AI remove "duplicates" and shipped **127 bugs** into a payment system — duplicates hid subtle business logic. → This is why we never auto-merge and always diff manually.

**Sources:** [Unblocked — Refactoring Legacy Code with AI](https://getunblocked.com/blog/refactoring-legacy-code/), [AGMIS — What We've Learned](https://agmis.com/what-weve-learned-refactoring-legacy-code-with-ai/), [DevGenius — 127 Bugs](https://blog.devgenius.io/i-let-ai-refactor-our-legacy-codebase-it-created-127-new-bugs-344b56bc0a62)
