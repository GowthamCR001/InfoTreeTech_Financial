import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout({
  children,
  currentTab,
  onSelectTab,
  title,
  subtitle,
  onAddCredit,
  onAddDebit,
  onOpenConfigModal,
  onOpenSetupGuide,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onOpenSetupGuide={onOpenSetupGuide}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 w-full lg:pl-64 overflow-x-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onAddCredit={onAddCredit}
          onAddDebit={onAddDebit}
          onOpenConfigModal={onOpenConfigModal}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-safe">
          {children}
        </main>
      </div>
    </div>
  );
}
