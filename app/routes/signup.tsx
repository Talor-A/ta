import type { Route } from "./+types/signup";
import { auth } from "../lib/auth";
import { Form, useActionData } from "react-router";

export async function loader({ context }: Route.LoaderArgs) {
  // Check if any users exist
  const hasUser = await context.db.query.user.findFirst();
  return { hasExistingUser: !!hasUser };
}

export async function action({ request, context }: Route.ActionArgs) {
  console.log("📝 Signup action started");

  // Check if any users exist first
  console.log("🔍 Checking if users exist in database...");
  const hasUser = await context.db.query.user.findFirst();
  console.log("✅ Database query completed. Has existing user:", !!hasUser);

  if (hasUser) {
    console.log("❌ Registration blocked - user already exists");
    return {
      success: false,
      error: "Registration is disabled. A user already exists in the system.",
    };
  }

  console.log("📋 Parsing form data...");
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  console.log("📋 Form data parsed:", {
    email,
    name,
    passwordLength: password?.length,
  });

  if (!email || !password || !name) {
    console.log("❌ Missing required fields");
    return {
      success: false,
      error: "All fields are required.",
    };
  }

  try {
    console.log("🔐 Calling Better Auth signup...");
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });
    console.log("✅ Better Auth signup completed:", !!result);

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
      <main className="page">
        <div className="center mb-2">
          <h1>Registration Disabled</h1>
          <p className="dimmer">
            Registration is not available. A user already exists in the system.
          </p>
        </div>
        <div className="center">
          <a href="/login" className="btn">
            Sign In Instead
          </a>
        </div>
      </main>
    );
  }

  if (actionData?.success) {
    return (
      <main className="page">
        <div className="center mb-2">
          <h1>✅ Account Created!</h1>
          <p className="dimmer">{actionData.message}</p>
        </div>
        <div className="center">
          <a href="/login" className="btn">
            Sign In Now
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="center mb-2">
        <h1>Create Account</h1>
        <p className="dimmer">Sign up for your personal blog</p>
      </div>

      <Form method="post">
        <div className="mb-1">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" required />
        </div>

        <div className="mb-1">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>

        <div className="mb-2">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" required />
        </div>

        {actionData?.error && (
          <div className="error mb-1">{actionData.error}</div>
        )}

        <button type="submit">Create Account</button>
      </Form>

      <div className="center mt-1">
        <p>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </main>
  );
}
