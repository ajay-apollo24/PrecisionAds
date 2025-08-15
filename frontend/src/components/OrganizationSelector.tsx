import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  orgType: string;
  status: string;
}

interface OrganizationSelectorProps {
  onOrganizationChange?: (orgId: string) => void;
  className?: string;
}

const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ 
  onOrganizationChange, 
  className = '' 
}) => {
  const { user } = useContext(AuthContext);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load organizations on component mount
  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  // Load selected organization from localStorage
  useEffect(() => {
    const savedOrgId = localStorage.getItem('x-org-id');
    if (savedOrgId && organizations.some(org => org.id === savedOrgId)) {
      setSelectedOrgId(savedOrgId);
      if (onOrganizationChange) {
        onOrganizationChange(savedOrgId);
      }
    } else if (organizations.length > 0) {
      // Default to first organization if no saved selection
      const defaultOrg = organizations[0];
      setSelectedOrgId(defaultOrg.id);
      localStorage.setItem('x-org-id', defaultOrg.id);
      if (onOrganizationChange) {
        onOrganizationChange(defaultOrg.id);
      }
    }
  }, [organizations, onOrganizationChange]);

  const loadOrganizations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load organizations');
      }

      const data = await response.json();
      setOrganizations(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
      console.error('Error loading organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrgId = event.target.value;
    setSelectedOrgId(newOrgId);
    localStorage.setItem('x-org-id', newOrgId);
    
    if (onOrganizationChange) {
      onOrganizationChange(newOrgId);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading organizations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error: {error}
        <button 
          onClick={loadOrganizations}
          className="ml-2 text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No organizations available
      </div>
    );
  }

  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <label htmlFor="org-selector" className="text-sm font-medium text-gray-700">
        Organization:
      </label>
      <div className="relative">
        <select
          id="org-selector"
          value={selectedOrgId}
          onChange={handleOrganizationChange}
          className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.orgType})
            </option>
          ))}
        </select>
      </div>
      {selectedOrg && (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {selectedOrg.status}
          </span>
          <span className="text-xs text-gray-500">
            ID: {selectedOrg.id}
          </span>
        </div>
      )}
    </div>
  );
};

export default OrganizationSelector; 