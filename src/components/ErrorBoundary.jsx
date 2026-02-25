import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Catches React render errors and shows a fallback UI instead of a blank screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-content">
            <AlertTriangle size={48} className="error-boundary-icon" />
            <h2>Something went wrong</h2>
            <p>We&apos;ve hit an unexpected error. Try refreshing the page.</p>
            <button className="btn btn-primary" onClick={this.handleRetry}>
              <RefreshCw size={18} /> Try again
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre className="error-boundary-stack">{this.state.error.toString()}</pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
