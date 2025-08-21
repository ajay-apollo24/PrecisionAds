import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Selector } from '../ui/selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SimpleChart } from '../ui/simple-chart';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Eye,
  Clock,
  Mail,
  Settings,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { publisherService, PublisherSite, EarningsSummary } from '../../services/publisher.service';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'earnings' | 'performance' | 'traffic' | 'custom';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'none';
  lastGenerated?: string;
  recipients?: string[];
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  dateRange: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
}

export function ReportingModule() {
  const [sites, setSites] = useState<PublisherSite[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState<string>('');
  const [activeTab, setActiveTab] = useState('reports');
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  // Mock data for report templates and generated reports
  const [reportTemplates] = useState<ReportTemplate[]>([
    {
      id: 'template-1',
      name: 'Monthly Earnings Report',
      description: 'Comprehensive monthly earnings and performance summary',
      type: 'earnings',
      schedule: 'monthly',
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      recipients: ['admin@example.com']
    },
    {
      id: 'template-2',
      name: 'Weekly Performance Dashboard',
      description: 'Weekly ad performance and traffic metrics',
      type: 'performance',
      schedule: 'weekly',
      lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      recipients: ['team@example.com']
    },
    {
      id: 'template-3',
      name: 'Traffic Analysis Report',
      description: 'Detailed traffic and audience insights',
      type: 'traffic',
      schedule: 'none',
      lastGenerated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const [generatedReports] = useState<GeneratedReport[]>([
    {
      id: 'report-1',
      name: 'Monthly Earnings Report - December 2024',
      type: 'earnings',
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      dateRange: 'Dec 1 - Dec 31, 2024',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: 'report-2',
      name: 'Weekly Performance - Week 52',
      type: 'performance',
      generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      dateRange: 'Dec 23 - Dec 29, 2024',
      status: 'completed',
      downloadUrl: '#'
    }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sitesData, earningsData] = await Promise.all([
        publisherService.getSites(),
        publisherService.getEarningsSummary()
      ]);
      setSites(sitesData);
      setEarningsSummary(earningsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (templateId: string) => {
    try {
      // Simulate report generation
      console.log(`Generating report for template: ${templateId}`);
      // In a real implementation, this would call the backend API
      alert('Report generation started. You will receive an email when it\'s ready.');
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const downloadReport = (reportId: string) => {
    // Simulate report download
    console.log(`Downloading report: ${reportId}`);
    // In a real implementation, this would trigger a file download
    alert('Report download started.');
  };

  const scheduleReport = (templateId: string, schedule: string) => {
    // Simulate scheduling a report
    console.log(`Scheduling report ${templateId} for ${schedule}`);
    alert(`Report scheduled for ${schedule} delivery.`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'earnings': return <DollarSign className="h-4 w-4" />;
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      case 'traffic': return <TrendingUp className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reporting & Analytics</h2>
          <p className="text-muted-foreground">
            Generate reports, schedule deliveries, and export data
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowReportBuilder(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Custom Report
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Generated this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportTemplates.filter(t => t.schedule && t.schedule !== 'none').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active schedules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${earningsSummary?.summary.totalRevenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites.filter(s => s.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Publishing sites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reports">Report Templates</TabsTrigger>
              <TabsTrigger value="generated">Generated Reports</TabsTrigger>
              <TabsTrigger value="analytics">Quick Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Report Templates</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {reportTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getReportTypeIcon(template.type)}
                              <h4 className="font-semibold">{template.name}</h4>
                              <Badge variant="secondary">
                                {template.type}
                              </Badge>
                              {template.schedule && template.schedule !== 'none' && (
                                <Badge variant="outline">
                                  {template.schedule}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {template.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {template.lastGenerated && (
                                <span>Last: {formatDate(template.lastGenerated)}</span>
                              )}
                              {template.recipients && template.recipients.length > 0 && (
                                <span>Recipients: {template.recipients.length}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => generateReport(template.id)}
                            >
                              Generate Now
                            </Button>
                            {template.schedule && template.schedule !== 'none' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => scheduleReport(template.id, 'none')}
                              >
                                Unschedule
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => scheduleReport(template.id, 'weekly')}
                              >
                                Schedule
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="generated" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Generated Reports</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search reports..."
                      className="w-64"
                    />
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {generatedReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{report.name}</h4>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Type: {report.type}</span>
                              <span>Generated: {formatDate(report.generatedAt)}</span>
                              <span>Period: {report.dateRange}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReport(report.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Quick Analytics</h3>
                
                {/* Revenue Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>
                      Monthly revenue performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimpleChart
                      data={[
                        { label: 'Jan', value: 2800, color: 'bg-blue-500' },
                        { label: 'Feb', value: 3200, color: 'bg-green-500' },
                        { label: 'Mar', value: 2900, color: 'bg-yellow-500' },
                        { label: 'Apr', value: 3500, color: 'bg-purple-500' },
                        { label: 'May', value: 3800, color: 'bg-indigo-500' },
                        { label: 'Jun', value: 4200, color: 'bg-pink-500' }
                      ]}
                      type="line"
                      height={300}
                      showValues
                    />
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Site Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SimpleChart
                        data={sites.slice(0, 5).map(site => ({
                          label: site.name.slice(0, 10),
                          value: site.earnings.reduce((sum, e) => sum + e.revenue, 0),
                          color: 'bg-green-500'
                        }))}
                        type="bar"
                        height={200}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ad Unit Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {sites.slice(0, 3).map(site => (
                          <div key={site.id} className="flex items-center justify-between">
                            <span className="text-sm">{site.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full"
                                  style={{ 
                                    width: `${(site.adUnits.length / Math.max(...sites.map(s => s.adUnits.length))) * 100}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">{site.adUnits.length}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Report Builder Modal */}
      {showReportBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>
                Create a custom report with your specific requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input id="reportName" placeholder="My Custom Report" />
                </div>
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Selector
                    value={reportType}
                    onValueChange={setReportType}
                    options={[
                      { value: 'earnings', label: 'Earnings Report' },
                      { value: 'performance', label: 'Performance Report' },
                      { value: 'traffic', label: 'Traffic Report' },
                      { value: 'custom', label: 'Custom Report' }
                    ]}
                    placeholder="Select report type"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="dateRange">Date Range</Label>
                <Selector
                  value={dateRange}
                  onValueChange={setDateRange}
                  options={[
                    { value: '7d', label: 'Last 7 Days' },
                    { value: '30d', label: 'Last 30 Days' },
                    { value: '90d', label: 'Last 90 Days' },
                    { value: '1y', label: 'Last Year' },
                    { value: 'custom', label: 'Custom Range' }
                  ]}
                  placeholder="Select date range"
                />
              </div>
              
              <div>
                <Label htmlFor="sites">Sites to Include</Label>
                <Selector
                  value={selectedSite}
                  onValueChange={setSelectedSite}
                  options={[
                    { value: '', label: 'All Sites' },
                    ...sites.map(site => ({
                      value: site.id,
                      label: `${site.name} (${site.domain})`
                    }))
                  ]}
                  placeholder="Select sites"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowReportBuilder(false)}>
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReportBuilder(false)}
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