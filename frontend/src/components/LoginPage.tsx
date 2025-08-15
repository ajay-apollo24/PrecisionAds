import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth, User } from '../App';
import { toast } from './ui/sonner';
import { Building2, Mail, Lock } from 'lucide-react';

// Mock data for organizations and users
const mockOrganizations = [
  { id: '1', name: 'AdTech Solutions Inc' },
  { id: '2', name: 'Digital Marketing Co' },
  { id: '3', name: 'Brand Publishers LLC' },
];

const mockUsers = [
  {
    id: '1',
    email: 'admin@adtech.com',
    password: 'admin123',
    name: 'John Admin',
    role: 'admin' as const,
    organizationId: '1',
  },
  {
    id: '2',
    email: 'advertiser@digital.com',
    password: 'advertiser123',
    name: 'Sarah Advertiser',
    role: 'advertiser' as const,
    organizationId: '2',
  },
  {
    id: '3',
    email: 'publisher@brand.com',
    password: 'publisher123',
    name: 'Mike Publisher',
    role: 'publisher' as const,
    organizationId: '3',
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        toast.error('Invalid credentials');
        return;
      }

      if (!selectedOrg) {
        toast.error('Please select an organization');
        return;
      }

      const organization = mockOrganizations.find(org => org.id === selectedOrg);
      
      const userData: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: selectedOrg,
        organizationName: organization?.name || '',
      };

      login(userData);
      toast.success('Login successful');
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (userType: 'admin' | 'advertiser' | 'publisher') => {
    const demoUser = mockUsers.find(u => u.role === userType);
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword(demoUser.password);
      setSelectedOrg(demoUser.organizationId);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">PrecisionAds</h1>
          <p className="text-muted-foreground">
            Sign in to your advertising platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select your organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockOrganizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Demo Accounts:
              </p>
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials('admin')}
                >
                  Demo Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials('advertiser')}
                >
                  Demo Advertiser
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials('publisher')}
                >
                  Demo Publisher
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}