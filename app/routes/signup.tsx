import type { Route } from "./+types/signup";
import { auth } from "../lib/auth";
import { Form, useActionData } from "react-router";

export async function loader({ context }: Route.LoaderArgs) {
  // Check if any users exist
  const hasUser = await context.db.query.user.findFirst();
  return { hasExistingUser: !!hasUser };
}

export async function action({ request, context }: Route.ActionArgs) {
  // Check if any users exist first
  const hasUser = await context.db.query.user.findFirst();

  if (hasUser) {
    return {
      success: false,
      error: "Registration is disabled. A user already exists in the system.",
    };
  }

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return {
      success: false,
      error: "All fields are required.",
    };
  }

  try {
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    if (result) {
      return {
        success: true,
        message: "Account created successfully! You can now sign in.",
      };
    } else {
      return {
        success: false,
        error: "Failed to create account. Please try again.",
      };
    }
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "An error occurred during registration. Please try again.",
    };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - Talor Anderson" },
    {
      name: "description",
      content: "Create your account",
    },
  ];
}

export default function Signup({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();

  if (loaderData.hasExistingUser) {
    return (
      <main style={{ maxWidth: "400px", margin: "80px auto", padding: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1>Registration Disabled</h1>
          <p style={{ color: "#666" }}>
            Registration is not available. A user already exists in the system.
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <a
            href="/login"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#007acc",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            Sign In Instead
          </a>
        </div>
      </main>
    );
  }

  if (actionData?.success) {
    return (
      <main style={{ maxWidth: "400px", margin: "80px auto", padding: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#28a745" }}>✅ Account Created!</h1>
          <p style={{ color: "#666" }}>{actionData.message}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <a
            href="/login"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#007acc",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            Sign In Now
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "400px", margin: "80px auto", padding: "20px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>Create Account</h1>
        <p style={{ color: "#666" }}>Sign up for your personal blog</p>
      </div>

      <Form method="post">
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="name"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
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
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
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

        <div style={{ marginBottom: "30px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
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

        {actionData?.error && (
          <div
            style={{
              padding: "10px",
              marginBottom: "20px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              color: "#721c24",
            }}
          >
            {actionData.error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Create Account
        </button>
      </Form>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#007acc" }}>
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
