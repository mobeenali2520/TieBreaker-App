export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string; // ISO string
  lastLogin: string; // ISO string
  status: 'active' | 'revoked';
  role: 'admin' | 'user';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  revokedUsers: number;
  adminUsers: number;
}
