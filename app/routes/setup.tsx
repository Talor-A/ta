import type { Route } from "./+types/setup";
import { createAuth } from "../../lib/auth";
import { user } from "../../database/schema";
import { count } from "drizzle-orm";

export async function loader({ context, request }: Route.LoaderArgs) {
  const auth = createAuth(context.db);
  
  try {
    // Check if any users exist
    const userCount = await context.db
      .select({ count: count() })
      .from(user)
      .get();
    
    if (userCount && userCount.count > 0) {
      return Response.json({ 
        success: false, 
        message: "User already exists. Setup not needed.",
        userCount: userCount.count
      });
    }
    
    // Create the admin user using better-auth's signUp method
    const result = await auth.api.signUpEmail({
      body: {
        email: "mail@taloranderson.com",
        password: "admin123", // You should change this after first login
        name: "Talor"
      }
    });
    
    if (result) {
      return Response.json({ 
        success: true, 
        message: "Admin user created successfully! Please change your password after first login.",
        email: "mail@taloranderson.com",
        temporaryPassword: "admin123"
      });
    } else {
      return Response.json({ 
        success: false, 
        message: "Failed to create user"
      });
    }
    
  } catch (error: any) {
    console.error("Setup error:", error);
    return Response.json({ 
      success: false, 
      message: "Error during setup: " + (error.message || error),
      error: error.message
    });
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Setup - Talor Anderson" },
    {
      name: "description",
      content: "Initial setup for blog authentication",
    },
  ];
}

export default function Setup({ loaderData }: Route.ComponentProps) {
  return (
    <main style={{ maxWidth: '600px', margin: '80px auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Blog Setup</h1>
        <p style={{ color: '#666' }}>
          Initial authentication setup for your personal blog
        </p>
      </div>

      <div style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        {loaderData.success ? (
          <div>
            <h2 style={{ color: '#28a745', marginTop: 0 }}>✅ Setup Complete!</h2>
            <p><strong>Message:</strong> {loaderData.message}</p>
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '4px'
            }}>
              <p><strong>Login Credentials:</strong></p>
              <p>Email: <code>{loaderData.email}</code></p>
              <p>Temporary Password: <code>{loaderData.temporaryPassword}</code></p>
              <p style={{ fontSize: '14px', color: '#856404', marginTop: '10px' }}>
                ⚠️ Please change your password after first login for security
              </p>
            </div>
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <a 
                href="/login"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#007acc',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                Go to Login →
              </a>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ color: '#dc3545', marginTop: 0 }}>❌ Setup Not Needed</h2>
            <p><strong>Message:</strong> {loaderData.message}</p>
            {loaderData.userCount !== undefined && (
              <p>Current user count: {loaderData.userCount}</p>
            )}
            {loaderData.error && (
              <div style={{ 
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <strong>Error Details:</strong> {loaderData.error}
              </div>
            )}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <a 
                href="/login"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px'
                }}
              >
                Go to Login →
              </a>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Home
        </a>
      </div>
    </main>
  );
}