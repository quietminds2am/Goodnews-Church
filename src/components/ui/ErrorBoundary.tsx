import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches rendering errors so one broken page never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-ink-500">
            An unexpected error occurred. Please refresh the page — if the problem continues, contact the church
            office.
          </p>
          <button className="btn-primary mt-6" onClick={() => window.location.assign("/")}>
            Go to Homepage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
