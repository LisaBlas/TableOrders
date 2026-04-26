import { Component, type ReactNode } from "react";
import { S } from "../styles/appStyles";

interface Props {
  children: ReactNode;
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              gap: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "14px", color: "#666" }}>Something went wrong in this view.</div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 600,
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        );
      }

      return (
        <div style={S.root}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              padding: "20px",
              textAlign: "center",
              gap: "20px",
            }}
          >
            <div style={{ fontSize: "48px" }}>⚠️</div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>Something went wrong</div>
            <div style={{ fontSize: "14px", color: "#666", maxWidth: "400px" }}>
              The app encountered an unexpected error. Please reload the page to continue.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: 600,
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
