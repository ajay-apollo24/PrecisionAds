import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Globe, Plus, Edit, Trash2, Eye, Settings } from 'lucide-react';
import { publisherService, PublisherSite, CreateSiteData, UpdateSiteData } from '../../services/publisher.service';

interface SiteFormData {
  name: string;
  domain: string;
  settings: Record<string, any>;
}

export function SiteManagement() {
  const [sites, setSites] = useState<PublisherSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<PublisherSite | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    domain: '',
    settings: {}
  });

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const sitesData = await publisherService.getSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSite) {
        await publisherService.updateSite(editingSite.id, formData);
      } else {
        await publisherService.createSite(formData);
      }
      
      setShowForm(false);
      setEditingSite(null);
      setFormData({ name: '', domain: '', settings: {} });
      await loadSites();
    } catch (error) {
      console.error('Failed to save site:', error);
    }
  };

  const handleEdit = (site: PublisherSite) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      domain: site.domain,
      settings: site.settings || {}
    });
    setShowForm(true);
  };

  const handleDelete = async (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await publisherService.deleteSite(siteId);
        await loadSites();
      } catch (error) {
        console.error('Failed to delete site:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'INACTIVE': return 'bg-gray-500';
      case 'SUSPENDED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Management</h2>
          <p className="text-muted-foreground">
            Manage your publisher sites and domains
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Site
        </Button>
      </div>

      {/* Add/Edit Site Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSite ? 'Edit Site' : 'Add New Site'}</CardTitle>
            <CardDescription>
              {editingSite ? 'Update your site information' : 'Create a new publisher site'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Site Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome Site"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingSite ? 'Update Site' : 'Create Site'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSite(null);
                    setFormData({ name: '', domain: '', settings: {} });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sites List */}
      <div className="grid gap-4">
        {sites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first publisher site
              </p>
              <Button onClick={() => setShowForm(true)}>
                Add Your First Site
              </Button>
            </CardContent>
          </Card>
        ) : (
          sites.map((site) => (
            <Card key={site.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{site.name}</h3>
                      <Badge className={getStatusColor(site.status)}>
                        {site.status}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{site.domain}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created: {formatDate(site.createdAt)}</span>
                      <span>Ad Units: {site.adUnits.length}</span>
                      <span>Last Updated: {formatDate(site.updatedAt)}</span>
                    </div>

                    {/* Quick Stats */}
                    {site.earnings.length > 0 && (
                      <div className="mt-4 flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Revenue (7d): </span>
                          <span className="font-medium">${site.earnings.reduce((sum, e) => sum + e.revenue, 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impressions (7d): </span>
                          <span className="font-medium">{site.earnings.reduce((sum, e) => sum + e.impressions, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(site)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(site.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 