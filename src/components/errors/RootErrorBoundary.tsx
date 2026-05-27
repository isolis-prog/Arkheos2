import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface RootErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Top-level error boundary. Catches any uncaught render error
 * that escapes module-level boundaries so the entire app does
 * not white-screen.
 */
export const RootErrorBoundary = ({ children }: RootErrorBoundaryProps) => (
  <ErrorBoundary moduleKey="root" fallbackTitle="Application error">
    {children}
  </ErrorBoundary>
);

export default RootErrorBoundary;
