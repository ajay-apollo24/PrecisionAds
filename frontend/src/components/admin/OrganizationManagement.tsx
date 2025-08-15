import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Selector } from '../ui/selector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  Globe,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { apiService } from '../../services/api.service';
import { useAuth } from '../../App';

interface Organization {
  id: string;
  name: string;
  orgType: string;
  status: string;
  domain?: string;
  createdAt: string;
  userCount?: number;
  revenue?: number;
  settings?: any;
}

interface OrganizationFormData {
  name: string;
  orgType: string;
  domain: string;
  status: string;
}

export function OrganizationManagement() {
  const { user } = useAuth();
  
  // RBAC: Only SUPER_ADMIN can access this component
  const canManageOrganizations = user?.role === 'super_admin';
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgTypeFilter, setOrgTypeFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    orgType: 'ADVERTISER',
    domain: '',
    status: 'ACTIVE'
  });

  // Load organizations on component mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Filter organizations when search or filters change
  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchTerm, statusFilter, orgTypeFilter]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = organizations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.domain?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    // Apply org type filter
    if (orgTypeFilter !== 'all') {
      filtered = filtered.filter(org => org.orgType === orgTypeFilter);
    }

    setFilteredOrganizations(filtered);
  };

  const handleCreateOrganization = async () => {
    try {
      const response = await apiService.post<any>('/api/v1/admin/organizations', formData);
      
      if (response.success) {
        // Reload organizations to get the fresh data
        await loadOrganizations();
        setShowCreateForm(false);
        resetForm();
      } else {
        throw new Error(response.error || 'Failed to create organization');
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      alert(`Error creating organization: ${error.message}`);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return;

    try {
      const response = await apiService.put<any>(`/api/v1/admin/organizations/${editingOrg.id}`, formData);
      
      if (response.success) {
        // Reload organizations to get the fresh data
        await loadOrganizations();
        setEditingOrg(null);
        resetForm();
      } else {
        throw new Error(response.error || 'Failed to update organization');
      }
    } catch (error: any) {
      console.error('Failed to update organization:', error);
      alert(`Error updating organization: ${error.message}`);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;

    try {
      const response = await apiService.delete<any>(`/api/v1/admin/organizations/${orgId}`);
      
      if (response.success) {
        // Reload organizations to get the fresh data
        await loadOrganizations();
      } else {
        throw new Error(response.error || 'Failed to delete organization');
      }
    } catch (error: any) {
      console.error('Failed to delete organization:', error);
      alert(`Error deleting organization: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      orgType: 'ADVERTISER',
      domain: '',
      status: 'ACTIVE'
    });
  };

  const startEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      orgType: org.orgType,
      domain: org.domain || '',
      status: org.status
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'INACTIVE': return 'bg-gray-500';
      case 'SUSPENDED': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getOrgTypeColor = (type: string) => {
    switch (type) {
      case 'ADVERTISER': return 'bg-blue-500';
      case 'PUBLISHER': return 'bg-green-500';
      case 'AGENCY': return 'bg-purple-500';
      case 'NETWORK': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // RBAC: Prevent non-super-admin users from accessing this component
  if (!canManageOrganizations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to manage organizations.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage platform organizations and their settings
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Organization</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">
              Active platform organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(org => org.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + (org.userCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${organizations.reduce((sum, org) => sum + (org.revenue || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Selector 
              value={statusFilter} 
              onValueChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' },
                { value: 'PENDING', label: 'Pending' }
              ]}
              placeholder="Filter by status"
              className="w-[180px]"
            />

            <Selector 
              value={orgTypeFilter} 
              onValueChange={setOrgTypeFilter}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'ADVERTISER', label: 'Advertiser' },
                { value: 'PUBLISHER', label: 'Publisher' },
                { value: 'AGENCY', label: 'Agency' },
                { value: 'NETWORK', label: 'Network' }
              ]}
              placeholder="Filter by type"
              className="w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            {filteredOrganizations.length} of {organizations.length} organizations
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
                <TableHead>Revenue</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        {org.domain && (
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {org.domain}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getOrgTypeColor(org.orgType)} text-white`}>
                      {org.orgType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(org.status)} text-white`}>
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{org.userCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${(org.revenue || 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(org.createdAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(org)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrganization(org.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Organization Modal */}
      {(showCreateForm || editingOrg) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white border border-gray-200 shadow-2xl">
            <CardHeader>
              <CardTitle>
                {editingOrg ? 'Edit Organization' : 'Create Organization'}
              </CardTitle>
              <CardDescription>
                {editingOrg ? 'Update organization details' : 'Add a new organization to the platform'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <Label htmlFor="orgType">Organization Type</Label>
                <Selector
                  value={formData.orgType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, orgType: value }))}
                  options={[
                    { value: 'ADVERTISER', label: 'Advertiser' },
                    { value: 'PUBLISHER', label: 'Publisher' },
                    { value: 'AGENCY', label: 'Agency' },
                    { value: 'NETWORK', label: 'Network' }
                  ]}
                  placeholder="Select organization type"
                />
              </div>

              <div>
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="example.com"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Selector
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'SUSPENDED', label: 'Suspended' },
                    { value: 'PENDING', label: 'Pending' }
                  ]}
                  placeholder="Select status"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={editingOrg ? handleUpdateOrganization : handleCreateOrganization}
                  className="flex-1"
                >
                  {editingOrg ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingOrg(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}