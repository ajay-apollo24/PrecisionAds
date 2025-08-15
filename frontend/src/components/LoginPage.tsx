import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Selector, SelectorOption } from './ui/selector';
import { useAuth } from '../App';
import { toast } from './ui/sonner';
import { Building2, Mail, Lock } from 'lucide-react';
import { authService, Organization } from '../services/auth.service';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoadingOrgs(true);
        const orgs = await authService.getOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        console.error('Failed to load organizations:', error);
        toast.error('Failed to load organizations');
      } finally {
        setLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login({
        email,
        password,
        organizationId: selectedOrg
      });

      if (response.success && response.user) {
        login(response.user);
        toast.success('Login successful');
      } else {
        toast.error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (userType: 'admin' | 'advertiser' | 'publisher') => {
    const demoCredentials = {
      admin: { email: 'admin@adtech.com', password: 'admin123', orgId: '1' },
      advertiser: { email: 'advertiser@digital.com', password: 'advertiser123', orgId: '2' },
      publisher: { email: 'publisher@brand.com', password: 'publisher123', orgId: '3' }
    };

    const creds = demoCredentials[userType];
    setEmail(creds.email);
    setPassword(creds.password);
    setSelectedOrg(creds.orgId);
  };

  // Convert organizations to selector options
  const organizationOptions: SelectorOption[] = organizations.map(org => ({
    value: org.id,
    label: org.name,
    disabled: false
  }));

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
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Selector
                    value={selectedOrg}
                    onValueChange={setSelectedOrg}
                    options={organizationOptions}
                    placeholder={loadingOrgs ? "Loading organizations..." : "Select your organization"}
                    disabled={loadingOrgs}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || loadingOrgs}>
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
                  disabled={loadingOrgs}
                >
                  Demo Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials('advertiser')}
                  disabled={loadingOrgs}
                >
                  Demo Advertiser
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials('publisher')}
                  disabled={loadingOrgs}
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