# Core Intent
PROBLEM: Korean seniors (55–75) and unemployed youth cannot get a short shift without the "apply → interview → wait → maybe-paid-later" friction, and small service businesses cannot fill same-day labor gaps — 1haeyo matches them hyper-locally with GPS check-in/out, auto-generated labor contracts, and same-day escrow payout.
FEATURES:
- Two-mode matching (instant hire vs 10-minute judgment timer) with bidirectional 5-star reviews
- GPS-gated check-in/out on a Kakao Maps WebView (150m radius) tied to the contracted hours for fairness
- Escrow pre-payment with transparent fee breakdown (hourly × hours + 10% platform + ~3.3% PG) and auto-generated electronic labor contracts signed at match confirmation
TARGET_USER: Korean seniors 55–75 with pension gaps and unemployed young adults looking for 1–4 hour slip-in shifts; employer side is small service businesses (restaurants, cafes, convenience stores) in dense metro areas, with Bundang as the launch beachhead.

# Stack Fingerprint
RUNTIME: Node (package manager only) + TypeScript 5.9 (strict); app runs on React Native 0.81.5 / React 19.1 under Expo SDK 54 managed workflow.
FRONTEND: Expo Router 6 (file-based routing with `(auth)` / `(worker)` / `(employer)` groups and `job/[id]`) + react-native-webview 13 + lucide-react-native 1.8 + Pretendard font family; custom in-repo design system under `shared/ui/` (Button, Card, Input, Text, StarRating, RoleSwitcher).
BACKEND: Supabase (Postgres + Realtime + Auth) — no custom server; business rules enforced in SQL (RLS + triggers) and in TypeScript API modules under `features/*/api/`.
DATABASE: Postgres · 6 tables (profiles, jobs, applications, matches, reviews, contracts) · 18 RLS policies · 3 functions · 5 triggers · 5 tables enabled for Realtime (see `supabase/schema/_all.sql`, 442 lines).
INFRA: EAS Build (`eas.json` with development / preview / production Android APK profiles, `NPM_CONFIG_LEGACY_PEER_DEPS=true`) · no CI (no GitHub Actions, no automated tests) · no public deploy yet.
AI_LAYER: None in the product. Matching is rule-based (radius + hourly_rate + 10-minute judge_deadline), not model-based. No LLM scoring, no embeddings, no recommendation model.
EXTERNAL_API: Kakao Maps JavaScript SDK (via WebView + postMessage bridge), Supabase Realtime websocket, Google OAuth (live via Supabase); PortOne / Toss Payments and Kakao Login are scaffolded in code but disabled at runtime pending business registration and Kakao business-app review.
AUTH: Supabase Auth — anonymous session on launch, Google OAuth linking implemented (`shared/api/oauth.ts: signInWithGoogle`, `linkGoogleToAnonymous`); Kakao OAuth code present but gated behind a "준비 중" alert.
SPECIAL: Kakao Maps JS SDK loaded under an `https://1haeyo.com` baseUrl inside WebView because Android standalone WebView rejects `http://localhost` as an origin — the DNS is never resolved, the string is used only to satisfy Kakao's SDK-domain allowlist.

# Failure Log

## Failure 1
SYMPTOM: Kakao Map rendered fine in Expo Go but the standalone EAS Preview APK loaded the SDK script (HTTP 200) and then silently never constructed `kakao.maps.Map` — a 15-second polling loop in `KakaoMapView.tsx` kept returning false, so users saw a blank grey map.
CAUSE: Not the JS code. Android's standalone WebView does not trust `http://localhost` as an origin, so Kakao's SDK aborted init without throwing. Expo Go's dev WebView is more permissive and masked the bug. The AI kept re-checking the JS bridge and the SDK load order instead of the origin string.
FIX: Switched the WebView `baseUrl` to `https://1haeyo.com` (never actually fetched — used only as an origin token) and registered that HTTPS domain under Kakao console → 플랫폼 키 → JavaScript 키 수정 → JavaScript SDK 도메인, while keeping the `localhost` entries for Expo Go.
PREVENTION: Memory note saved at `reference_kakao_sdk_domain.md` telling future sessions to start every Kakao WebView integration with an HTTPS origin and to check the *JavaScript SDK 도메인* section (not the "제품 링크 관리 > 웹 도메인" section, which is unrelated and was the first wrong guess).

## Failure 2
SYMPTOM: Earlier in the project the AI told the user "Kakao Maps 는 안 된다" and steered map work toward Naver as if Kakao were off the table entirely.
CAUSE: Overgeneralization. Only the Kakao *React Native native SDK* is incompatible with Expo managed workflow; the Kakao *JavaScript SDK via WebView* was never blocked. The AI collapsed two different integrations into one blanket rejection.
FIX: User pushed back and re-opened Kakao JS SDK as a valid path; `docs/action-plan.md` had in fact originally proposed Kakao, and `docs/tech-architecture.md` §9 allows either Naver or Kakao so long as it is JS-via-WebView. Kakao JS SDK is what shipped.
PREVENTION: Memory note `project_map_strategy.md` now pins the rule explicitly: *only* RN native SDKs are excluded; JS-API-via-WebView is fine for either provider, and `features/location/` is structured so the provider is swappable.

