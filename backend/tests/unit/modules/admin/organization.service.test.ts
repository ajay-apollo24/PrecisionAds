import { OrganizationService } from '../../../../src/modules/admin/services/organization.service';

describe('OrganizationService', () => {
  it('should be defined', () => {
    expect(OrganizationService).toBeDefined();
  });

  it('should have static methods', () => {
    expect(typeof OrganizationService.getOrganizations).toBe('function');
    expect(typeof OrganizationService.getOrganizationById).toBe('function');
    expect(typeof OrganizationService.createOrganization).toBe('function');
  });
}); 