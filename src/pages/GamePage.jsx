import { useAuth } from "../context/authContext";

function GamePage({ gameId, onBack }) {
  const { user } = useAuth();

  return (
    <main className="page">
      <header className="panel game-screen-header">
        <div>
          <p className="eyebrow">game room</p>
          <h1>Game #{String(gameId).slice(0, 8)}</h1>
          <p className="panel-copy">Signed in as {user?.username}</p>
        </div>
        <button type="button" className="ghost-button" onClick={onBack}>
          Back to games
        </button>
      </header>

      <section className="panel game-screen-body">
        <h2>Board coming next</h2>
        <p className="panel-copy">
          This page is intentionally empty for now, but the game has been created in Supabase.
        </p>
      </section>
    </main>
  );
}

export default GamePage;
