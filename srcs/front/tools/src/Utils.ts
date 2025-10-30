// Utilities
export const LogLevel = {
  INFO: true,
  WARN: true,
  ERROR: true,
  DEBUG: true,
} as const;

// Authentication utilities
export interface AuthResponse {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    message?: string;
  };
  message?: string;
}

export interface UserInter {
  id: string;
  email: string;
  name: string;
}

/**
 * trimIfEndsWith - trim a specific char from str end
 *
 * @param str: pahtname to check
 * @param c: character to be tested in str end
 * @returns: new str if true, otherwise same str
 */
function trimIfEndsWith(str: string, c: string): string {
  if (str.endsWith(c)) {
    return str.slice(0, -1);
  }
  return str;
}

async function checkAuthCookie(): Promise<AuthResponse> {
  try {
    const response = await fetch(
      "http://localhost:3000/api/v1/auth/checkAuthCookie",
      {
        method: "GET",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { isAuthenticated: false, message: "Authentication check failed" };
    }

    const data = await response.json();
    console.log("Auth check response data:", data);
    return data;
  } catch (error) {
    Utils.LogLevel.ERROR && console.error("Auth check error:", error);
    return {
      isAuthenticated: false,
      message: "Network error during authentication check",
    };
  }
}

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
  error?: string | null;
}

export const Utils = {
  LogLevel,
  checkAuthCookie,
  trimIfEndsWith,
};
