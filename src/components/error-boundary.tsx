'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Une erreur s\'est produite :', error);
    console.error('[ErrorBoundary] Détails du composant :', errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-6 bg-[#0A0F1E] rounded-xl border border-white/10">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-50 mb-2">
              Oups, quelque chose s&apos;est mal passé
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Une erreur inattendue s&apos;est produite dans ce composant. Veuillez réessayer.
            </p>
            {this.state.error && (
              <p className="text-xs text-slate-500 mb-4 font-mono bg-white/5 rounded-lg px-3 py-2 overflow-auto max-h-24">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20 hover:bg-[#D4A843]/20 transition-colors text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
