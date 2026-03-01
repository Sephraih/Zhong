import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

// Error boundary for the entire app
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: "100vh", 
          backgroundColor: "#000", 
          color: "#fff", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif"
        }}>
          <div style={{ 
            backgroundColor: "#1a1a1a", 
            border: "1px solid #333", 
            borderRadius: "1rem", 
            padding: "2rem", 
            maxWidth: "500px", 
            textAlign: "center" 
          }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>⚠️ Something went wrong</h1>
            <p style={{ color: "#888", marginBottom: "1rem" }}>
              The app encountered an error. This may happen in sandboxed environments.
            </p>
            <pre style={{ 
              backgroundColor: "#0a0a0a", 
              padding: "1rem", 
              borderRadius: "0.5rem", 
              fontSize: "0.75rem", 
              overflow: "auto", 
              textAlign: "left",
              color: "#f87171",
              maxHeight: "200px"
            }}>
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer"
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  // Fallback if root element doesn't exist
  document.body.innerHTML = `
    <div style="min-height:100vh;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-family:system-ui">
      <p>Failed to find root element</p>
    </div>
  `;
}
