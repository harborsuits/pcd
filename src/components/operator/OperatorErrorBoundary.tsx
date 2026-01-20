import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  info: React.ErrorInfo | null;
}

export class OperatorErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error) {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[OperatorErrorBoundary] crash:", error);
    console.error("[OperatorErrorBoundary] component stack:", info?.componentStack);
    this.setState({ error, info });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-red-600 mb-2">Operator UI crashed</h1>
        <p className="text-muted-foreground mb-4">
          Open console for the full error + component stack.
        </p>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
          {String(error?.message || error)}
          {"\n\n"}
          {info?.componentStack || ""}
        </pre>
        <button
          onClick={() => this.setState({ error: null, info: null })}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }
}
