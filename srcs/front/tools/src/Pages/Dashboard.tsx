import { useState, createContext, useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AuthResponse } from "../interfaces/AuthResponse";
import { UserInter } from "../interfaces/UserInterfaces";
import { SideBar } from "../components/SideBar";
import { DashboardHooks } from "../hooks/DashboardHooks";
import { UserDataInter } from "../interfaces/UserInterfaces";
import { useNotifications } from "../hooks/useNotifications";

// Create a context to share dashboard data with child routes
interface DashboardContextType {
  user: AuthResponse["user"] | null;
  user_data: UserDataInter | null;
  friendRequests: any[];
  markNotificationAsRead: (requestId: string) => void;
  fetchFriendRequests: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

// Custom hook to use dashboard context
export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within Dashboard component"
    );
  }
  return context;
}

export function Dashboard(): JSX.Element {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [user_data, setUserData] = useState<UserDataInter | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const location = useLocation();

  // Get current section from URL path
  const currentPath = location.pathname.split("/").filter(Boolean);
  const section = currentPath[1] || "dashboard";

  DashboardHooks({
    user,
    setUser,
    user_data,
    setUserData,
  });

  // Use the notifications hook
  const {
    friendRequests,
    hasUnreadNotifications,
    markNotificationAsRead,
    fetchFriendRequests,
  } = useNotifications(user, section);

  // Listen for unread messages changes from MessagesSection
  useEffect(() => {
    const handleUnreadMessagesChange = (event: CustomEvent) => {
      setHasUnreadMessages(event.detail.hasUnreadMessages);
    };

    window.addEventListener('unreadMessagesChanged', handleUnreadMessagesChange as EventListener);
    return () => {
      window.removeEventListener('unreadMessagesChanged', handleUnreadMessagesChange as EventListener);
    };
  }, []);

  // Poll for unread messages when not in the messages section
  useEffect(() => {
    if (!user || section === 'messages') return;

    const checkUnreadMessages = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/v1/chats", {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();
        const chats = json.data || [];
        
        // Check if any chat has unread messages
        const hasUnread = chats.some((chat: any) => 
          chat.unreadCount && chat.unreadCount > 0
        );
        
        setHasUnreadMessages(hasUnread);
      } catch (error) {
        console.error("Error checking unread messages:", error);
      }
    };

    // Initial check
    checkUnreadMessages();

    // Poll every 1.5 seconds when not in messages section for faster notification
    const interval = setInterval(checkUnreadMessages, 1500);

    return () => clearInterval(interval);
  }, [user, section]);

  // Prepare context value
  const contextValue: DashboardContextType = {
    user,
    user_data,
    friendRequests,
    markNotificationAsRead,
    fetchFriendRequests,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="flex flex-row text-white">
        <SideBar
          active_user={user as UserInter}
          user_data={user_data as UserDataInter}
          hasUnreadNotifications={hasUnreadNotifications}
          hasUnreadMessages={hasUnreadMessages}
        />
        {/* Render child routes */}
        <Outlet />
      </div>
    </DashboardContext.Provider>
  );
}
