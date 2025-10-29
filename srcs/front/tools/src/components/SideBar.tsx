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
import profile_image from "../assets/dash_profile_image.png";
import { UserInter } from "../Utils";

export function SideBar({
  active_user,
  section,
  setSection,
}: {
  active_user: UserInter;
  section: string;
  setSection: (section: string) => void;
}): JSX.Element {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div
      id="side-bar"
      className={`flex flex-col min-h-screen border-r-2 border-gray-800 text-center text-white justify-between py-8 transition-all duration-300 ease-in-out overflow-hidden ${
        isSidebarExpanded ? "w-64" : "w-24"
      }`}
    >
      <div className="flex justify-center">
        <img
          src={Logo}
          alt="Logo"
          className="h-16 transition-all duration-300"
        />
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
        <div
          id="nav-bar-section"
          className={`flex flex-row justify-center items-center gap-2 transition-all duration-300 ${section === "logout" ? "current-section" : "default-section"}`}
        >
          <div
            className={`flex transition-all duration-300 ${isSidebarExpanded ? "justify-end basis-1/3" : "justify-center basis-full"}`}
          >
            <button
              onClick={() => {
                setSection("logout");
              }}
            >
              <TbLogout2 className="w-6 h-6" />
            </button>
          </div>
          <button
            className={`basis-2/3 text-left overflow-hidden whitespace-nowrap ${
              isSidebarExpanded ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
            }`}
          >
            Logout
          </button>
        </div>
      </div>
      <div
        className={`flex flex-row justify-center items-center gap-2 transition-all duration-300`}
      >
        <div
          className={`flex transition-all duration-300 ${isSidebarExpanded ? "basis-1/3 justify-end" : "basis-full justify-center items-center"}`}
        >
          <img
            src={profile_image}
            alt="profile image"
            className="w-10 h-10 rounded-full"
          />
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