# Decision Archaeology

## Decision 1
ORIGINAL_PLAN: Use a native map SDK (originally leaning Kakao, then Naver) for smoothest UX.
REASON_TO_CHANGE: Platform limit — Expo managed workflow cannot link the Kakao/Naver native RN SDKs without ejecting, and ejecting would have burned the rest of the MVP timeline. AI flagged the incompatibility; human accepted it and locked the decision in `docs/tech-architecture.md` §9 + risk table L609.
FINAL_CHOICE: Kakao Maps JavaScript SDK inside a `react-native-webview` with a postMessage bridge for marker / location events (`features/location/KakaoMapView.tsx`).
OUTCOME: Good for the MVP — no ejection, ships today, works on both iOS and Android. Trade-off: WebView map is laggier on low-end Android, the Kakao JS SDK origin issue (see Failure 1) cost a debugging session, and a v2 migration to a native SDK is pre-planned once monthly matches exceed ~1,000.

## Decision 2
ORIGINAL_PLAN: Post-work payment — employer pays the worker after a shift ends, platform takes a cut on settlement.
REASON_TO_CHANGE: Trust and fairness. Workers (especially seniors) won't show up without guaranteed payout; the Timee benchmark in `docs/business-plan.md` shows pre-paid escrow + same-day settlement is the killer feature. Decision locked by the user on 2026-04-14 (see memory `project_payment_model.md`).
FINAL_CHOICE: Employer pre-pays the full amount into escrow at job-post time; posting is blocked until payment succeeds; payout fires the moment the employer confirms checkout. Fee ladder 0% → 10% → 15% mirroring Timee, with a fully itemized breakdown shown to the employer (hourly × hours, platform fee, PG fee, total).
OUTCOME: Right call strategically, but it pushes real payment integration behind a non-code blocker — business registration + 통신판매업 신고 are required before PortOne/Toss can go live, so Sprint 8 currently ships with a mocked escrow UI and a real contracts table (`supabase/schema/008_contracts_and_payout.sql`) waiting for the payment switch.

# AI Delegation Map

| Domain | AI % | Human % | Notes |
|--------|------|---------|-------|
| DB Schema Design (Postgres tables, enums, indexes) | 70 | 30 | AI drafted the 6 tables and migration files; human set the fairness-critical columns (judge_deadline, escrow_status, contract hash) and column semantics. |
| RLS Policies / DB Security | 55 | 45 | AI wrote the 18 policies from a checklist; human verified each table's read/write audience and caught "employer can see other employer's applicants" style gaps. |
| React Native Components & Screens | 75 | 25 | AI scaffolded `shared/ui/*` and the route group screens; human-tuned copy (all Korean), spacing, and the `job/[id].tsx` lifecycle states. |
| Matching + Fairness Business Rules | 25 | 75 | `docs/matching-system.md` (527 lines) is human-authored domain design — 10-minute judgment timer, 95%-of-duration checkout gate, penalty ladder. AI implemented it. |
| Payment / Fee Model | 20 | 80 | Escrow-first, 0/10/15% ladder, same-day payout, Timee benchmarking — decided by human on 2026-04-14. AI only translated the model into schema + UI breakdown. |
| Kakao Maps WebView Integration | 60 | 40 | AI wrote the WebView + postMessage glue; human diagnosed the HTTPS-origin bug and the two Kakao-console sections (see Failure 1). |
| Auth (Supabase anonymous + Google OAuth) | 80 | 20 | AI wrote nearly all of `shared/api/oauth.ts`; human decided to gate Kakao login behind a "준비 중" alert until the business-app conversion clears. |
| Docs (business plan, progress, action plan, tech-architecture) | 30 | 70 | Korean, opinionated, full of domain references (labor law §114, 전자서명법 2020); AI helps with structure but the voice and decisions are the founder's. |
| Commit Messages & Release Narrative | 85 | 15 | Four commits, all AI-style Korean conventional-commit summaries (`feat: Phase 3A-3C 완료 — Supabase 백엔드 연동`). |
| Tests / CI | 0 | 0 | Neither side did it. No `*.test.ts`, no GitHub Actions. Honest gap. |

