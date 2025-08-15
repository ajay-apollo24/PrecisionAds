import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Shield, 
  Key, 
  Users, 
  Building2, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  permissions: string[];
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  organization: string;
  permissions: string[];
  status: 'active' | 'expired' | 'revoked';
  lastUsed: string;
  expiresAt: string;
}

interface Organization {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'pending' | 'suspended';
  userCount: number;
  apiKeyCount: number;
  lastActivity: string;
}

export function AuthManagementDashboard() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Admin',
      email: 'admin@adtech.com',
      role: 'SUPER_ADMIN',
      organization: 'AdTech Solutions',
      status: 'active',
      lastLogin: '2 minutes ago',
      permissions: ['ORG_CREATE', 'USER_MANAGE', 'API_KEY_MANAGE', 'SYSTEM_ACCESS']
    },
    {
      id: '2',
      name: 'Sarah Manager',
      email: 'sarah@digital.com',
      role: 'ADMIN',
      organization: 'Digital Marketing Co',
      status: 'active',
      lastLogin: '15 minutes ago',
      permissions: ['USER_MANAGE', 'API_KEY_MANAGE', 'ORG_READ']
    },
    {
      id: '3',
      name: 'Mike Publisher',
      email: 'mike@brand.com',
      role: 'PUBLISHER',
      organization: 'Brand Publishers LLC',
      status: 'active',
      lastLogin: '1 hour ago',
      permissions: ['SITE_MANAGE', 'AD_UNIT_MANAGE', 'EARNINGS_READ']
    }
  ]);

  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'pk_live_1234567890abcdef',
      organization: 'AdTech Solutions',
      permissions: ['CAMPAIGN_READ', 'ANALYTICS_READ'],
      status: 'active',
      lastUsed: '5 minutes ago',
      expiresAt: '2025-12-31'
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'pk_test_abcdef1234567890',
      organization: 'Digital Marketing Co',
      permissions: ['CAMPAIGN_READ', 'CAMPAIGN_WRITE'],
      status: 'active',
      lastUsed: '2 hours ago',
      expiresAt: '2025-06-30'
    }
  ]);

  const [organizations, setOrganizations] = useState<Organization[]>([
    {
      id: '1',
      name: 'AdTech Solutions',
      type: 'AGENCY',
      status: 'active',
      userCount: 45,
      apiKeyCount: 12,
      lastActivity: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Digital Marketing Co',
      type: 'ADVERTISER',
      status: 'active',
      userCount: 23,
      apiKeyCount: 8,
      lastActivity: '15 minutes ago'
    },
    {
      id: '3',
      name: 'Brand Publishers LLC',
      type: 'PUBLISHER',
      status: 'pending',
      userCount: 8,
      apiKeyCount: 3,
      lastActivity: '1 hour ago'
    }
  ]);

  const [authStatus, setAuthStatus] = useState({
    tokenValidation: 'working',
    rbac: 'enabled',
    orgContext: 'validated',
    sessionManagement: 'active'
  });

  const [recentAuthEvents, setRecentAuthEvents] = useState([
    {
      id: '1',
      type: 'LOGIN_SUCCESS',
      user: 'admin@adtech.com',
      organization: 'AdTech Solutions',
      timestamp: '2 minutes ago',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: '2',
      type: 'PERMISSION_DENIED',
      user: 'user@example.com',
      organization: 'Unknown',
      timestamp: '5 minutes ago',
      ip: '10.0.0.50',
      status: 'denied'
    },
    {
      id: '3',
      type: 'API_KEY_USED',
      user: 'Production API Key',
      organization: 'AdTech Solutions',
      timestamp: '8 minutes ago',
      ip: '203.0.113.0',
      status: 'success'
    }
  ]);

  // Simulate real-time auth monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentAuthEvents(prev => [
        {
          id: Date.now().toString(),
          type: 'LOGIN_SUCCESS',
          user: 'user@example.com',
          organization: 'Digital Marketing Co',
          timestamp: 'Just now',
          ip: '192.168.1.' + Math.floor(Math.random() * 255),
          status: 'success'
        },
        ...prev.slice(0, 9)
      ]);
    }, 15000); // Add new event every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEventStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication & Authorization</h1>
          <p className="text-muted-foreground">
            Manage user access, permissions, and security settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Level: High
          </Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Validation</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Working</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All tokens validated successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RBAC System</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Enabled</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Role-based access control active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Org Context</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Validated</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Organization context verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              89 active sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="monitoring">Auth Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Input placeholder="Search users..." className="w-64" />
                  <Button variant="outline">Search</Button>
                </div>
                <Button>Add New User</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.organization}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {user.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Suspend</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apikeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Manage API keys and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Input placeholder="Search API keys..." className="w-64" />
                  <Button variant="outline">Search</Button>
                </div>
                <Button>Generate New Key</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">
                            {key.key.substring(0, 12)}...
                          </span>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{key.organization}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(key.status)}</TableCell>
                      <TableCell>{key.lastUsed}</TableCell>
                      <TableCell>{key.expiresAt}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Revoke</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>
                Manage organizations and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>API Keys</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(org.status)}</TableCell>
                      <TableCell>{org.userCount}</TableCell>
                      <TableCell>{org.apiKeyCount}</TableCell>
                      <TableCell>{org.lastActivity}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Suspend</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Monitoring</CardTitle>
              <CardDescription>
                Real-time monitoring of authentication events and security alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">156</div>
                  <p className="text-sm text-muted-foreground">Successful Logins</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Last Hour
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <p className="text-sm text-muted-foreground">Failed Attempts</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Last Hour
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Current
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">12</div>
                  <p className="text-sm text-muted-foreground">API Calls</p>
                  <Badge variant="outline" className="mt-2">
                    <Activity className="h-3 w-3 mr-1" />
                    Last 5 Min
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Authentication Events</h3>
                <div className="space-y-2">
                  {recentAuthEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {getEventStatusIcon(event.status)}
                      <div className="flex-1">
                        <p className="font-medium">{event.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.user} • {event.organization} • {event.ip}
                        </p>
                      </div>
                      <Badge variant="outline">{event.timestamp}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-semibold">Security Alert</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Multiple failed login attempts detected from IP 203.0.113.0. 
                  Consider implementing rate limiting or blocking this IP address.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">Block IP</Button>
                  <Button variant="outline" size="sm">Investigate</Button>
                  <Button variant="outline" size="sm">Dismiss</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 