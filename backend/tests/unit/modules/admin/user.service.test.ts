import { UserService } from '../../../../src/modules/admin/services/user.service';

describe('UserService', () => {
  it('should be defined', () => {
    expect(UserService).toBeDefined();
  });

  it('should have static methods', () => {
    expect(typeof UserService.getUsers).toBe('function');
    expect(typeof UserService.getUserById).toBe('function');
    expect(typeof UserService.createUser).toBe('function');
  });
}); 