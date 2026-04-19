import { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/authContext";
import GamePage from "./pages/GamePage";
import GamesPage from "./pages/GamesPage";
import SignInPage from "./pages/SignInPage";

function AppShell() {
  const { user, isInitializing, authError, clearAuthError } = useAuth();
  const [activeGameId, setActiveGameId] = useState("");

  useEffect(() => {
    if (!user) {
      setActiveGameId("");
    }
  }, [user]);

  if (isInitializing) {
    return (
      <main className="page page--centered">
        <section className="panel">
          <p className="eyebrow">qat cafe</p>
          <h1>Loading...</h1>
          <p className="panel-copy">Checking your local session.</p>
        </section>
      </main>
    );
  }

  return (
    <>
      {authError ? (
        <div className="top-alert" role="alert">
          <span>{authError}</span>
          <button type="button" className="link-button" onClick={clearAuthError}>
            Dismiss
          </button>
        </div>
      ) : null}
      {user && activeGameId ? (
        <GamePage gameId={activeGameId} onBack={() => setActiveGameId("")} />
      ) : null}
      {user && !activeGameId ? (
        <GamesPage onOpenGame={(gameId) => setActiveGameId(String(gameId))} />
      ) : null}
      {!user ? <SignInPage /> : null}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
