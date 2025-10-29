import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Utils, AuthResponse, UserInter } from "../Utils";
import { SideBar } from "../components/SideBar";

// import { UserIcon, SettingsIcon, FilesIcon, ImagesIcon, BellIcon, TrophyIcon, BarChartIcon } from 'lucide-react';

export function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  let loading_flag: boolean = false;
  // const [p, setP] = useState<string>('profile');

  useEffect(() => {
    Utils.LogLevel.DEBUG && console.log("checking on user: ", user);
    console.log("checking on current path: ", document.location.pathname);
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    // delay dashboard loading
    if ((loading_flag = true)) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }

    return () => clearTimeout(timer);
  }, [loading_flag]);

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
      } finally {
        // loading_flag = true;
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="animate-pulse text-gray-400 font-primary text-center text-md sm:text-lg">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row">
      <SideBar {...(user as UserInter)} />
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">
          Welcome {`${user?.name}`}! This is your dashboard.
        </h1>
      </div>
    </div>
  );
}
