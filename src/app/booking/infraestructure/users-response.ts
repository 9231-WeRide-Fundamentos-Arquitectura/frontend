import { User } from '../../core/services/api.service';
export type UserResponse = User;
export interface UsersListResponse {users:UserResponse[];}
