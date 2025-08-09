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
    <main style={{ maxWidth: "400px", margin: "80px auto", padding: "20px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>Sign In</h1>
        <p style={{ color: "#666" }}>Sign in to manage your blog</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              color: "#dc3545",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: isLoading ? "#ccc" : "#007acc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: isLoading ? "not-allowed" : "pointer",
            marginBottom: "30px",
          }}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div style={{ textAlign: "center" }}>
        <p>
          Need an account?{" "}
          <a href="/signup" style={{ color: "#007acc" }}>
            Sign up
          </a>
        </p>
        <a
          href="/"
          style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}
        >
          ← Back to Home
        </a>
      </div>
    </main>
  );
}
