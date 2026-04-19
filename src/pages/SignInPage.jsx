import { useState } from "react";
import { useAuth } from "../context/authContext";
import { validateUsername } from "../services/authService";

function SignInPage() {
  const { signIn, clearAuthError } = useAuth();
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateUsername(username);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      clearAuthError();
      await signIn(username);
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page page--centered">
      <section className="panel auth-panel">
        <p className="eyebrow">qat cafe</p>
        <h1>Sign in</h1>
        <p className="panel-copy">Enter a username to continue. No password needed.</p>

        <form className="stack" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="nickname"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (errorMessage) {
                setErrorMessage("");
              }
            }}
            placeholder="ex: staub"
            disabled={isSubmitting}
          />

          {errorMessage ? (
            <p role="alert" className="error-text">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default SignInPage;
