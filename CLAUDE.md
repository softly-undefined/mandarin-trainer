# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mandarin Trainer is a React-based web application for learning Chinese vocabulary through flashcards and quizzes. It uses Firebase for authentication and Firestore for data persistence. The app is deployed to GitHub Pages.

## Development Commands

- `npm start` - Start development server on localhost:3000
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run deploy` - Build and deploy to GitHub Pages

## Architecture

### State Management & Navigation

The app uses a single-page architecture with conditional rendering controlled by App.js. All page state (`showHome`, `showTestingZone`, `showFinishPage`, etc.) and navigation logic live in `AppContent`. The `goToPage(pageName, payload)` function handles all navigation between views.

### Context Providers

Two context providers wrap the entire app:
- **AuthContext** (`src/contexts/AuthContext.js`): Manages Firebase authentication, provides `currentUser`, `signInWithGoogle()`, and `logout()`
- **ThemeContext** (`src/contexts/ThemeContext.js`): Manages dark/light mode theming

### Main Components

- **Home** - Landing page displaying user's vocab sets with CRUD operations. Sets can be edited (opens VocabSetEditor), started (navigates to StartLearning via slug-based URL), or shared (copy link to clipboard)
- **VocabSetEditor** - Create/edit vocab sets. Each vocab item has `character`, `pinyin`, and `definition` fields
- **StartLearning** - Configuration page before starting a learning session. User selects "given" field (what they see) and "want" field (what they answer), toggles multiple choice mode, then clicks Start
- **TestingZone** - Core learning interface implementing a spaced repetition algorithm. Tracks correct/incorrect answers, removes fully learned words after consecutive correct answers, and maintains progress statistics
- **FinishPage** - Post-session results page with Chart.js visualizations showing performance over time
- **Settings** - App preferences including traditional/simplified Chinese toggle
- **SignIn** - Google authentication page

### Data Model

Firestore collection `vocabSets` with documents containing:
```javascript
{
  userId: string,           // Owner's Firebase UID
  ownerId: string,          // Same as userId (legacy field)
  setName: string,          // Display name of the set
  vocabItems: [             // Array of vocab objects
    {
      character: string,    // Chinese characters
      pinyin: string,       // Romanized pronunciation
      definition: string    // English definition
    }
  ],
  slug: string,             // 8-character URL-safe identifier for sharing
  isPublic: boolean,        // Whether set is publicly accessible
  createdAt: Date,
  updatedAt: Date
}
```

**Limits:**
- `MAX_SETS_PER_USER = 50`
- `MAX_WORDS_PER_SET = 200`

### Services

`src/services/vocabSetService.js` provides all Firestore operations:
- `createVocabSet(userId, setName, vocabItems)` - Creates new set with auto-generated slug
- `getUserVocabSets(userId)` - Fetches all sets for user, backfills missing slugs/fields
- `updateVocabSet(setId, updates)` - Updates existing set
- `getSetBySlug(slug)` - Fetches public set by share slug (used for anonymous access)
- `duplicateSet(targetUserId, sourceSet)` - Copies set to new user
- `deleteVocabSet(setId)` - Deletes set

### URL Routing & Sharing

The app uses client-side routing with GitHub Pages SPA handling:
- `/` - Home page (requires authentication unless accessing shared set)
- `/set/:slug` - Shared set view (works without authentication)
- `/settings` - Settings page
- `?editSet=:setId` - Opens VocabSetEditor for specific set (query param cleaned after opening)

Shared sets load via `getSetBySlug()` and bypass authentication. The 404.html redirect script enables direct navigation to `/set/:slug` URLs.

### Learning Algorithm (TestingZone)

- Shuffles vocab set at start
- Tracks answer correctness per word
- Words requiring 2+ consecutive correct answers to be marked "learned"
- Learned words removed from rotation
- Session ends when all words are learned
- Tracks `responseCounts` (1=correct, 0=incorrect) and `learnedOverTime` for visualization

### Environment Configuration

Firebase configuration loaded from environment variables:
- `.env.local` - Development environment
- `.env.production` - Production environment

Required variables:
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
```

### GitHub Pages Deployment

- Homepage configured as `https://softly-undefined.github.io/mandarin-trainer`
- Uses `gh-pages` package for deployment
- `deploy` script builds then pushes to `gh-pages` branch
- SPA routing handled by 404.html redirect script

## Notes for Development

- When modifying vocab set structure, ensure backward compatibility with existing Firestore documents or add migration logic to `getUserVocabSets()`
- The `goToPage()` function in App.js handles URL manipulation for shared sets - be careful when modifying navigation logic
- TestingZone's spaced repetition logic is complex - read the full component before modifying learning behavior
- Dark mode styles are conditionally applied throughout components - maintain consistent theming when adding new UI elements
