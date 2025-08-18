import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Selector } from '../ui/selector';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../App';
import { advertiserService } from '../../services/advertiser.service';
import { 
  User, 
  Bell, 
  Shield, 
  Download, 
  Upload, 
  Save, 
  Eye, 
  EyeOff,
  Key,
  Target,
  BarChart3,
  Users
} from 'lucide-react';

interface UserSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  timezone: string;
  language: string;
}

interface CampaignPreferences {
  defaultBidStrategy: string;
  defaultBudgetType: string;
  defaultDailyBudget: number;
  autoOptimization: boolean;
  performanceThresholds: {
    minCTR: number;
    maxCPC: number;
    minConversionRate: number;
  };
}

interface NotificationSettings {
  email: {
    campaignUpdates: boolean;
    performanceAlerts: boolean;
    budgetWarnings: boolean;
    weeklyReports: boolean;
  };
  push: {
    realTimeAlerts: boolean;
    milestoneAchievements: boolean;
    systemMaintenance: boolean;
  };
  sms: {
    criticalAlerts: boolean;
    budgetExceeded: boolean;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  apiKeyRotation: boolean;
}

export function SettingsView() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || 'demo-org';
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [userSettings, setUserSettings] = useState<UserSettings>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [campaignPreferences, setCampaignPreferences] = useState<CampaignPreferences>({
    defaultBidStrategy: 'TARGET_CPC',
    defaultBudgetType: 'DAILY',
    defaultDailyBudget: 100,
    autoOptimization: true,
    performanceThresholds: {
      minCTR: 1.0,
      maxCPC: 2.0,
      minConversionRate: 2.0
    }
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      campaignUpdates: true,
      performanceAlerts: true,
      budgetWarnings: true,
      weeklyReports: true
    },
    push: {
      realTimeAlerts: true,
      milestoneAchievements: true,
      systemMaintenance: false
    },
    sms: {
      criticalAlerts: false,
      budgetExceeded: true
    }
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    ipWhitelist: [],
    apiKeyRotation: true
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await advertiserService.updateUserProfile(
        user?.id || '',
        {
          name: `${userSettings.firstName} ${userSettings.lastName}`,
          timezone: userSettings.timezone,
          language: userSettings.language
        },
        organizationId
      );
      console.log('Profile settings saved:', response);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCampaignPreferences = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Campaign preferences saved:', campaignPreferences);
    } catch (error) {
      console.error('Failed to save campaign preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Notification settings saved:', notificationSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Security settings saved:', securitySettings);
    } catch (error) {
      console.error('Failed to save security settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportData = async (type: 'campaigns' | 'analytics' | 'audiences') => {
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Exporting ${type} data...`);
      // In real implementation, this would trigger a download
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and security
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={userSettings.firstName}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={userSettings.lastName}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last Name"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={userSettings.email}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                    type="email"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone (Optional)</label>
                  <Input
                    value={userSettings.phone}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <Selector
                    value={userSettings.timezone}
                    onValueChange={(value) => setUserSettings(prev => ({ ...prev, timezone: value }))}
                    options={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'America/New_York', label: 'Eastern Time' },
                      { value: 'America/Chicago', label: 'Central Time' },
                      { value: 'America/Denver', label: 'Mountain Time' },
                      { value: 'America/Los_Angeles', label: 'Pacific Time' },
                      { value: 'Europe/London', label: 'London' },
                      { value: 'Europe/Paris', label: 'Paris' },
                      { value: 'Asia/Tokyo', label: 'Tokyo' }
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Selector
                    value={userSettings.language}
                    onValueChange={(value) => setUserSettings(prev => ({ ...prev, language: value }))}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                      { value: 'ja', label: 'Japanese' }
                    ]}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                  />
                </div>
              </div>

              <Button onClick={handlePasswordChange} disabled={saving}>
                <Key className="h-4 w-4 mr-2" />
                {saving ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign Preferences */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Defaults</CardTitle>
              <CardDescription>
                Set default preferences for new campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Default Bid Strategy</label>
                  <Selector
                    value={campaignPreferences.defaultBidStrategy}
                    onValueChange={(value) => setCampaignPreferences(prev => ({ ...prev, defaultBidStrategy: value }))}
                    options={[
                      { value: 'TARGET_CPC', label: 'Target CPC' },
                      { value: 'TARGET_CPM', label: 'Target CPM' },
                      { value: 'TARGET_CPA', label: 'Target CPA' },
                      { value: 'MANUAL', label: 'Manual Bidding' }
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Default Budget Type</label>
                  <Selector
                    value={campaignPreferences.defaultBudgetType}
                    onValueChange={(value) => setCampaignPreferences(prev => ({ ...prev, defaultBudgetType: value }))}
                    options={[
                      { value: 'DAILY', label: 'Daily Budget' },
                      { value: 'LIFETIME', label: 'Lifetime Budget' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Default Daily Budget ($)</label>
                <Input
                  type="number"
                  value={campaignPreferences.defaultDailyBudget}
                  onChange={(e) => setCampaignPreferences(prev => ({ ...prev, defaultDailyBudget: Number(e.target.value) }))}
                  placeholder="100"
                  min="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={campaignPreferences.autoOptimization}
                  onCheckedChange={(checked) => setCampaignPreferences(prev => ({ ...prev, autoOptimization: checked }))}
                />
                <label className="text-sm font-medium">Enable Auto-Optimization</label>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Performance Thresholds</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Minimum CTR (%)</label>
                    <Input
                      type="number"
                      value={campaignPreferences.performanceThresholds.minCTR}
                      onChange={(e) => setCampaignPreferences(prev => ({
                        ...prev,
                        performanceThresholds: { ...prev.performanceThresholds, minCTR: Number(e.target.value) }
                      }))}
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Maximum CPC ($)</label>
                    <Input
                      type="number"
                      value={campaignPreferences.performanceThresholds.maxCPC}
                      onChange={(e) => setCampaignPreferences(prev => ({
                        ...prev,
                        performanceThresholds: { ...prev.performanceThresholds, maxCPC: Number(e.target.value) }
                      }))}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minimum Conversion Rate (%)</label>
                    <Input
                      type="number"
                      value={campaignPreferences.performanceThresholds.minConversionRate}
                      onChange={(e) => setCampaignPreferences(prev => ({
                        ...prev,
                        performanceThresholds: { ...prev.performanceThresholds, minConversionRate: Number(e.target.value) }
                      }))}
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveCampaignPreferences} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Campaign Updates</label>
                    <p className="text-xs text-muted-foreground">Status changes, budget alerts</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email.campaignUpdates}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, campaignUpdates: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Performance Alerts</label>
                    <p className="text-xs text-muted-foreground">CTR drops, budget issues</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email.performanceAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, performanceAlerts: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Budget Warnings</label>
                    <p className="text-xs text-muted-foreground">80% budget utilization</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email.budgetWarnings}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, budgetWarnings: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Weekly Reports</label>
                    <p className="text-xs text-muted-foreground">Performance summaries</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, weeklyReports: checked }
                    }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Configure in-app and browser notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Real-time Alerts</label>
                    <p className="text-xs text-muted-foreground">Live performance updates</p>
                  </div>
                  <Switch
                    checked={notificationSettings.push.realTimeAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      push: { ...prev.push, realTimeAlerts: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Milestone Achievements</label>
                    <p className="text-xs text-muted-foreground">Goal completions</p>
                  </div>
                  <Switch
                    checked={notificationSettings.push.milestoneAchievements}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      push: { ...prev.push, milestoneAchievements: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">System Maintenance</label>
                    <p className="text-xs text-muted-foreground">Platform updates</p>
                  </div>
                  <Switch
                    checked={notificationSettings.push.systemMaintenance}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      push: { ...prev.push, systemMaintenance: checked }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Preferences</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Two-Factor Authentication</label>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Session Timeout (minutes)</label>
                <Selector
                  value={securitySettings.sessionTimeout.toString()}
                  onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: Number(value) }))}
                  options={[
                    { value: '15', label: '15 minutes' },
                    { value: '30', label: '30 minutes' },
                    { value: '60', label: '1 hour' },
                    { value: '120', label: '2 hours' },
                    { value: '480', label: '8 hours' }
                  ]}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">API Key Rotation</label>
                  <p className="text-xs text-muted-foreground">Automatically rotate API keys</p>
                </div>
                <Switch
                  checked={securitySettings.apiKeyRotation}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, apiKeyRotation: checked }))}
                />
              </div>

              <Button onClick={handleSaveSecurity} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export your campaign data and analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">Campaign Data</h4>
                  <p className="text-sm text-muted-foreground mb-3">Export campaign performance data</p>
                  <Button 
                    onClick={() => exportData('campaigns')} 
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">Analytics Reports</h4>
                  <p className="text-sm text-muted-foreground mb-3">Performance metrics and insights</p>
                  <Button 
                    onClick={() => exportData('analytics')} 
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">Audience Data</h4>
                  <p className="text-sm text-muted-foreground mb-3">Target audience information</p>
                  <Button 
                    onClick={() => exportData('audiences')} 
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Import</CardTitle>
              <CardDescription>
                Import campaign data from external sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import Data</h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop CSV files or click to browse
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  Supports CSV, Excel, and JSON formats
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 