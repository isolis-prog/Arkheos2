import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { correlationContext } from '@/lib/infrastructure/correlation';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

interface ErrorBoundaryProps {
  children: ReactNode;
  moduleKey: string;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { moduleKey } = this.props;
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${moduleKey}]`, error, errorInfo);

    try {
      await supabase.from('audit_events').insert({
        tenant_id: TENANT_ID,
        module_key: moduleKey,
        entity_type: 'ui_render',
        entity_id: null,
        action: 'CLIENT_ERROR' as any,
        actor_id: null,
        correlation_id: correlationContext.get(),
        summary: `Render error in ${moduleKey}: ${error.message}`,
        before_state: null,
        after_state: null,
        diff: null,
        metadata: {
          severity: 'high',
          name: error.name,
          message: error.message,
          stack: error.stack?.slice(0, 4000) ?? null,
          component_stack: errorInfo.componentStack?.slice(0, 4000) ?? null,
          url: typeof window !== 'undefined' ? window.location.href : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        } as any,
      });
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Failed to record audit event:', logErr);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;
    const { moduleKey, fallbackTitle } = this.props;

    return (
      <div className="flex items-center justify-center p-6 min-h-[60vh]">
        <Card className="max-w-xl w-full border-destructive/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl">{fallbackTitle ?? 'Something went wrong'}</CardTitle>
                <CardDescription>
                  Module: <span className="font-mono">{moduleKey}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm font-mono break-words text-muted-foreground">
              {error?.message ?? 'Unknown error'}
            </div>
            <p className="text-sm text-muted-foreground">
              The error has been logged. You can try reloading this page or return to the dashboard.
            </p>
            <div className="flex gap-2">
              <Button onClick={this.handleReload} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload page
              </Button>
              <Button onClick={this.handleGoToDashboard} variant="outline">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Go to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
