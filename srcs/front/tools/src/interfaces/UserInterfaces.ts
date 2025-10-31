// User data interface for the profile section (may be used for other sections as well)
export interface UserDataInter {
  achievements: string[];
  avatar: string;
  createdAt: string;
  email: string;
  id: string;
  level: number;
  medals: { gold: number; silver: number; bronze: number };
  name: string;
  onlineStatus: boolean;
  recentActivities: string[];
  totalAchievements: number;
  twoFactorEnabled: boolean;
  updatedAt: string;
  verified: boolean;
  xp: number;
  firstName: string;
  lastName: string;
  bio?: string;
  error?: string | null;
}

export interface UserInter {
  id: string;
  email: string;
  name: string;
}
