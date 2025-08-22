import React from 'react';
import { Header } from './Header';
import { Breadcrumb } from '../common/Breadcrumb';

interface LayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  listName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, showBreadcrumbs = true, listName }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showBreadcrumbs && (
          <div className="mb-6">
            <Breadcrumb listName={listName} />
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
