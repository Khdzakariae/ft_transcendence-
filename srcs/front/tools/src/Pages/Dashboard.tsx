import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Utils, AuthResponse, UserInter } from "../Utils";
import { SideBar } from "../components/SideBar";
import { DashSection } from "../components/dashboard-sections/DashSection";
import { ProfileSection } from "../components/dashboard-sections/ProfileSection";
import { SettingsSection } from "../components/dashboard-sections/SettingsSection";
import { GameSection } from "../components/dashboard-sections/GameSection";
import { FriendsSection } from "../components/dashboard-sections/FriendsSection";
import { MessagesSection } from "../components/dashboard-sections/MessagesSection";

// import { UserIcon, SettingsIcon, FilesIcon, ImagesIcon, BellIcon, TrophyIcon, BarChartIcon } from 'lucide-react';

export function Dashboard(): JSX.Element {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  let loading_flag: boolean = false;
  const [section, setSection] = useState<string>("dashboard");
  // const [p, setP] = useState<string>('profile');

  useEffect(() => {
    Utils.LogLevel.DEBUG && console.log("checking on user: ", user);
  }, [user]);

  useEffect(() => {
    Utils.LogLevel.DEBUG && console.log("Current dashboard section: ", section);
  }, [section]);

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
    <div className="flex flex-row text-white">
      <SideBar
        active_user={user as UserInter}
        section={section}
        setSection={setSection}
      />
      {/* dashboar will be customized later */}
      {section === "dashboard" ? (
        <DashSection user={user as UserInter | null} />
      ) : null}
      {section === "profile" ? (
        <ProfileSection user={user as UserInter | null} />
      ) : null}
      {section === "settings" ? (
        <SettingsSection user={user as UserInter | null} />
      ) : null}
      {section === "game" ? (
        <GameSection user={user as UserInter | null} />
      ) : null}
      {section === "friends" ? (
        <FriendsSection user={user as UserInter | null} />
      ) : null}
      {section === "messages" ? (
        <MessagesSection user={user as UserInter | null} />
      ) : null}
    </div>
  );
}
