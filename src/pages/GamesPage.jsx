import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/authContext";
import { createGameWithOpponent, getGamesForUser } from "../services/gamesService";

function formatDateTime(timestamp) {
  if (!timestamp) {
    return "-";
  }

  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRuleCount(rules) {
  if (!rules || typeof rules !== "object") {
    return 0;
  }

  return Object.keys(rules).length;
}

function normalizeId(value) {
  return value == null ? "" : String(value);
}

function GamesPage({ onOpenGame }) {
  const { user, signOut } = useAuth();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState("");
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const totalGames = useMemo(() => games.length, [games]);

  const loadGames = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const records = await getGamesForUser(user.id);
      setGames(records);
    } catch (error) {
      setGames([]);
      setErrorMessage(error.message || "Failed to load games.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  function openCreateModal() {
    setCreateErrorMessage("");
    setOpponentUsername("");
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isCreatingGame) {
      return;
    }

    setCreateErrorMessage("");
    setIsCreateModalOpen(false);
  }

  async function handleCreateGame(event) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      setIsCreatingGame(true);
      setCreateErrorMessage("");

      const createdGame = await createGameWithOpponent({
        currentUser: user,
        opponentUsername,
      });

      setIsCreateModalOpen(false);
      setOpponentUsername("");
      await loadGames();
      onOpenGame?.(createdGame.id);
    } catch (error) {
      setCreateErrorMessage(error.message || "Failed to create game.");
    } finally {
      setIsCreatingGame(false);
    }
  }

  return (
    <main className="page">
      <header className="panel games-header">
        <div>
          <p className="eyebrow">qat cafe</p>
          <h1>{user?.username}&apos;s games</h1>
          <p className="panel-copy">{totalGames} game(s) loaded from Supabase.</p>
        </div>

        <div className="games-actions">
          <button type="button" className="ghost-button" onClick={loadGames} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="ghost-button ghost-button--warn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {errorMessage ? (
        <section className="panel stack">
          <h2>Failed to load games</h2>
          <p className="error-text">{errorMessage}</p>
          <button type="button" onClick={loadGames}>
            Try again
          </button>
        </section>
      ) : null}

      {!errorMessage && isLoading ? (
        <section className="panel">
          <p>Loading your games...</p>
        </section>
      ) : null}

      {!errorMessage && !isLoading && games.length === 0 ? (
        <section className="panel stack">
          <h2>No games yet</h2>
          <p className="panel-copy">
            Once you add rows in games and game_players, they will appear here.
          </p>
        </section>
      ) : null}

      {!errorMessage && !isLoading && games.length > 0 ? (
        <section className="games-grid">
          {games.map((game) => {
            const isYourTurn = normalizeId(game.currentTurnPlayerId) === normalizeId(user?.id);

            return (
              <article key={game.id} className="panel game-card">
                <div className="card-head">
                  <span className={`status-chip status-chip--${game.status}`}>{game.status}</span>
                  <strong>#{String(game.id).slice(0, 8)}</strong>
                </div>

                <div className="meta-row">
                  <span>Turn</span>
                  <strong>{isYourTurn ? "Your turn" : "Waiting"}</strong>
                </div>
                <div className="meta-row">
                  <span>Last move</span>
                  <strong>{formatDateTime(game.lastMoveAt || game.createdAt)}</strong>
                </div>
                <div className="meta-row">
                  <span>Your score</span>
                  <strong>{game.score}</strong>
                </div>
                <div className="meta-row">
                  <span>Player slot</span>
                  <strong>{game.playerNumber ?? "-"}</strong>
                </div>
                <div className="meta-row">
                  <span>Rack tiles</span>
                  <strong>{game.rack.length}</strong>
                </div>
                <div className="meta-row">
                  <span>Rule options</span>
                  <strong>{getRuleCount(game.rules)}</strong>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onOpenGame?.(game.id)}
                >
                  Open game
                </button>
              </article>
            );
          })}
        </section>
      ) : null}

      <button type="button" className="fab-button" onClick={openCreateModal}>
        + New game
      </button>

      {isCreateModalOpen ? (
        <div className="modal-backdrop" onClick={closeCreateModal}>
          <section
            className="panel modal-panel stack"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-game-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <p className="eyebrow">create game</p>
              <h2 id="create-game-title">Start a new match</h2>
              <p className="panel-copy">Enter your friend&apos;s username.</p>
            </div>

            <form className="stack" onSubmit={handleCreateGame}>
              <label htmlFor="opponent-username">Opponent username</label>
              <input
                id="opponent-username"
                name="opponentUsername"
                value={opponentUsername}
                autoComplete="nickname"
                onChange={(event) => {
                  setOpponentUsername(event.target.value);
                  if (createErrorMessage) {
                    setCreateErrorMessage("");
                  }
                }}
                placeholder="ex: friend_name"
                disabled={isCreatingGame}
              />

              {createErrorMessage ? <p className="error-text">{createErrorMessage}</p> : null}

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={closeCreateModal}
                  disabled={isCreatingGame}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingGame}>
                  {isCreatingGame ? "Creating..." : "Create game"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default GamesPage;
