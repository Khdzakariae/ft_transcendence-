import { RxHamburgerMenu } from "react-icons/rx";
import { RiGamepadLine } from "react-icons/ri";
import { LuLayoutDashboard } from "react-icons/lu";
import { CgProfile } from "react-icons/cg";
import { IoSettingsOutline } from "react-icons/io5";
import { LiaUserFriendsSolid } from "react-icons/lia";
import { IoChatbubblesOutline } from "react-icons/io5";
import { TbLogout2 } from "react-icons/tb";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/ping_pong_logo.png";
import { UserDataInter, UserInter } from "../interfaces/UserInterfaces";
import { AvatarDot } from "./AvatarDot";
import { LazyLoadingImage } from "./LazyLoadingImage";
import { IoIosNotificationsOutline } from "react-icons/io";

export function SideBar({
  active_user,
  user_data,
  section,
  setSection,
  hasUnreadNotifications,
}: {
  active_user: UserInter;
  user_data: UserDataInter | null;
  section: string;
  setSection: (section: string) => void;
  hasUnreadNotifications?: boolean;
}): JSX.Element {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [loading_logo, setLoadingLogo] = useState(true);
  const [loading_avatar, setLoadingAvatar] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/auth/sign-out",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/");
    }
  };

  return (
    <div
      id="side-bar"
      className={`flex flex-col max-h-screen sticky top-0 border-r-2 border-gray-800 text-center text-white justify-between py-8 transition-all duration-300 ease-in-out overflow-hidden ${
        isSidebarExpanded ? "w-64" : "w-24"
      }`}
    >
      <div className="flex justify-center">
        <LazyLoadingImage
          dimension={{
            width: "w-12 sm:w-16",
            height: "h-12 sm:h-16",
          }}
          loading={!loading_logo}
          color="bg-primary-btn/30"
        >
          <img
            src={Logo}
            alt="Logo"
            className="h-12 w-12 sm:h-16 sm:w-16 transition-all duration-300"
            loading="lazy"
            onLoad={() => setLoadingLogo(false)}
          />
        </LazyLoadingImage>
      </div>
      <button
        onClick={() => {
          // setP('user-icon-this-is-a-long-test');
          setIsSidebarExpanded(!isSidebarExpanded);
        }}
        className="bg-secondary-btn hover:bg-secondary-btn/30 text-white px-3 py-1 rounded transition-all duration-300 flex items-center justify-center"
      >
        <RxHamburgerMenu className="w-6 h-6 " />
      </button>
      <div className="flex flex-col space-y-4 font-secondary font-medium">
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "dashboard" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("dashboard");
              }}
            >
              <LuLayoutDashboard className="w-6 h-6" />
            </button>
          </div>
          <button
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
            onClick={() => {
              setSection("dashboard");
            }}
          >
            Dashboard
          </button>
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "game" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("game");
              }}
            >
              <RiGamepadLine className="w-6 h-6" />
            </button>
          </div>
          <button
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
            onClick={() => {
              setSection("game");
            }}
          >
            Game
          </button>
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "profile" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("profile");
              }}
            >
              <CgProfile className="w-6 h-6" />
            </button>
          </div>
          <button
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
            onClick={() => {
              setSection("profile");
            }}
          >
            Profile
          </button>
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "settings" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("settings");
              }}
            >
              <IoSettingsOutline className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => {
              setSection("settings");
            }}
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
          >
            Settings
          </button>
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "friends" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("friends");
              }}
            >
              <LiaUserFriendsSolid className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => {
              setSection("friends");
            }}
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
          >
            Friends
          </button>
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "messages" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("messages");
              }}
            >
              <IoChatbubblesOutline className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => {
              setSection("messages");
            }}
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
          >
            Messages
          </button>
        </div>
        {/* implement notifications section same way as the others */}
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "notifications" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("notifications");
              }}
              className="relative"
            >
              <IoIosNotificationsOutline className="w-6 h-6" />
              {hasUnreadNotifications && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-gray-900"></span>
              )}
            </button>
          </div>
          <button
            onClick={() => {
              setSection("notifications");
            }}
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
          >
            Notifications
          </button>
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "logout" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TbLogout2 className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
      <div
        className={`flex flex-row justify-center items-center gap-2 transition-all duration-300`}
      >
        <div
          className={`flex transition-all duration-300 ${isSidebarExpanded ? "basis-1/3 justify-end" : "basis-full justify-center items-center"}`}
        >
          <LazyLoadingImage
            dimension={{
              width: "w-10",
              height: "h-10",
            }}
            loading={!loading_avatar}
            color="bg-primary-btn/30"
          >
            <AvatarDot>
              <img
                src={user_data?.avatar}
                alt="avatar image"
                className={`w-10 h-10 rounded-full transition-opacity duration-300 ${!loading_avatar ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                onLoad={() => setLoadingAvatar(false)}
              />
            </AvatarDot>
            {loading_avatar && (
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
            )}
          </LazyLoadingImage>
        </div>
        <div
          className={`basis-2/3 text-left font-secondary font-medium ${
            isSidebarExpanded
              ? "opacity-100 max-w-full text-left"
              : "opacity-0 max-w-0"
          }`}
        >
          <p>{`${active_user?.name}`}</p>
        </div>
      </div>
    </div>
  );
}