# Live Proof
DEPLOYED_URL: ? — no public build yet; EAS is configured for internal APK distribution only (`eas.json` preview profile), and the Play Store / TestFlight track has not started.
GITHUB_URL: https://github.com/austinpw-cloud/1haeyo (repo exists; visibility is private per README, URL itself is public).
API_ENDPOINTS: Supabase project reference present in `.env` (Seoul region). Not listing the host here because the anon key lives with it and the project is pre-launch; RLS is on but the endpoint is not meant to be shared yet.
CONTRACT_ADDRESSES: ? — not a crypto project.
OTHER_EVIDENCE: ? — no users, no transactions, no demo video. Only artifacts are the repo itself, four commits (2026-04-12 → 2026-04-13), and a functional dev build on the maintainer's device. Field test in Bundang is the next verifiable milestone, not yet run.

# Next Blocker
CURRENT_BLOCKER: time + knowledge, not technical. Real payment (PortOne / Toss same-day payout) is blocked on offline paperwork: business registration (사업자등록) and 통신판매업 신고, plus Kakao's business-app review for the `account_email` OAuth scope. The code path for escrow → payout exists as a mock; flipping it on without those filings would violate Korean e-commerce rules.
FIRST_AI_TASK: Write a staging-mode server function (Supabase Edge Function) that, when an employer confirms checkout on a match row, moves `matches.payment_status` from `escrow` to `settled`, inserts a `payouts` audit row with amount + timestamp + idempotency key, and returns a mock PortOne transaction id — wired so that swapping the mock call for a real PortOne `POST /v2/payments/{paymentId}/cancel-or-transfer` is a one-line change once the business registration clears. Include the idempotency guard against double-fire from Realtime retries.

# Integrity Self-Check
PROMPT_VERSION: commit-brief/v1.3
VERIFIED_CLAIMS:
- Tech stack versions: `package.json` (Expo 54.0.33, React Native 0.81.5, React 19.1.0, expo-router 6.0.23, @supabase/supabase-js 2.103, react-native-webview 13.15, expo-location 19.0.8, typescript 5.9.2).
- Route groups and `job/[id].tsx`: verified via `ls app/` and the git status showing `app/(auth)/login.tsx`, `app/(employer)/*`, `app/(worker)/*`, `app/job/[id].tsx`.
- Schema object counts: `grep` over `supabase/schema/_all.sql` — 6 `create table`, 18 `create policy`, 3 `create .. function`, 5 `create trigger`; plus `006_enable_realtime.sql` and `008_contracts_and_payout.sql` as separate migrations.
- EAS profiles: read from `eas.json` (development / preview / production, Android APK, `NPM_CONFIG_LEGACY_PEER_DEPS=true`).
- Four commits on main, in the listed order and dates: `git log --oneline` (15361d6, 8f6b88f, f3c36b8, 25b0273).
- OAuth state: `shared/api/oauth.ts` exposes `signInWithGoogle` + `linkGoogleToAnonymous` + `signInWithKakao` + `linkKakaoToAnonymous`; Kakao path is gated (confirmed against the "준비 중" UX mentioned in docs/progress.md).
- Failure 1 root cause and fix: memory note `reference_kakao_sdk_domain.md` and `features/location/KakaoMapView.tsx` comments both describe the HTTPS-origin workaround.
- Failure 2: memory note `project_map_strategy.md` explicitly records the earlier AI overcorrection and the user's correction.
- Decision 2 payment model: memory note `project_payment_model.md` dated 2026-04-14 with the 0/10/15% ladder and escrow-first rule.

UNVERIFIABLE_CLAIMS:
- That the Bundang pilot will be the next milestone — I can see it in `docs/action-plan.md` and `docs/business-plan.md`, but not that anything has been scheduled, signed, or physically booked.
- That business registration is genuinely the *only* blocker for Sprint 8 — there may be additional PortOne KYC steps I can't see from the repo.
- "Works on the maintainer's device" — I did not run the app; I only read the code. The claim rests on commits and config, not observed runtime.
- User counts, transactions, Play Store status — none exist yet, so "?" is the right answer and is used above.
- The exact percentages in the AI Delegation Map are estimates. I have strong signal on which files feel human vs scaffolded (docs are human, `shared/ui` is AI, matching/payment logic is human), but the specific %s are judgment, not measurement.

DIVERGENCES: none observed. The user did not modify the template or steer answers; they asked for the brief to be grounded in the code and committed/pushed, which is exactly what this file does. One honest caveat worth flagging: the brief is describing a pre-launch MVP with 4 commits over ~2 days of real coding — the iteration depth required for a Failure Log that's truly "AI got it wrong 3+ times" is thin. Failure 1 genuinely qualifies (multiple wrong diagnoses on the blank-map bug before the origin was identified). Failure 2 is a single correction, not a 3x recurrence — included because it's the next-best evidence, and flagged here rather than padded.

CONFIDENCE_SCORE: 8 / 10 — stack, schema, commits, auth, decisions, and memory-backed failures are all read directly from files. The AI-vs-human split percentages and the "no users yet" live-proof section are the softest parts.
