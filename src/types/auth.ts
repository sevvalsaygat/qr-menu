import { User } from 'firebase/auth';

export interface UserData {
  email: string;
  restaurantName: string;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  emailVerified: boolean;
  subscription: {
    plan: string;
    status: string;
    expiresAt: Date;
  };
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    address: Record<string, unknown>;
  };
}

export interface SignInResult {
  user: User;
  userData: UserData | null;
}

export interface SignUpResult {
  user: User;
  userData: UserData;
  needsEmailVerification: boolean;
}