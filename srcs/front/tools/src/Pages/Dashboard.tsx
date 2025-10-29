import { useState } from "react";
import { AuthResponse, UserInter } from "../Utils";
import { SideBar } from "../components/SideBar";
import { DashSection } from "../components/dashboard-sections/DashSection";
import { ProfileSection } from "../components/dashboard-sections/ProfileSection";
import { SettingsSection } from "../components/dashboard-sections/SettingsSection";
import { GameSection } from "../components/dashboard-sections/GameSection";
import { FriendsSection } from "../components/dashboard-sections/FriendsSection";
import { MessagesSection } from "../components/dashboard-sections/MessagesSection";
import { DashboardHooks } from "../hooks/DashboardHooks";

// import { UserIcon, SettingsIcon, FilesIcon, ImagesIcon, BellIcon, TrophyIcon, BarChartIcon } from 'lucide-react';

export function Dashboard(): JSX.Element {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [section, setSection] = useState<string>("dashboard");

  DashboardHooks({
    user,
    section,
    setUser,
  });

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
