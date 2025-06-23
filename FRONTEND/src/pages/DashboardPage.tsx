
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import TopNavigation from '@/components/layout/TopNavigation';
import AppSidebar from '@/components/layout/AppSidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={user.role} />
        <div className="flex-1 flex flex-col">
          <TopNavigation user={user} onLogout={logout} />
          <main className="flex-1 overflow-y-auto bg-gray-50/50">
            <DashboardContent user={user} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardPage;
