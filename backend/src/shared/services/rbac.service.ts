export enum AccessLevel {
  PLATFORM = 'PLATFORM',      // SUPER_ADMIN - can see everything
  ORGANIZATION = 'ORGANIZATION', // ADMIN - can see their org + manage users/keys
  TEAM = 'TEAM',              // MANAGER - can see org data, manage keys only
  INDIVIDUAL = 'INDIVIDUAL'   // USER - view only, minimal access
}

export enum ResourceType {
  ORGANIZATION = 'ORGANIZATION',
  USER = 'USER',
  API_KEY = 'API_KEY',
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS'
}

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE'
}

export interface DataScope {
  canSeeAllOrganizations: boolean;
  canSeeAllUsers: boolean;
  canSeeAllAPIKeys: boolean;
  canSeeOrganizationCount: boolean;
  canSeeUserCount: boolean;
  canSeeAPIKeyCount: boolean;
  canSeeRevenue: boolean;
  organizationFilter?: string;
  userFilter?: string;
  apiKeyFilter?: string;
}

export class RBACService {
  /**
   * Get the access level for a user role
   */
  static getAccessLevel(userRole: string): AccessLevel {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return AccessLevel.PLATFORM;
      case 'ADMIN':
        return AccessLevel.ORGANIZATION;
      case 'MANAGER':
        return AccessLevel.TEAM;
      case 'USER':
      case 'ADVERTISER':
      case 'PUBLISHER':
        return AccessLevel.INDIVIDUAL;
      default:
        return AccessLevel.INDIVIDUAL;
    }
  }

  /**
   * Check if user can perform action on resource
   */
  static canAccessResource(userRole: string, resourceType: ResourceType, action: Action): boolean {
    const accessLevel = this.getAccessLevel(userRole);
    
    switch (accessLevel) {
      case AccessLevel.PLATFORM:
        return true; // SUPER_ADMIN can do everything
        
      case AccessLevel.ORGANIZATION:
        switch (resourceType) {
          case ResourceType.ORGANIZATION:
            return action === Action.READ; // Can only view orgs, not manage
          case ResourceType.USER:
            return action === Action.CREATE || action === Action.READ || action === Action.UPDATE || action === Action.DELETE;
          case ResourceType.API_KEY:
            return action === Action.CREATE || action === Action.READ || action === Action.UPDATE || action === Action.DELETE;
          case ResourceType.DASHBOARD:
            return action === Action.READ;
          case ResourceType.ANALYTICS:
            return action === Action.READ;
          case ResourceType.SETTINGS:
            return action === Action.READ;
        }
        break;
        
      case AccessLevel.TEAM:
        switch (resourceType) {
          case ResourceType.ORGANIZATION:
            return action === Action.READ;
          case ResourceType.USER:
            return action === Action.READ; // Can only view users
          case ResourceType.API_KEY:
            return action === Action.CREATE || action === Action.READ || action === Action.UPDATE || action === Action.DELETE;
          case ResourceType.DASHBOARD:
            return action === Action.READ;
          case ResourceType.ANALYTICS:
            return action === Action.READ;
          case ResourceType.SETTINGS:
            return false;
        }
        break;
        
      case AccessLevel.INDIVIDUAL:
        switch (resourceType) {
          case ResourceType.ORGANIZATION:
            return action === Action.READ;
          case ResourceType.USER:
            return action === Action.READ;
          case ResourceType.API_KEY:
            return action === Action.READ;
          case ResourceType.DASHBOARD:
            return action === Action.READ;
          case ResourceType.ANALYTICS:
            return action === Action.READ;
          case ResourceType.SETTINGS:
            return false;
        }
        break;
    }
    
    return false;
  }

  /**
   * Get data scope for user based on role
   */
  static getDataScope(userRole: string, userOrgId: string): DataScope {
    const accessLevel = this.getAccessLevel(userRole);
    
    switch (accessLevel) {
      case AccessLevel.PLATFORM:
        return {
          canSeeAllOrganizations: true,
          canSeeAllUsers: true,
          canSeeAllAPIKeys: true,
          canSeeOrganizationCount: true,
          canSeeUserCount: true,
          canSeeAPIKeyCount: true,
          canSeeRevenue: true
        };
        
      case AccessLevel.ORGANIZATION:
        return {
          canSeeAllOrganizations: false,
          canSeeAllUsers: false,
          canSeeAllAPIKeys: false,
          canSeeOrganizationCount: false, // Cannot see total org count
          canSeeUserCount: true,          // Can see user count in their org
          canSeeAPIKeyCount: true,        // Can see API key count in their org
          canSeeRevenue: true,            // Can see their org's revenue
          organizationFilter: userOrgId,
          userFilter: userOrgId,
          apiKeyFilter: userOrgId
        };
        
      case AccessLevel.TEAM:
        return {
          canSeeAllOrganizations: false,
          canSeeAllUsers: false,
          canSeeAllAPIKeys: false,
          canSeeOrganizationCount: false,
          canSeeUserCount: true,          // Can see user count in their org
          canSeeAPIKeyCount: true,        // Can see API key count in their org
          canSeeRevenue: false,           // Cannot see revenue
          organizationFilter: userOrgId,
          userFilter: userOrgId,
          apiKeyFilter: userOrgId
        };
        
      case AccessLevel.INDIVIDUAL:
        return {
          canSeeAllOrganizations: false,
          canSeeAllUsers: false,
          canSeeAllAPIKeys: false,
          canSeeOrganizationCount: false,
          canSeeUserCount: false,         // Cannot see user count
          canSeeAPIKeyCount: false,       // Cannot see API key count
          canSeeRevenue: false,           // Cannot see revenue
          organizationFilter: userOrgId,
          userFilter: userOrgId,
          apiKeyFilter: userOrgId
        };
        
      default:
        return {
          canSeeAllOrganizations: false,
          canSeeAllUsers: false,
          canSeeAllAPIKeys: false,
          canSeeOrganizationCount: false,
          canSeeUserCount: false,
          canSeeAPIKeyCount: false,
          canSeeRevenue: false,
          organizationFilter: userOrgId,
          userFilter: userOrgId,
          apiKeyFilter: userOrgId
        };
    }
  }

  /**
   * Get menu items based on user access level
   */
  static getMenuItems(accessLevel: AccessLevel): string[] {
    switch (accessLevel) {
      case AccessLevel.PLATFORM:
        return ['main', 'metrics', 'auth', 'realtime', 'organizations', 'users', 'api-keys', 'settings'];
        
      case AccessLevel.ORGANIZATION:
        return ['main', 'metrics', 'auth', 'realtime', 'users', 'api-keys', 'settings'];
        
      case AccessLevel.TEAM:
        return ['main', 'metrics', 'auth', 'realtime', 'users', 'api-keys'];
        
      case AccessLevel.INDIVIDUAL:
        return ['main', 'metrics', 'auth'];
        
      default:
        return ['main'];
    }
  }

  /**
   * Check if user can see organization management
   */
  static canManageOrganizations(userRole: string): boolean {
    return this.getAccessLevel(userRole) === AccessLevel.PLATFORM;
  }

  /**
   * Check if user can manage users
   */
  static canManageUsers(userRole: string): boolean {
    const accessLevel = this.getAccessLevel(userRole);
    return accessLevel === AccessLevel.PLATFORM || accessLevel === AccessLevel.ORGANIZATION;
  }

  /**
   * Check if user can manage API keys
   */
  static canManageAPIKeys(userRole: string): boolean {
    const accessLevel = this.getAccessLevel(userRole);
    return accessLevel === AccessLevel.PLATFORM || accessLevel === AccessLevel.ORGANIZATION || accessLevel === AccessLevel.TEAM;
  }

  /**
   * Check if user can see sensitive metrics
   */
  static canSeeSensitiveMetrics(userRole: string): boolean {
    const accessLevel = this.getAccessLevel(userRole);
    return accessLevel === AccessLevel.PLATFORM || accessLevel === AccessLevel.ORGANIZATION;
  }
} 