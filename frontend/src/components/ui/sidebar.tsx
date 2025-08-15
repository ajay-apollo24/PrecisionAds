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
  X
} from 'lucide-react';
import { Button } from './button';

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const { user } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '#dashboard' },
          { icon: Building2, label: 'Organizations', href: '#organizations' },
          { icon: Users, label: 'Users', href: '#users' },
          { icon: Key, label: 'API Keys', href: '#api-keys' },
          { icon: Settings, label: 'Settings', href: '#settings' },
        ];
      case 'advertiser':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '#dashboard' },
          { icon: Target, label: 'Campaigns', href: '#campaigns' },
          { icon: TrendingUp, label: 'Analytics', href: '#analytics' },
          { icon: Users, label: 'Audiences', href: '#audiences' },
          { icon: Settings, label: 'Settings', href: '#settings' },
        ];
      case 'publisher':
        return [
          { icon: BarChart3, label: 'Dashboard', href: '#dashboard' },
          { icon: Globe, label: 'Sites', href: '#sites' },
          { icon: Target, label: 'Ad Units', href: '#ad-units' },
          { icon: TrendingUp, label: 'Earnings', href: '#earnings' },
          { icon: Settings, label: 'Settings', href: '#settings' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

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
            <h2 className="text-lg font-semibold">Menu</h2>
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
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <p>Role: {user?.role}</p>
              <p>Org: {user?.organizationName}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 