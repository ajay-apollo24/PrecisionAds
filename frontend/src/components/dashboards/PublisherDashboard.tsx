import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Globe, Target, TrendingUp, DollarSign } from 'lucide-react';

export function PublisherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Publisher Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your sites and ad performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +1 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Units</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156K</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,240</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
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
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">TechBlog.com</h3>
                <p className="text-sm text-muted-foreground">6 ad units • 45K page views</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$1,250</p>
                <p className="text-sm text-muted-foreground">revenue</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">LifestyleMag.net</h3>
                <p className="text-sm text-muted-foreground">4 ad units • 32K page views</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$890</p>
                <p className="text-sm text-muted-foreground">revenue</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">NewsPortal.org</h3>
                <p className="text-sm text-muted-foreground">8 ad units • 67K page views</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$1,100</p>
                <p className="text-sm text-muted-foreground">revenue</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 