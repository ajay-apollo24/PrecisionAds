import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Selector } from "../ui/selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import {
  Key,
  Plus,
  Search,
  Filter,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  User,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { dashboardService } from "../../services/dashboard.service";
import { apiService } from "../../services/api.service";
import { useAuth } from "../../App";

interface APIKey {
  id: string;
  name: string;
  keyHash: string;
  status: string;
  permissions: string[];
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

interface APIKeyFormData {
  name: string;
  permissions: string[];
  expiresAt?: string;
  organizationId: string;
  userId: string;
}

const AVAILABLE_PERMISSIONS = [
  "READ_ORGANIZATIONS",
  "WRITE_ORGANIZATIONS",
  "READ_USERS",
  "WRITE_USERS",
  "READ_API_KEYS",
  "WRITE_API_KEYS",
  "READ_ANALYTICS",
  "WRITE_ANALYTICS",
  "READ_CAMPAIGNS",
  "WRITE_CAMPAIGNS",
  "READ_PUBLISHERS",
  "WRITE_PUBLISHERS",
  "READ_AD_SERVING",
  "WRITE_AD_SERVING",
];

export function APIKeysManagement() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [formData, setFormData] = useState<APIKeyFormData>({
    name: "",
    permissions: [],
    expiresAt: "",
    organizationId: "",
    userId: "",
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter API keys when search or filters change
  useEffect(() => {
    filterAPIKeys();
  }, [apiKeys, searchTerm, statusFilter, orgFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [keysData, orgsData, usersData] = await Promise.all([
        dashboardService.getAPIKeys(),
        dashboardService.getOrganizations(),
        dashboardService.getUsers(),
      ]);
      setApiKeys(keysData);
      setOrganizations(orgsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAPIKeys = () => {
    let filtered = apiKeys;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (key) =>
          key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          key.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          key.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((key) => key.status === statusFilter);
    }

    // Apply organization filter
    if (orgFilter !== "all") {
      filtered = filtered.filter((key) => key.organizationId === orgFilter);
    }

    setFilteredApiKeys(filtered);
  };

  const handleCreateAPIKey = async () => {
    try {
      const response = await apiService.post<any>('/api/v1/admin/api-keys', formData);

      if (response.success) {
        // Show the generated API key
        setGeneratedKey(response.data.key);
        setShowGeneratedKey(true);

        // Reload API keys to get the fresh data
        await loadData();
        setShowCreateForm(false);
        resetForm();
      } else {
        throw new Error(response.error || "Failed to create API key");
      }
    } catch (error: any) {
      console.error("Failed to create API key:", error);
      alert(`Error creating API key: ${error.message}`);
    }
  };

  const handleUpdateAPIKey = async () => {
    if (!editingKey) return;

    try {
      const response = await apiService.put<any>(`/api/v1/admin/api-keys/${editingKey.id}`, formData);

      if (response.success) {
        // Reload API keys to get the fresh data
        await loadData();
        setEditingKey(null);
        resetForm();
      } else {
        throw new Error(response.error || "Failed to update API key");
      }
    } catch (error: any) {
      console.error("Failed to update API key:", error);
      alert(`Error updating API key: ${error.message}`);
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await apiService.delete<any>(`/api/v1/admin/api-keys/${keyId}`);

      if (response.success) {
        // Reload API keys to get the fresh data
        await loadData();
      } else {
        throw new Error(response.error || "Failed to delete API key");
      }
    } catch (error: any) {
      console.error("Failed to delete API key:", error);
      alert(`Error deleting API key: ${error.message}`);
    }
  };

  const handleTogglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      permissions: [],
      expiresAt: "",
      organizationId: user?.role === 'super_admin' ? "" : user?.organizationId || "",
      userId: "",
    });
  };

  const startEdit = (key: APIKey) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      permissions: key.permissions,
      expiresAt: key.expiresAt || "",
      organizationId: key.organizationId,
      userId: key.userId,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "INACTIVE":
        return "bg-gray-500";
      case "EXPIRED":
        return "bg-red-500";
      case "REVOKED":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys Management</h1>
          <p className="text-muted-foreground">
            Manage API keys, permissions, and access control
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Generate API Key</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total API Keys
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">Generated keys</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.filter((key) => key.status === "ACTIVE").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Keys</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.filter((key) => isExpired(key.expiresAt)).length}
            </div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(apiKeys.map((key) => key.organizationId)).size}
            </div>
            <p className="text-xs text-muted-foreground">With API access</p>
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
                  placeholder="Search API keys by name, user, or organization..."
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
                { value: "all", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "EXPIRED", label: "Expired" },
                { value: "REVOKED", label: "Revoked" },
              ]}
              placeholder="Filter by status"
              className="w-[150px]"
            />

            <Selector
              value={orgFilter}
              onValueChange={setOrgFilter}
              options={[
                { value: "all", label: "All Organizations" },
                ...organizations.map((org) => ({
                  value: org.id,
                  label: org.name,
                })),
              ]}
              placeholder="Filter by organization"
              className="w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            {filteredApiKeys.length} of {apiKeys.length} API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API Key</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{key.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {key.keyHash}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{key.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="max-w-[150px] truncate">
                        {key.organizationName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.slice(0, 3).map((permission) => (
                        <Badge
                          key={permission}
                          variant="secondary"
                          className="text-xs"
                        >
                          {permission.replace("_", " ")}
                        </Badge>
                      ))}
                      {key.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{key.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(key.status)} text-white`}
                    >
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatLastUsed(key.lastUsedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.expiresAt ? (
                      <div
                        className={`flex items-center space-x-1 ${
                          isExpired(key.expiresAt) ? "text-red-600" : ""
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(key.expiresAt)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(key)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAPIKey(key.id)}
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

      {/* Create/Edit API Key Modal */}
      {(showCreateForm || editingKey) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingKey ? "Edit API Key" : "Generate New API Key"}
              </CardTitle>
              <CardDescription>
                {editingKey
                  ? "Update API key settings and permissions"
                  : "Create a new API key with specific permissions"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">API Key Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Production API Key, Development Key"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Selector
                    value={formData.organizationId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        organizationId: value,
                      }))
                    }
                    options={
                      // Super admins can see all organizations, regular admins only their own
                      user?.role === 'super_admin' 
                        ? organizations.map((org) => ({
                            value: org.id,
                            label: org.name,
                          }))
                        : organizations
                            .filter(org => org.id === user?.organizationId)
                            .map((org) => ({
                              value: org.id,
                              label: org.name,
                            }))
                    }
                    placeholder="Select organization"
                    disabled={user?.role !== 'super_admin'} // Disable for regular admins
                  />
                </div>

                <div>
                  <Label htmlFor="user">User</Label>
                  <Selector
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, userId: value }))
                    }
                    options={users
                      .filter(
                        (user) =>
                          user.organizationId === formData.organizationId
                      )
                      .map((user) => ({
                        value: user.id,
                        label: `${user.firstName} ${user.lastName}`,
                      }))}
                    placeholder="Select user"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiresAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center space-x-2"
                    >
                      <Switch
                        id={permission}
                        checked={formData.permissions.includes(permission)}
                        onCheckedChange={() =>
                          handleTogglePermission(permission)
                        }
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission.replace(/_/g, " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={editingKey ? handleUpdateAPIKey : handleCreateAPIKey}
                  className="flex-1"
                >
                  {editingKey ? "Update" : "Generate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingKey(null);
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

      {/* Generated API Key Modal */}
      {showGeneratedKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white border border-gray-200 shadow-2xl">
            <CardHeader>
              <CardTitle>API Key Generated Successfully!</CardTitle>
              <CardDescription>
                Copy this key now. You won't be able to see it again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="font-mono text-sm break-all">
                  {generatedKey}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowGeneratedKey(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
