import { useEffect, useState } from "react";
import type { Route } from "./+types/logout";
import { authClient } from "../lib/auth-client";
import styles from "./logout.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Logout - Talor Anderson" },
    {
      name: "description",
      content: "Sign out of your blog account",
    },
  ];
}

export default function Logout() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await authClient.signOut();
        setIsLoggedOut(true);

        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } catch (err: any) {
        setError(err.message || "Logout failed");
      } finally {
        setIsLoggingOut(false);
      }
    };

    handleLogout();
  }, []);

  const handleManualLogout = async () => {
    setIsLoggingOut(true);
    setError("");

    try {
      await authClient.signOut();
      setIsLoggedOut(true);

      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="page">
      <div className="center mb-2">
        <h1>Sign Out</h1>
      </div>

      <div className={styles.card}>
        {isLoggingOut ? (
          <div>
            <div className={styles.spinner} />
            <p>Signing you out...</p>
          </div>
        ) : isLoggedOut ? (
          <div>
            <div className={styles.icon}>✅</div>
            <h2>Signed Out Successfully</h2>
            <p className="dimmer mb-1">
              You have been signed out of your account.
            </p>
            <p className="dimmer" style={{ fontSize: "14px" }}>
              Redirecting to home page...
            </p>
          </div>
        ) : error ? (
          <div>
            <div className={styles.icon}>❌</div>
            <h2>Logout Failed</h2>
            <div className="error mb-1">{error}</div>
            <button onClick={handleManualLogout} className={styles.danger}>
              Try Again
            </button>
          </div>
        ) : null}
      </div>

      <div className="center mt-2">
        <a href="/" className="dimmer" style={{ fontSize: "14px" }}>
          ← Back to Home
        </a>
      </div>
    </main>
  );
}
