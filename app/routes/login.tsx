import { useState } from "react";
import type { Route } from "./+types/login";
import { authClient } from "../lib/auth-client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - Talor Anderson" },
    {
      name: "description",
      content: "Sign in to manage blog posts",
    },
  ];
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting login...");
      const result = await authClient.signIn.email({
        email,
        password,
      });

      console.log("Login result:", result);

      if (result.error) {
        console.log("❌ Login failed:", result.error);
        setError(result.error.message || "Authentication failed");
        return;
      }

      if (result.data) {
        console.log("✅ Login successful");
        window.location.href = "/blog";
      } else {
        console.log("❌ Login failed - no data returned");
        setError("Authentication failed");
      }
    } catch (err: any) {
      console.log("💥 Login error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="center mb-2">
        <h1>Sign In</h1>
        <p className="dimmer">Sign in to manage your blog</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-1">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-1">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error mb-1">{error}</div>}

        <button type="submit" disabled={isLoading} className="mb-2">
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="center">
        <p>
          Need an account? <a href="/signup">Sign up</a>
        </p>
        <a href="/" className="dimmer">
          ← Back to Home
        </a>
      </div>
    </main>
  );
}
