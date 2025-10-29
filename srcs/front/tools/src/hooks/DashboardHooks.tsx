import { useEffect } from "react";
import { AuthResponse, Utils } from "../Utils";
import { useNavigate as Navigate } from "react-router-dom";

export function DashboardHooks({
  user,
  section,
  setUser,
}: {
  user: AuthResponse["user"] | null;
  section: string;
  setUser: (user: AuthResponse["user"] | null) => void;
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
}
