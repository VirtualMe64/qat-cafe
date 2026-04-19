# Qat Cafe

Lightweight Scrabble-style app for head-to-head play.

## Current Scope

- Username-only sign in (no password).
- Auto-create a user row on first sign in.
- Persist signed-in user in local storage.
- Load a signed-in player's games from Supabase.
- Create a game from a floating action button by entering opponent username.
- Insert rows into games and game_players, then open an empty game page.

## Required Environment Variables

Create a local env file (for example `.env.local`) with:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The app is fail-fast: if these are missing or Supabase returns errors, the UI shows an error instead of using local mock data.

## Expected Tables

- users
- games
- game_players
- moves

The current screens actively use users, games, and game_players.

## Project Structure

```text
src/
	context/
		AuthProvider.jsx
		authContext.js
	pages/
		GamePage.jsx
		GamesPage.jsx
		SignInPage.jsx
	services/
		authService.js
		gamesService.js
		supabaseClient.js
	styles/
		global.css
	App.jsx
	main.jsx
```

## Local Development

```bash
npm install
npm run dev
```