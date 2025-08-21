import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Selector } from '../ui/selector';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Filter,
  Search,
  Globe
} from 'lucide-react';
import { publisherService, PublisherSite, AdUnit } from '../../services/publisher.service';

interface AdUnitWithSite extends AdUnit {
  siteName: string;
  siteDomain: string;
}

export function AdUnitsOverview() {
  const [sites, setSites] = useState<PublisherSite[]>([]);
  const [allAdUnits, setAllAdUnits] = useState<AdUnitWithSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [editingAdUnit, setEditingAdUnit] = useState<AdUnit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    format: 'BANNER' as 'BANNER' | 'VIDEO' | 'NATIVE' | 'DISPLAY' | 'INTERSTITIAL',
    settings: {}
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const sitesData = await publisherService.getSites();
      setSites(sitesData);
      
      // Load ad units for all sites
      const adUnitsWithSite: AdUnitWithSite[] = [];
      for (const site of sitesData) {
        try {
          const adUnits = await publisherService.getAdUnits(site.id);
          adUnitsWithSite.push(...adUnits.map(unit => ({
            ...unit,
            siteName: site.name,
            siteDomain: site.domain
          })));
        } catch (error) {
          console.error(`Failed to load ad units for site ${site.id}:`, error);
        }
      }
      
      setAllAdUnits(adUnitsWithSite);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSite) {
      alert('Please select a site first');
      return;
    }
    
    try {
      if (editingAdUnit) {
        await publisherService.updateAdUnit(editingAdUnit.id, formData);
      } else {
        await publisherService.createAdUnit(selectedSite, formData);
      }
      
      setShowForm(false);
      setEditingAdUnit(null);
      setFormData({ name: '', size: '', format: 'BANNER', settings: {} });
      setSelectedSite('');
      await loadAllData();
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
    setSelectedSite(adUnit.siteId);
    setShowForm(true);
  };

  const handleDelete = async (adUnitId: string) => {
    if (window.confirm('Are you sure you want to delete this ad unit?')) {
      try {
        await publisherService.deleteAdUnit(adUnitId);
        await loadAllData();
      } catch (error) {
        console.error('Failed to delete ad unit:', error);
      }
    }
  };

  const copyAdUnitCode = (adUnit: AdUnit) => {
    const code = `<div id="ad-unit-${adUnit.id}" data-site="${adUnit.siteId}" data-unit="${adUnit.id}"></div>
<script src="/ad-script.js"></script>`;
    
    navigator.clipboard.writeText(code).then(() => {
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

  // Filter ad units based on search and filters
  const filteredAdUnits = allAdUnits.filter(unit => {
    const matchesSearch = searchQuery === '' || 
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.siteName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || unit.status === statusFilter;
    const matchesFormat = formatFilter === '' || unit.format === formatFilter;
    
    return matchesSearch && matchesStatus && matchesFormat;
  });

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
          <h2 className="text-2xl font-bold">Ad Units Overview</h2>
          <p className="text-muted-foreground">
            Manage all ad units across your publisher sites
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
              {editingAdUnit ? 'Update your ad unit configuration' : 'Create a new ad unit'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="site">Site</Label>
                  <Selector
                    value={selectedSite}
                    onValueChange={setSelectedSite}
                    options={sites.map(site => ({
                      value: site.id,
                      label: `${site.name} (${site.domain})`
                    }))}
                    placeholder="Select a site"
                    disabled={!!editingAdUnit}
                  />
                </div>
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Selector
                    value={formData.format}
                    onValueChange={(value) => 
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
                    setSelectedSite('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter ad units by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search ad units..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Selector
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'TESTING', label: 'Testing' }
                ]}
                placeholder="Filter by status"
              />
            </div>
            
            <div>
              <Label htmlFor="format">Format</Label>
              <Selector
                value={formatFilter}
                onValueChange={setFormatFilter}
                options={[
                  { value: '', label: 'All Formats' },
                  { value: 'BANNER', label: 'Banner' },
                  { value: 'VIDEO', label: 'Video' },
                  { value: 'NATIVE', label: 'Native' },
                  { value: 'DISPLAY', label: 'Display' },
                  { value: 'INTERSTITIAL', label: 'Interstitial' }
                ]}
                placeholder="Filter by format"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setFormatFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ad Units List */}
      <div className="grid gap-4">
        {filteredAdUnits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ad units found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter || formatFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first ad unit'
                }
              </p>
              {!searchQuery && !statusFilter && !formatFilter && (
                <Button onClick={() => setShowForm(true)}>
                  Add Your First Ad Unit
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAdUnits.map((adUnit) => (
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

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Globe className="h-4 w-4" />
                      <span>{adUnit.siteName} ({adUnit.siteDomain})</span>
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
                        {`<div id="ad-unit-${adUnit.id}" data-site="${adUnit.siteId}" data-unit="${adUnit.id}"></div>`}
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

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{allAdUnits.length}</div>
              <p className="text-sm text-muted-foreground">Total Ad Units</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allAdUnits.filter(u => u.status === 'ACTIVE').length}
              </div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {allAdUnits.filter(u => u.status === 'TESTING').length}
              </div>
              <p className="text-sm text-muted-foreground">Testing</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {allAdUnits.filter(u => u.status === 'INACTIVE').length}
              </div>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 