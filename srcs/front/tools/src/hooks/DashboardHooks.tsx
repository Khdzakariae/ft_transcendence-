import { useEffect } from "react";
import { Utils } from "../Utils";
import { AuthResponse } from "../interfaces/AuthResponse";
import { useNavigate as Navigate } from "react-router-dom";
import { UserDataInter } from "../interfaces/UserInterfaces";

export function DashboardHooks({
  user,
  section,
  setUser,
  user_data,
  setUserData,
}: {
  user: AuthResponse["user"] | null;
  section: string;
  setUser: (user: AuthResponse["user"] | null) => void;
  user_data: UserDataInter | null;
  setUserData: (data: UserDataInter | null) => void;
}): void {
  const navigate = Navigate();

  useEffect(() => {
    Utils.LogLevel.DEBUG && console.log("checking on user: ", user);
  }, [user]);

  useEffect(() => {
    Utils.LogLevel.DEBUG && console.log("Current dashboard section: ", section);
  }, [section]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult: AuthResponse = await Utils.checkAuthCookie();

        if (authResult.isAuthenticated && authResult.user) {
          setUser(authResult.user);
        } else {
          // If not authenticated, redirect to home
          navigate("/", { replace: true });
        }
      } catch (error) {
        Utils.LogLevel.ERROR &&
          console.error("Dashboard auth check error:", error);
        navigate("/", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    let response: any;
    const fetchProfile = async () => {
      try {
        response = await fetch("http://localhost:3000/api/v1/user/me", {
          method: "GET",
          credentials: "include",
        });
      } catch (error) {
        Utils.LogLevel.DEBUG &&
          console.error("Error fetching profile data:", error);
      }
      const data: any = await response.json();
      user_data = data.data as UserDataInter;
      if (user_data?.error) {
        Utils.LogLevel.DEBUG &&
          console.error("Error fetching profile data:", user_data.error);
      } else {
        setUserData(user_data);
        Utils.LogLevel.DEBUG && console.log("Profile data:", user_data);
      }
    };

    fetchProfile();
  }, [user]);
}
