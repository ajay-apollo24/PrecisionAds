import React, { useState } from 'react';
import { useAuth } from '../App';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { AdvertiserDashboard } from './dashboards/AdvertiserDashboard';
import { PublisherDashboard } from './dashboards/PublisherDashboard';
import { DataMetricsDashboard } from './dashboards/DataMetricsDashboard';
import { AuthManagementDashboard } from './dashboards/AuthManagementDashboard';
import { RealTimeDashboard } from './dashboards/RealTimeDashboard';
import { OrganizationManagement } from './admin/OrganizationManagement';
import { UserManagement } from './admin/UserManagement';
import { APIKeysManagement } from './admin/APIKeysManagement';
import { Sidebar } from './ui/sidebar';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogOut, User, Settings, BarChart3, Shield, Activity, Building2, Users, Key } from 'lucide-react';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('main');

  // Debug logging for user role
  console.log('🔍 DashboardLayout - User Role Debug:', {
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    } : 'no user',
    role: user?.role,
    roleType: typeof user?.role
  });

  const renderMainDashboard = () => {
    switch (user?.role) {
      case 'super_admin':
      case 'admin':
        return <AdminDashboard />;
      case 'advertiser':
        return <AdvertiserDashboard />;
      case 'publisher':
        return <PublisherDashboard />;
      default:
        return <div>Unknown role: {user?.role || 'undefined'}</div>;
    }
  };

  const getDashboardTabs = () => {
    switch (user?.role) {
      case 'super_admin':
      case 'admin':
        return [
          { value: 'main', label: 'Main Dashboard', icon: BarChart3 },
          { value: 'organizations', label: 'Organizations', icon: Building2 },
          { value: 'users', label: 'Users', icon: Users },
          { value: 'api-keys', label: 'API Keys', icon: Key },
          { value: 'metrics', label: 'Data Metrics', icon: BarChart3 },
          { value: 'auth', label: 'Auth Management', icon: Shield },
          { value: 'realtime', label: 'Real-time Data', icon: Activity }
        ];
      case 'advertiser':
        return [
          { value: 'main', label: 'Campaign Dashboard', icon: BarChart3 },
          { value: 'realtime', label: 'Real-time Data', icon: Activity }
        ];
      case 'publisher':
        return [
          { value: 'main', label: 'Publisher Dashboard', icon: BarChart3 },
          { value: 'realtime', label: 'Real-time Data', icon: Activity }
        ];
      default:
        return [];
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'main':
        return renderMainDashboard();
      case 'metrics':
        return <DataMetricsDashboard />;
      case 'auth':
        return <AuthManagementDashboard />;
      case 'realtime':
        return <RealTimeDashboard />;
      case 'organizations':
        return <OrganizationManagement />;
      case 'users':
        return <UserManagement />;
      case 'api-keys':
        return <APIKeysManagement />;
      case 'campaigns':
        return <div>Campaigns Screen - Coming Soon</div>;
      case 'analytics':
        return <div>Analytics Screen - Coming Soon</div>;
      case 'audiences':
        return <div>Audiences Screen - Coming Soon</div>;
      case 'sites':
        return <div>Sites Screen - Coming Soon</div>;
      case 'ad-units':
        return <div>Ad Units Screen - Coming Soon</div>;
      case 'earnings':
        return <div>Earnings Screen - Coming Soon</div>;
      case 'settings':
        return <div>Settings Screen - Coming Soon</div>;
      default:
        return renderMainDashboard();
    }
  };

  //const dashboardTabs = getDashboardTabs();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">PrecisionAds</h1>
                <p className="text-sm text-muted-foreground">
                  {user?.organizationName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Navigation Tabs - Only show for main dashboard views */}
        
     {/*   {dashboardTabs.length > 1 && activeTab === 'main' && (
          <div className="border-b border-border px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                {dashboardTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}*/}
        

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

// Placeholder screen components for additional navigation items
function OrganizationsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p className="text-muted-foreground">Manage organization settings and configurations</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Organizations Management</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function UsersScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function APIKeysScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">Manage API keys and access tokens</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">API Key Management</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function CampaignsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground">Manage advertising campaigns and performance</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Management</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">View campaign performance and insights</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function AudiencesScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audiences</h1>
        <p className="text-muted-foreground">Manage target audiences and segments</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Audience Management</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function SitesScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sites</h1>
        <p className="text-muted-foreground">Manage publisher sites and domains</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Site Management</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function AdUnitsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ad Units</h1>
        <p className="text-muted-foreground">Configure and manage ad units</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ad Unit Management</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function EarningsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">Track revenue and performance metrics</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Earnings Dashboard</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure account and system settings</p>
      </div>
      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Panel</h3>
        <p className="text-gray-500">This screen will be implemented with backend integration</p>
      </div>
    </div>
  );
} 