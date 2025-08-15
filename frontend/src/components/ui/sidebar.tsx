import React from 'react';
import { useAuth } from '../../App';
import { cn } from '../../lib/utils';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Key, 
  Target, 
  TrendingUp, 
  Globe, 
  Settings,
  X,
  Shield,
  Activity,
  PieChart,
  UserCheck,
  Eye,
  DollarSign
} from 'lucide-react';
import { Button } from './button';

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ open, onOpenChange, activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { 
            icon: BarChart3, 
            label: 'Main Dashboard', 
            tab: 'main',
            description: 'Overview and key metrics'
          },
          { 
            icon: PieChart, 
            label: 'Data Metrics', 
            tab: 'metrics',
            description: 'Organizations, users, and revenue data'
          },
          { 
            icon: Shield, 
            label: 'Auth Management', 
            tab: 'auth',
            description: 'Users, API keys, and permissions'
          },
          { 
            icon: Activity, 
            label: 'Real-time Data', 
            tab: 'realtime',
            description: 'Live performance and alerts'
          },
          { 
            icon: Building2, 
            label: 'Organizations', 
            tab: 'organizations',
            description: 'Manage organization settings'
          },
          { 
            icon: Users, 
            label: 'Users', 
            tab: 'users',
            description: 'User management and roles'
          },
          { 
            icon: Key, 
            label: 'API Keys', 
            tab: 'api-keys',
            description: 'API key management'
          },
          { 
            icon: Settings, 
            label: 'Settings', 
            tab: 'settings',
            description: 'System configuration'
          },
        ];
      case 'advertiser':
        return [
          { 
            icon: BarChart3, 
            label: 'Dashboard', 
            tab: 'main',
            description: 'Campaign overview and performance'
          },
          { 
            icon: Target, 
            label: 'Campaigns', 
            tab: 'campaigns',
            description: 'Manage advertising campaigns'
          },
          { 
            icon: TrendingUp, 
            label: 'Analytics', 
            tab: 'analytics',
            description: 'Performance insights and reports'
          },
          { 
            icon: UserCheck, 
            label: 'Audiences', 
            tab: 'audiences',
            description: 'Target audience management'
          },
          { 
            icon: Activity, 
            label: 'Real-time Data', 
            tab: 'realtime',
            description: 'Live campaign metrics'
          },
          { 
            icon: Settings, 
            label: 'Settings', 
            tab: 'settings',
            description: 'Account and campaign settings'
          },
        ];
      case 'publisher':
        return [
          { 
            icon: BarChart3, 
            label: 'Dashboard', 
            tab: 'main',
            description: 'Publisher overview and earnings'
          },
          { 
            icon: Globe, 
            label: 'Sites', 
            tab: 'sites',
            description: 'Manage publisher sites'
          },
          { 
            icon: Target, 
            label: 'Ad Units', 
            tab: 'ad-units',
            description: 'Ad unit configuration'
          },
          { 
            icon: DollarSign, 
            label: 'Earnings', 
            tab: 'earnings',
            description: 'Revenue and performance tracking'
          },
          { 
            icon: Activity, 
            label: 'Real-time Data', 
            tab: 'realtime',
            description: 'Live performance metrics'
          },
          { 
            icon: Settings, 
            label: 'Settings', 
            tab: 'settings',
            description: 'Account and site settings'
          },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleMenuItemClick = (tab: string) => {
    onTabChange(tab);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onOpenChange(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.tab}>
                  <button
                    onClick={() => handleMenuItemClick(item.tab)}
                    className={cn(
                      "w-full flex items-start space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors text-left",
                      activeTab === item.tab
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 mt-0.5 flex-shrink-0",
                      activeTab === item.tab ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <span className="block font-medium">{item.label}</span>
                      <span className={cn(
                        "block text-xs mt-0.5",
                        activeTab === item.tab ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Role: {user?.role}
              </p>
              <p className="flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                {user?.organizationName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 