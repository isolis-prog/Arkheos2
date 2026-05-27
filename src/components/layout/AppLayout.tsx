import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { RootErrorBoundary } from '@/components/errors/RootErrorBoundary';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-60 transition-all duration-300">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="container py-3 flex items-center justify-end">
            <GlobalSearch />
          </div>
        </header>
        <div className="container py-6">
          <RootErrorBoundary>
            <Outlet />
          </RootErrorBoundary>
        </div>
      </main>
    </div>
  );
};
