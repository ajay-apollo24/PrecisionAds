import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Selector } from '../ui/selector';
import { Target, Plus, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { publisherService, AdUnit, CreateAdUnitData, UpdateAdUnitData } from '../../services/publisher.service';

interface AdUnitFormData {
  name: string;
  size: string;
  format: 'BANNER' | 'VIDEO' | 'NATIVE' | 'DISPLAY' | 'INTERSTITIAL';
  settings: Record<string, any>;
}

interface AdUnitManagementProps {
  siteId: string;
  siteName: string;
}

export function AdUnitManagement({ siteId, siteName }: AdUnitManagementProps) {
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdUnit, setEditingAdUnit] = useState<AdUnit | null>(null);
  const [formData, setFormData] = useState<AdUnitFormData>({
    name: '',
    size: '',
    format: 'BANNER',
    settings: {}
  });

  useEffect(() => {
    loadAdUnits();
  }, [siteId]);

  const loadAdUnits = async () => {
    try {
      setLoading(true);
      const adUnitsData = await publisherService.getAdUnits(siteId);
      setAdUnits(adUnitsData);
    } catch (error) {
      console.error('Failed to load ad units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAdUnit) {
        await publisherService.updateAdUnit(editingAdUnit.id, formData);
      } else {
        await publisherService.createAdUnit(siteId, formData);
      }
      
      setShowForm(false);
      setEditingAdUnit(null);
      setFormData({ name: '', size: '', format: 'BANNER', settings: {} });
      await loadAdUnits();
    } catch (error) {
      console.error('Failed to save ad unit:', error);
    }
  };

  const handleEdit = (adUnit: AdUnit) => {
    setEditingAdUnit(adUnit);
    setFormData({
      name: adUnit.name,
      size: adUnit.size,
      format: adUnit.format,
      settings: adUnit.settings || {}
    });
    setShowForm(true);
  };

  const handleDelete = async (adUnitId: string) => {
    if (window.confirm('Are you sure you want to delete this ad unit?')) {
      try {
        await publisherService.deleteAdUnit(adUnitId);
        await loadAdUnits();
      } catch (error) {
        console.error('Failed to delete ad unit:', error);
      }
    }
  };

  const copyAdUnitCode = (adUnit: AdUnit) => {
    const code = `<div id="ad-unit-${adUnit.id}" data-site="${siteId}" data-unit="${adUnit.id}"></div>
<script src="/ad-script.js"></script>`;
    
    navigator.clipboard.writeText(code).then(() => {
      // You could add a toast notification here
      console.log('Ad unit code copied to clipboard');
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'INACTIVE': return 'bg-gray-500';
      case 'TESTING': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'BANNER': return '📱';
      case 'VIDEO': return '🎥';
      case 'NATIVE': return '📄';
      case 'DISPLAY': return '🖼️';
      case 'INTERSTITIAL': return '🔲';
      default: return '📱';
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
          <h2 className="text-2xl font-bold">Ad Unit Management</h2>
          <p className="text-muted-foreground">
            Manage ad units for {siteName}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Ad Unit
        </Button>
      </div>

      {/* Add/Edit Ad Unit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAdUnit ? 'Edit Ad Unit' : 'Add New Ad Unit'}</CardTitle>
            <CardDescription>
              {editingAdUnit ? 'Update your ad unit configuration' : 'Create a new ad unit for this site'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ad Unit Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Header Banner"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="728x90"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="format">Format</Label>
                <Selector
                  value={formData.format}
                  onValueChange={(value: string) => 
                    setFormData({ ...formData, format: value as 'BANNER' | 'VIDEO' | 'NATIVE' | 'DISPLAY' | 'INTERSTITIAL' })
                  }
                  options={[
                    { value: 'BANNER', label: 'Banner' },
                    { value: 'VIDEO', label: 'Video' },
                    { value: 'NATIVE', label: 'Native' },
                    { value: 'DISPLAY', label: 'Display' },
                    { value: 'INTERSTITIAL', label: 'Interstitial' }
                  ]}
                  placeholder="Select format"
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingAdUnit ? 'Update Ad Unit' : 'Create Ad Unit'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAdUnit(null);
                    setFormData({ name: '', size: '', format: 'BANNER', settings: {} });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ad Units List */}
      <div className="grid gap-4">
        {adUnits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ad units yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first ad unit to this site
              </p>
              <Button onClick={() => setShowForm(true)}>
                Add Your First Ad Unit
              </Button>
            </CardContent>
          </Card>
        ) : (
          adUnits.map((adUnit) => (
            <Card key={adUnit.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getFormatIcon(adUnit.format)}</span>
                      <h3 className="text-lg font-semibold">{adUnit.name}</h3>
                      <Badge className={getStatusColor(adUnit.status)}>
                        {adUnit.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>Size: {adUnit.size}</span>
                      <span>Format: {adUnit.format}</span>
                      <span>Created: {formatDate(adUnit.createdAt)}</span>
                    </div>

                    {/* Ad Unit Code Preview */}
                    <div className="bg-muted p-3 rounded-md text-sm font-mono">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Implementation Code:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyAdUnitCode(adUnit)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <code className="text-xs">
                        {`<div id="ad-unit-${adUnit.id}" data-site="${siteId}" data-unit="${adUnit.id}"></div>`}
                      </code>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(adUnit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyAdUnitCode(adUnit)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(adUnit.id)}
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