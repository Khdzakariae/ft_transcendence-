import { Link } from "react-router-dom";
import { RxHamburgerMenu } from "react-icons/rx";
import { RiGamepadLine } from "react-icons/ri";
import { LuLayoutDashboard } from "react-icons/lu";
import { CgProfile } from "react-icons/cg";
import { IoSettingsOutline } from "react-icons/io5";
import { LiaUserFriendsSolid } from "react-icons/lia";
import { IoChatbubblesOutline } from "react-icons/io5";
import { TbLogout2 } from "react-icons/tb";
import { useState } from "react";
import Logo from "../assets/ping_pong_logo.png";
import { Utils } from "../Utils";

export function SideBar(): JSX.Element {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [currentPath, _] = useState<string>(
    Utils.trimIfEndsWith(window.location.pathname, "/")
  ); // select active page in sidebar

  return (
    <div
      id="side-bar"
      className={`flex flex-col min-h-screen space-y-4 border-r-2 border-gray-800 text-center text-white justify-between py-8 transition-all duration-500 ${
        isSidebarExpanded ? "w-60" : "w-24"
      }`}
    >
      <div className="flex justify-center">
        <img
          src={Logo}
          alt="Logo"
          className="h-16 transition-all duration-500"
        />
      </div>
      <button
        onClick={() => {
          // setP('user-icon-this-is-a-long-test');
          setIsSidebarExpanded(!isSidebarExpanded);
        }}
        className="bg-secondary-btn hover:bg-secondary-btn/30 text-white px-3 py-1 rounded transition-colors duration-200 flex items-center justify-center transition-all duration-500"
      >
        <RxHamburgerMenu className="w-6 h-6 " />
      </button>
      <div className="flex flex-col space-y-4 transition-all duration-500 font-secondary font-medium">
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center	gap-2 ${currentPath === "/dashboard" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <LuLayoutDashboard className="w-6 h-6" />
          </div>
          {isSidebarExpanded && (
            <Link to="/dashboard" className="basis-2/3 text-left">
              Dashboard
            </Link>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2	${currentPath === "/game" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <a href="/dashboard/game">
              <RiGamepadLine className="w-6 h-6" />
            </a>
          </div>
          {isSidebarExpanded && (
            <Link to="/dashboard/game" className="basis-2/3 text-left">
              Game
            </Link>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 ${currentPath === "/profile" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <a href="/dashboard/profile">
              <CgProfile className="w-6 h-6" />
            </a>
          </div>
          {isSidebarExpanded && (
            <Link to="/dashboard/profile" className="basis-2/3 text-left">
              Profile
            </Link>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 ${currentPath === "/settings" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <a href="/dashboard/settings">
              <IoSettingsOutline className="w-6 h-6" />
            </a>
          </div>
          {isSidebarExpanded && (
            <Link to="/dashboard/settings" className="basis-2/3 text-left">
              Settings
            </Link>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 ${currentPath === "/friends" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <a href="/dashboard/friends">
              <LiaUserFriendsSolid className="w-6 h-6" />
            </a>
          </div>
          {isSidebarExpanded && (
            <Link to="/dashboard/friends" className="basis-2/3 text-left">
              Friends
            </Link>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 ${currentPath === "/messages" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <a href="/dashboard/messages">
              <IoChatbubblesOutline className="w-6 h-6" />
            </a>
          </div>
          {isSidebarExpanded && (
            <Link to="/dashboard/messages" className="basis-2/3 text-left">
              Messages
            </Link>
          )}
        </div>
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 ${currentPath === "/logout" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <a href="/dashboard/logout">
              <TbLogout2 className="w-6 h-6" />
            </a>
          </div>
          {isSidebarExpanded && (
            <Link to="/dashboard/logout" className="basis-2/3 text-left">
              Logout
            </Link>
          )}
        </div>
      </div>
      <div
        className={`flex flex-col space-y-4 transition-all duration-500 ${!isSidebarExpanded ? "opacity-0" : "opacity-100"}`}
      >
        <Link
          to="/dashboard/profile"
          className="hover:text-cyan-400 transition-colors duration-200"
        >
          Profile
        </Link>
      </div>
    </div>
  );
}
