import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("Chunk load error:", error.message, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <AlertCircle size={40} style={{ color: "var(--accent-magenta, #ef4444)" }} />
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
            Falha ao carregar a página
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              maxWidth: 400,
            }}
          >
            Não foi possível carregar este módulo. Pode ser um problema de rede temporário. Tente
            novamente.
          </p>
          <button
            onClick={this.handleRetry}
            className="dash-btn dash-btn--primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
