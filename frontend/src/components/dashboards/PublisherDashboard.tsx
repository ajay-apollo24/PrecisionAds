import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Globe, Target, TrendingUp, DollarSign, Plus } from 'lucide-react';
import { publisherService, PublisherSite, EarningsSummary } from '../../services/publisher.service';

export function PublisherDashboard() {
  const [sites, setSites] = useState<PublisherSite[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sitesData, earningsData] = await Promise.all([
        publisherService.getSites(),
        publisherService.getEarningsSummary()
      ]);
      setSites(sitesData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeSites = sites.filter(site => site.status === 'ACTIVE').length;
  const totalAdUnits = sites.reduce((sum, site) => sum + site.adUnits.length, 0);
  const totalRevenue = earnings?.summary.totalRevenue || 0;
  const totalImpressions = earnings?.summary.totalImpressions || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publisher Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your sites and ad performance
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Site
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSites}</div>
            <p className="text-xs text-muted-foreground">
              {sites.length} total sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Units</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdUnits}</div>
            <p className="text-xs text-muted-foreground">
              across all sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Site Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Site Performance</CardTitle>
          <CardDescription>
            Overview of your active sites and ad units
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sites yet. Add your first site to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {sites.slice(0, 5).map((site) => {
                const siteRevenue = site.earnings.reduce((sum, earning) => sum + earning.revenue, 0);
                const siteImpressions = site.earnings.reduce((sum, earning) => sum + earning.impressions, 0);
                
                return (
                  <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{site.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {site.adUnits.length} ad units • {siteImpressions.toLocaleString()} impressions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${siteRevenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">revenue</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 