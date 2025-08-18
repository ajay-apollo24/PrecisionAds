import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { advertiserService, Audience } from '../../services/advertiser.service';
import { Plus, Users, Target } from 'lucide-react';

interface AudiencesViewProps {
  organizationId: string;
}

export function AudiencesView({ organizationId }: AudiencesViewProps) {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadAudiences();
  }, []);

  const loadAudiences = async () => {
    try {
      setLoading(true);
      const response = await advertiserService.getAudiences({});
      setAudiences(response.data || []);
    } catch (error) {
      console.error('Failed to load audiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAudienceSize = (size?: number) => {
    if (!size) return 'N/A';
    if (size >= 1000000) {
      return (size / 1000000).toFixed(1) + 'M';
    } else if (size >= 1000) {
      return (size / 1000).toFixed(1) + 'K';
    }
    return size.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading audiences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audience Management</h1>
          <p className="text-muted-foreground">
            Manage target audiences and segments for your campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Audience
        </Button>
      </div>

      {/* Audience Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audiences</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audiences.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAudienceSize(audiences.reduce((sum, a) => sum + (a.size || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined audience size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(audiences.map(a => a.campaignId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Campaigns with audiences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audiences Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audiences</CardTitle>
          <CardDescription>
            {audiences.length} audiences found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audiences found. Create your first audience to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audiences.map((audience) => (
                  <TableRow key={audience.id}>
                    <TableCell className="font-medium">{audience.name}</TableCell>
                    <TableCell>
                      {audience.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      {audience.campaign?.name || 'Unknown Campaign'}
                    </TableCell>
                    <TableCell>
                      {formatAudienceSize(audience.size)}
                    </TableCell>
                    <TableCell>{formatDate(audience.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Audience Form Placeholder */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Audience</CardTitle>
            <CardDescription>
              Define targeting criteria for your audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Audience Creation</h3>
              <p className="text-gray-500 mb-4">
                This form will be implemented with demographic and behavioral targeting options
              </p>
              <Button onClick={() => setShowCreateForm(false)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 