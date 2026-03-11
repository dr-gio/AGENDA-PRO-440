import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-main flex items-center justify-center p-6">
          <div className="bg-navy-card p-8 rounded-3xl border border-border-subtle shadow-2xl max-w-md text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-4 tracking-tight">Algo salió mal</h2>
            <p className="text-text-secondary mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            <pre className="text-[10px] bg-navy-deep p-4 rounded-xl overflow-auto text-left mb-6 max-h-40 text-text-secondary border border-border-subtle">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-accent-blue text-white rounded-xl font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent-blue/20"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
