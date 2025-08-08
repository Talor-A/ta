import { useEffect, useState } from "react";
import type { Route } from "./+types/logout";
import { authClient } from "../auth-client";

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
    <main style={{ maxWidth: '400px', margin: '80px auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Sign Out</h1>
      </div>

      <div style={{
        padding: '30px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center'
      }}>
        {isLoggingOut ? (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007acc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p>Signing you out...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : isLoggedOut ? (
          <div>
            <div style={{
              fontSize: '48px',
              color: '#28a745',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h2 style={{ color: '#28a745', marginTop: 0 }}>Signed Out Successfully</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              You have been signed out of your account.
            </p>
            <p style={{ fontSize: '14px', color: '#999' }}>
              Redirecting to home page...
            </p>
          </div>
        ) : error ? (
          <div>
            <div style={{
              fontSize: '48px',
              color: '#dc3545',
              marginBottom: '20px'
            }}>
              ❌
            </div>
            <h2 style={{ color: '#dc3545', marginTop: 0 }}>Logout Failed</h2>
            <div style={{
              color: '#dc3545',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
            <button
              onClick={handleManualLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Home
        </a>
      </div>
    </main>
  );
}