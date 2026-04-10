// ErrorBoundary — łapie błędy renderowania w drzewie komponentów
// Zapobiega "białemu ekranowi śmierci" gdy jedna strona crash-uje
//
// Użycie w App.jsx:
//   <ErrorBoundary>
//     <Routes>...</Routes>
//   </ErrorBoundary>

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[CRA] Błąd renderowania:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Coś poszło nie tak</h1>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          Wystąpił nieoczekiwany błąd w tej sekcji. Pozostałe części systemu działają normalnie.
        </p>
        <div className="flex gap-3">
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition"
          >
            Spróbuj ponownie
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-5 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            Wróć na stronę główną
          </button>
        </div>
        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-6 text-left text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 max-w-2xl overflow-auto">
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    );
  }
}
