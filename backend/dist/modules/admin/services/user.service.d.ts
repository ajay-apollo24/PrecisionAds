export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId?: string;
    permissions?: string[];
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    role?: string;
    status?: string;
    organizationId?: string;
    permissions?: string[];
}
export interface UserFilters {
    role?: string;
    status?: string;
    organizationId?: string;
    email?: string;
}
export declare class UserService {
    static createUser(data: CreateUserData, createdBy: string): Promise<any>;
    static getUsers(filters?: UserFilters): Promise<any[]>;
    static getUserById(id: string): Promise<any>;
    static updateUser(id: string, data: UpdateUserData, updatedBy: string): Promise<any>;
    static deleteUser(id: string, deletedBy: string): Promise<any>;
    static resetPassword(id: string, newPassword: string, resetBy: string): Promise<any>;
    static getUserStats(organizationId?: string): Promise<any>;
    static getUsersByRole(role: string, organizationId?: string): Promise<any[]>;
    static bulkUpdateUserStatuses(userIds: string[], status: string, updatedBy: string): Promise<any>;
}
export default UserService;
//# sourceMappingURL=user.service.d.ts.map