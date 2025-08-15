import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Selector, SelectorOption } from './ui/selector';
import { useAuth } from '../App';
import { toast } from './ui/sonner';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { authService, Organization } from '../services/auth.service';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [error, setError] = useState('');

  // Load organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoadingOrgs(true);
        setError('');
        const orgs = await authService.getOrganizations();
        setOrganizations(orgs);
        
        if (orgs.length === 0) {
          setError('No organizations available. Please contact your administrator.');
        }
      } catch (error) {
        console.error('Failed to load organizations:', error);
        setError('Failed to load organizations. Please check your connection.');
      } finally {
        setLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!selectedOrg) {
        setError('Please select an organization');
        return;
      }

      const response = await authService.login({
        email,
        password,
        organizationId: selectedOrg
      });

      if (response.success && response.user) {
        login(response.user);
        toast.success('Login successful');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loadingOrgs || loading}
                    className="pl-9"
                    error={!!error && !selectedOrg}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || loadingOrgs}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700">
                If you don't have an account or need assistance, please contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}