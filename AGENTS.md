# Mandarin Trainer Agent Notes

## Purpose
Mandarin Trainer is a React + Firebase app for creating Chinese vocabulary sets and running active recall learning sessions against those sets.

## App Flow
1. Authentication
- Users sign in with Google.
- On first sign-in, a user profile is ensured in Firestore and a starter vocabulary set may be created.

2. Home (`src/components/Home.js`)
- Loads the current user's sets and starred public sets.
- Supports creating/editing sets, starring, sharing, and launching learning.

3. Start Learning (`src/components/StartLearning.js`)
- User picks mode settings:
- `given` (prompt field)
- `want` (answer field)
- `isMultipleChoice`
- `isQuickReview`
- Starts a learning session for the selected set.

4. Testing Zone (`src/components/TestingZone.js`)
- Runs the core quiz loop (submit/skip/next).
- Tracks:
- per-question correct/incorrect sequence
- per-term correct/wrong counts
- learned-over-time checkpoints for charting
- learned term count progress

5. Finish Page (`src/components/FinishPage.js`)
- Shows summary stats and a learned-over-time chart.

## Data and Services
- Firebase bootstrapping: `src/firebase.js`
- Set CRUD, stars, public/share lookups: `src/services/vocabSetService.js`
- User profiles and username system: `src/services/userProfileService.js`

Primary Firestore collections currently in use:
- `users`
- `usernames`
- `vocabSets`
- `setStars`

## Context Providers
- `AuthContext`: auth state + profile actions
- `ThemeContext`: dark mode
- `ScriptContext`: simplified/traditional display preference
- `PinyinContext`: pinyin formatting behavior

## New Structural Decision (Phase 1): Learning Session Domain Layer
To prepare for analytics and resumable learning, learning state is now centered in a dedicated domain layer rather than ad-hoc component state.

New modules:
- `src/learning/learningSessionModel.js`
  - Shared logic for valid set normalization, prompt derivation, and field resolution.
- `src/learning/learningSessionReducer.js`
  - Canonical learning session state shape and reducer actions.
- `src/services/learningSessionService.js`
  - Persistence adapter (currently localStorage) with:
  - `createLearningSession`
  - `updateLearningSession`
  - `completeLearningSession`
  - `getLatestLearningSession`
  - `clearLatestLearningSession`

How it is used now:
- `TestingZone` initializes a session record when a set is loaded.
- Runtime progress is persisted throughout the session.
- Session is marked completed when user finishes.
- Current UI behavior is intentionally unchanged; this is structural groundwork.

What this enables next:
- Reliable tracking of time/attempt/progress data per user and set.
- Resume capability from latest active session without rewriting quiz logic.

## Contributor Guardrails
- For learning-flow changes, prefer updating reducer/model/service modules first, then UI.
- Avoid reintroducing duplicated quiz state in multiple components.
- Keep persistence behind `learningSessionService` so storage backend can later move from localStorage to Firestore with minimal UI impact.
