import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import OrganizationSelector from '../components/OrganizationSelector';

const Integrations: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'identity' | 'traits' | 'cohorts' | 'events'>('overview');

  const baseUrl = process.env.REACT_APP_API_URL || 'https://api.precisionads.com/v1';
  const openApiUrl = `${baseUrl}/openapi-canonical-spec.yaml`;

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrgId(orgId);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📋' },
    { id: 'identity', name: 'Identity', icon: '👤' },
    { id: 'traits', name: 'Traits', icon: '🏷️' },
    { id: 'cohorts', name: 'Cohorts', icon: '👥' },
    { id: 'events', name: 'Events', icon: '📊' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 Getting Started</h3>
        <p className="text-blue-800 mb-4">
          Welcome to Precision Ads API! This guide will help you integrate with our canonical spec for tracking identities, traits, cohorts, and events.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Base URL</h4>
            <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono">
              {baseUrl}
            </code>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">OpenAPI Spec</h4>
            <a 
              href={openApiUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View OpenAPI Specification
            </a>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">🔑 Authentication</h3>
        <p className="text-green-800 mb-4">
          All API requests require an API key in the header and organization context.
        </p>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-green-900 mb-1">Required Headers</h4>
            <div className="space-y-2">
              <code className="block bg-green-100 px-3 py-2 rounded text-sm font-mono">
                x-api-key: YOUR_API_KEY
              </code>
              <code className="block bg-green-100 px-3 py-2 rounded text-sm font-mono">
                x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}
              </code>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">📚 Key Concepts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Identity</h4>
            <p className="text-purple-800 text-sm">
              Represents a user or entity across different systems and sessions.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Traits</h4>
            <p className="text-purple-800 text-sm">
              Properties and characteristics associated with an identity.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Cohorts</h4>
            <p className="text-purple-800 text-sm">
              Groups of identities that share common characteristics or behaviors.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Events</h4>
            <p className="text-purple-800 text-sm">
              Actions and interactions performed by identities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIdentity = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Identity Management</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Create Identity</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm font-mono">
                curl -X POST {baseUrl}/identities \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}" \<br/>
                &nbsp;&nbsp;-d '{'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"externalId": "user_123",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"anonymousId": "anon_456",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"traits": {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"email": "user@example.com",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"firstName": "John",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"lastName": "Doe"<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;{'}'},<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"version": 1,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"idempotencyKey": "unique_key_123"<br/>
                &nbsp;&nbsp;{'}'}
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Get Identity</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm font-mono">
                curl -X GET {baseUrl}/identities/IDENTITY_ID \<br/>
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}"
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTraits = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Trait Management</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Create Trait</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm font-mono">
                curl -X POST {baseUrl}/traits \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}" \<br/>
                &nbsp;&nbsp;-d '{'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"identityId": "identity_123",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"key": "preferences",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"value": ["sports", "technology"],<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"type": "ARRAY",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"version": 1,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"idempotencyKey": "trait_key_123"<br/>
                &nbsp;&nbsp;{'}'}
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Get Identity Traits</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm font-mono">
                curl -X GET {baseUrl}/identities/IDENTITY_ID/traits \<br/>
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}"
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCohorts = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Cohort Management</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Create Cohort</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm font-mono">
                curl -X POST {baseUrl}/cohorts \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}" \<br/>
                &nbsp;&nbsp;-d '{'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"name": "High Value Customers",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"description": "Customers with purchase value > $1000",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"type": "BEHAVIORAL",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"criteria": {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"trait": "total_purchase_value",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"operator": "gt",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"value": 1000<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;{'}'},<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"version": 1,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"idempotencyKey": "cohort_key_123"<br/>
                &nbsp;&nbsp;{'}'}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Event Tracking</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Track Event</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm font-mono">
                curl -X POST {baseUrl}/events \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}" \<br/>
                &nbsp;&nbsp;-d '{'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"identityId": "identity_123",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"type": "PAGE_VIEW",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"name": "Product Page Viewed",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"properties": {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"page": "/products/123",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"referrer": "https://google.com"<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;{'}'},<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"timestamp": "2024-01-15T10:30:00Z",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"version": 1,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"idempotencyKey": "event_key_123"<br/>
                &nbsp;&nbsp;{'}'}
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Get Identity Events</h4>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm font-mono">
                curl -X GET "{baseUrl}/identities/IDENTITY_ID/events?type=PAGE_VIEW&limit=10" \<br/>
                &nbsp;&nbsp;-H "x-api-key: YOUR_API_KEY" \<br/>
                &nbsp;&nbsp;-H "x-organization-id: {selectedOrgId || 'YOUR_ORG_ID'}"
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'identity':
        return renderIdentity();
      case 'traits':
        return renderTraits();
      case 'cohorts':
        return renderCohorts();
      case 'events':
        return renderEvents();
      default:
        return renderOverview();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access integrations</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations & Getting Started</h1>
          <p className="text-gray-600">
            Learn how to integrate with Precision Ads API using our canonical specification
          </p>
        </div>

        <div className="mb-6">
          <OrganizationSelector onOrganizationChange={handleOrganizationChange} />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations; 