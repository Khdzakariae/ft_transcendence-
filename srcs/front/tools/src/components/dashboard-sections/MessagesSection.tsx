import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  MdSend,
  MdArrowBack,
  MdAdd,
  MdClose,
  MdSearch,
  MdMessage,
  MdGroup,
  MdBlock,
  MdPersonAdd,
  MdDelete,
  MdSettings,
  MdLock,
  MdLockOpen,
  MdSportsEsports,
  MdAdminPanelSettings,
  MdVolumeOff,
  MdExitToApp,
  MdCheck,
} from "react-icons/md";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { useDashboardContext } from "../../Pages/Dashboard";

// ============== INTERFACES ==============
interface ChatParticipant {
  id: string;
  name: string | null;
  avatar: string | null;
  onlineStatus: boolean;
  isSelf: boolean;
  role?: "owner" | "admin" | "member"; // Channel roles
  isBlocked?: boolean;
  isMuted?: boolean;
  mutedUntil?: string | null;
}

interface LastMessage {
  content: string;
  createdAt: string;
  senderId: string;
}

interface Chat {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  lastMessage: LastMessage | null;
  lastMessageAt: string | null;
  participants: ChatParticipant[];
  unreadCount?: number;
  isChannel?: boolean; // Distinguishes channels from groups
  isPasswordProtected?: boolean;
  ownerId?: string;
  typingUsers?: string[];
}

interface Message {
  id: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  senderId: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  onlineStatus: boolean;
  isBlocked?: boolean;
}

// ============== API HELPERS ==============
const api = {
  getChats: async () => {
    const res = await fetch("http://localhost:3000/api/v1/chats", {
      credentials: "include",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  getMessages: async (chatId: string, limit = 50) => {
    const res = await fetch(
      `http://localhost:3000/api/v1/chats/${chatId}/messages?limit=${limit}`,
      { credentials: "include" }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  sendMessage: async (
    chatId: string,
    content: string,
    type: "text" | "image" | "file" = "text"
  ) => {
    const res = await fetch(
      `http://localhost:3000/api/v1/chats/${chatId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, type }),
      }
    );
    return res.json();
  },

  createChat: async (userId: string) => {
    const res = await fetch("http://localhost:3000/api/v1/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  createGroup: async (name: string, participantIds: string[]) => {
    const res = await fetch("http://localhost:3000/api/v1/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isGroup: true, name, participantIds }),
    });
    return res.json();
  },

  updateChat: async (chatId: string, updates: { name?: string; avatar?: string }) => {
    const res = await fetch(`http://localhost:3000/api/v1/chats/${chatId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  addParticipants: async (chatId: string, userIds: string[]) => {
    const res = await fetch(
      `http://localhost:3000/api/v1/chats/${chatId}/participants`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userIds }),
      }
    );
    return res.json();
  },

  removeParticipant: async (chatId: string, userId: string) => {
    const res = await fetch(
      `http://localhost:3000/api/v1/chats/${chatId}/participants/${userId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    return res.json();
  },

  searchUsers: async (searchTerm: string) => {
    const res = await fetch(
      `http://localhost:3000/api/v1/user/search?name=${encodeURIComponent(searchTerm)}`,
      { credentials: "include" }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  getFriends: async () => {
    const res = await fetch("http://localhost:3000/api/v1/friends", {
      credentials: "include",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  blockUser: async (userId: string) => {
    const res = await fetch("http://localhost:3000/api/v1/friends/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  unblockUser: async (userId: string) => {
    const res = await fetch(
      `http://localhost:3000/api/v1/friends/block/${userId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    return res.json();
  },
};

// ============== MAIN COMPONENT ==============
export function MessagesSection(): JSX.Element {
  const { user } = useDashboardContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showJoinChannelModal, setShowJoinChannelModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Friend | null>(
    null
  );

  // Friends & Search
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Predefined stylish avatars for groups
  const groupAvatars = [
    "https://api.dicebear.com/7.x/shapes/svg?seed=group1&backgroundColor=FF6B00",
    "https://api.dicebear.com/7.x/shapes/svg?seed=team&backgroundColor=00D9FF",
    "https://api.dicebear.com/7.x/shapes/svg?seed=squad&backgroundColor=9333EA",
    "https://api.dicebear.com/7.x/shapes/svg?seed=crew&backgroundColor=10B981",
  ];

  // Group creation
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(groupAvatars[0]);
  const [groupPassword, setGroupPassword] = useState("");

  // Channel features
  const [channelPassword, setChannelPassword] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);
  const currentChatIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  // Typing indicator
  const [typingUsers] = useState<{ [chatId: string]: string[] }>(
    {}
  );

  // ============== FETCH FUNCTIONS ==============
  const fetchChats = useCallback(async (abortSignal?: AbortSignal) => {
      setLoading(true);
      setChatsError(null);

      try {
      const data = await api.getChats();
      if (!abortSignal?.aborted && Array.isArray(data)) {
        setChats(data);
        return data;
        }
        return [];
      } catch (err: any) {
      if (!abortSignal?.aborted) {
          setChatsError(err.message || "Failed to load chats");
        }
        return [];
      } finally {
        if (!abortSignal?.aborted) {
          setLoading(false);
        }
      }
  }, []);

  const fetchMessages = useCallback(
    async (chatId: string, abortSignal?: AbortSignal, silent: boolean = false) => {
      if (!silent) {
        setMessagesLoading(true);
      }
      setMessagesError(null);

      try {
        const data = await api.getMessages(chatId);

        if (currentChatIdRef.current !== chatId || abortSignal?.aborted) {
          return;
        }

        if (Array.isArray(data)) {
          const sortedMessages: Message[] = data.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(sortedMessages);
        } else {
          setMessages([]);
        }
      } catch (err: any) {
        if (
          err.name !== "AbortError" &&
          currentChatIdRef.current === chatId &&
          !abortSignal?.aborted
        ) {
          if (!silent) {
            setMessagesError(err.message || "Failed to load messages");
          }
          setMessages([]);
        }
      } finally {
        if (currentChatIdRef.current === chatId && !abortSignal?.aborted) {
          if (!silent) {
            setMessagesLoading(false);
          }
        }
      }
    },
    []
  );

  const fetchFriends = useCallback(async () => {
    try {
      const data = await api.getFriends();
      if (Array.isArray(data)) {
        const validatedFriends = data
          .filter((f: any) => f && f.user && f.user.id)
          .map((f: any) => ({
            id: f.user.id,
            name: f.user.name || null,
            email: f.user.email || null,
            avatar: f.user.avatar || null,
            onlineStatus: f.user.onlineStatus || false,
          }));
        setFriends(validatedFriends);
      }
    } catch (err: any) {
      console.error("Failed to fetch friends:", err);
    }
  }, []);

  const searchUsers = useCallback(
    async (term: string, abortSignal?: AbortSignal) => {
      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const data = await api.searchUsers(term);
        if (!abortSignal?.aborted && Array.isArray(data)) {
          const results = data
            .filter((u: any) => u && u.id && u.id !== user?.id)
            .map((u: any) => ({
              id: u.id,
              name: u.name || null,
              email: u.email || null,
              avatar: u.avatar || null,
              onlineStatus: u.onlineStatus || false,
            }));
          setSearchResults(results);
        }
      } catch (err: any) {
        if (!abortSignal?.aborted) {
          console.error("Search failed:", err);
          setSearchResults([]);
        }
      } finally {
        if (!abortSignal?.aborted) {
          setIsSearching(false);
        }
      }
    },
    [user]
  );

  // ============== CHAT ACTIONS ==============
  const createChat = async (friendId: string) => {
    if (!friendId) return;

    try {
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroup &&
          chat.participants &&
          chat.participants.some((p) => p.id === friendId && !p.isSelf)
      );

      if (existingChat) {
        handleSelectChat(existingChat);
        setShowNewChatModal(false);
        return;
      }

      const response = await api.createChat(friendId);
      if (response.data && response.data.id) {
        await fetchChats();
        const updatedChats = await fetchChats();
        const newChat = updatedChats.find((c) => c.id === response.data.id);
        if (newChat) {
          handleSelectChat(newChat);
        }
      }
      setShowNewChatModal(false);
    } catch (err: any) {
      console.error("Failed to create chat:", err);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    try {
      const response = await api.createGroup(groupName.trim(), selectedMembers);
      if (response.data) {
        // Update group avatar and password if provided
        const updates: { avatar?: string; password?: string } = {};
        if (selectedAvatar) {
          updates.avatar = selectedAvatar;
        }
        // Note: Password handling would need backend support
        // This is a placeholder for when the backend implements password-protected groups
        if (groupPassword.trim()) {
          console.log("Group password set:", groupPassword);
          // updates.password = groupPassword; // Uncomment when backend supports it
        }
        
        if (Object.keys(updates).length > 0) {
          await api.updateChat(response.data.id, updates);
        }

        await fetchChats();
        setShowCreateGroupModal(false);
        setGroupName("");
        setSelectedMembers([]);
        setSelectedAvatar(groupAvatars[0]);
        setGroupPassword("");
      }
    } catch (err: any) {
      console.error("Failed to create group:", err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newMessage.trim() ||
      !selectedChat ||
      sendingMessage ||
      isSendingRef.current
    ) {
      return;
    }

    isSendingRef.current = true;
    const messageContent = newMessage.trim();
    setSendingMessage(true);
    setSendError(null);
    setNewMessage("");

    try {
      const response = await api.sendMessage(
        selectedChat.id,
        messageContent,
        "text"
      );
      if (response.data) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === response.data.id);
          if (messageExists) return prev;
          return [...prev, response.data];
        });

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage: {
                    content: response.data.content,
                    createdAt: response.data.createdAt,
                    senderId: response.data.senderId,
                  },
                  lastMessageAt: response.data.createdAt,
                }
              : chat
          )
        );
      }
    } catch (err: any) {
      setSendError(err.message || "Failed to send message");
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
      isSendingRef.current = false;
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 50);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await api.blockUser(userId);
      
      // Add system message to chat
      if (selectedChat && !selectedChat.isGroup) {
        const systemMessage: Message = {
          id: `sys-${Date.now()}`,
          content: "You blocked this user. Their messages will be hidden.",
          type: "system",
          senderId: "system",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }

      setShowUserProfileModal(false);
    } catch (err) {
      console.error("Failed to block user:", err);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await api.unblockUser(userId);
      
      if (selectedChat && !selectedChat.isGroup) {
        const systemMessage: Message = {
          id: `sys-${Date.now()}`,
          content: "You unblocked this user.",
          type: "system",
          senderId: "system",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }

      setShowUserProfileModal(false);
    } catch (err) {
      console.error("Failed to unblock user:", err);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    // If the same chat is already selected, don't fetch messages again
    if (selectedChat?.id === chat.id) {
      return;
    }

    currentChatIdRef.current = chat.id;
    isInitialLoadRef.current = true; // Mark as initial load for instant scroll
    setMessages([]);
    setMessagesError(null);
    setSendError(null);
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedChat) return;

    try {
      await api.removeParticipant(selectedChat.id, memberId);
      await fetchChats();
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  const handleLeaveChannel = async () => {
    if (!selectedChat || !user) return;

    try {
      await api.removeParticipant(selectedChat.id, user.id);
      setSelectedChat(null);
      await fetchChats();
      setShowGroupSettingsModal(false);
    } catch (err) {
      console.error("Failed to leave channel:", err);
    }
  };

  // ============== EFFECTS ==============
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    fetchChats(controller.signal);
    fetchFriends();

    return () => {
      controller.abort();
    };
  }, [user, fetchChats, fetchFriends]);

  useEffect(() => {
    if (!showNewChatModal || friends.length > 0) return;

    fetchFriends();
  }, [showNewChatModal, fetchFriends, friends.length]);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // Scroll instantly when opening a chat, smoothly for new messages
      const scrollBehavior = isInitialLoadRef.current ? "auto" : "smooth";
      messagesEndRef.current.scrollIntoView({ behavior: scrollBehavior });
      // Reset the initial load flag after first scroll
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!showNewChatModal) return;

    const controller = new AbortController();
    const delaySearch = setTimeout(() => {
      searchUsers(searchTerm, controller.signal);
    }, 300);

    return () => {
      clearTimeout(delaySearch);
      controller.abort();
    };
  }, [searchTerm, showNewChatModal, searchUsers]);

  useEffect(() => {
    if (selectedChat && messageInputRef.current) {
      const timer = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedChat]);

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close modals in priority order (last opened first)
        if (showUserProfileModal) {
          setShowUserProfileModal(false);
          setSelectedUserProfile(null);
        } else if (showGroupSettingsModal) {
          setShowGroupSettingsModal(false);
        } else if (showJoinChannelModal) {
          setShowJoinChannelModal(false);
          setChannelPassword("");
        } else if (showCreateGroupModal) {
          setShowCreateGroupModal(false);
          setGroupName("");
          setSelectedMembers([]);
          setSelectedAvatar(groupAvatars[0]);
          setGroupPassword("");
        } else if (showNewChatModal) {
    setShowNewChatModal(false);
    setSearchTerm("");
    setSearchResults([]);
        }
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [
    showNewChatModal,
    showCreateGroupModal,
    showGroupSettingsModal,
    showUserProfileModal,
    showJoinChannelModal,
  ]);

  // ============== HELPER FUNCTIONS ==============
  const getChatDisplayName = useCallback((chat: Chat): string => {
    if (chat.isGroup || chat.isChannel) {
      return chat.name || "Group Chat";
    }
    if (!chat.participants || chat.participants.length === 0) {
      return "Unknown User";
    }
    const otherParticipant = chat.participants.find((p) => !p.isSelf);
    return otherParticipant?.name || "Unknown User";
  }, []);

  const getChatAvatar = useCallback((chat: Chat): string => {
    if (chat.avatar) return chat.avatar;
    if (
      !chat.isGroup &&
      !chat.isChannel &&
      chat.participants &&
      chat.participants.length > 0
    ) {
      const otherParticipant = chat.participants.find((p) => !p.isSelf);
      return otherParticipant?.avatar || "";
    }
    return "";
  }, []);

  const isOnline = useCallback((chat: Chat): boolean => {
    if (chat.isGroup || chat.isChannel) return false;
    if (!chat.participants || chat.participants.length === 0) return false;
    const otherParticipant = chat.participants.find((p) => !p.isSelf);
    return otherParticipant?.onlineStatus || false;
  }, []);

  const formatTimestamp = useCallback((timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Unknown";

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  }, []);

  const chatsWithMessages = useMemo(() => {
    return chats
      .filter((chat) => chat.lastMessage !== null)
      .sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [chats]);

  const displayFriends = useMemo(() => {
    return searchTerm.trim() ? searchResults : friends;
  }, [searchTerm, searchResults, friends]);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  // ============== RENDER ==============
  return (
    <div className="bg-primary-bg h-screen w-full text-white font-primary flex overflow-hidden">
      {/* Chat List Sidebar */}
      <div
        className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 border-r border-white/10 bg-primary-elements h-full`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Messages</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinChannelModal(true)}
                className="p-2 rounded-lg bg-secondary-btn/20 text-secondary-btn hover:bg-secondary-btn hover:text-primary-bg transition-all duration-300 hover:scale-110"
                title="Join Channel"
              >
                <MdAdd size={24} />
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="p-2 rounded-lg bg-primary-btn/20 text-primary-btn hover:bg-primary-btn hover:text-primary-bg transition-all duration-300 hover:scale-110"
                title="Create Group"
              >
                <MdGroup size={24} />
              </button>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-lg bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 hover:scale-110"
              title="New Chat"
            >
                <MdMessage size={24} />
            </button>
            </div>
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {chatsError && (
            <div className="m-2 p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
              {chatsError}
            </div>
          )}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-white/60 animate-pulse">Loading chats...</p>
            </div>
          ) : chatsWithMessages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MdMessage className="mx-auto text-white/30 mb-4" size={64} />
              <p className="text-white/60 text-lg mb-2">No chats yet</p>
              <p className="text-white/40 text-sm mb-4">
                Start a conversation with your friends
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white hover:bg-[#FF8C33] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#FF6B00]/50"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chatsWithMessages.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                    selectedChat?.id === chat.id
                      ? "bg-primary-btn/10 border-l-4 border-l-[#FF6B00] border-r border-t border-b border-primary-btn/30 shadow-lg"
                      : "hover:bg-primary-bg/50 border border-transparent hover:border-l-2 hover:border-l-[#FF6B00]/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    {getChatAvatar(chat) && (
                      <LazyLoadingImage
                        dimension={{
                          width: "w-12",
                          height: "h-12",
                        }}
                        loading={loaded}
                      >
                        <img
                          src={getChatAvatar(chat)}
                          alt="chat avatar"
                          className={`w-12 h-12 rounded-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
                          loading="lazy"
                          onLoad={() => setLoaded(true)}
                        />
                        {!loaded && (
                          <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                        )}
                      </LazyLoadingImage>
                    )}
                    {!chat.isGroup && !chat.isChannel && isOnline(chat) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                    )}
                    {(chat.isGroup || chat.isChannel) && (
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-elements rounded-full flex items-center justify-center border-2 border-primary-elements">
                        {chat.isChannel ? (
                          <MdGroup size={14} className="text-secondary-btn" />
                        ) : (
                          <MdGroup size={14} className="text-primary-btn" />
                        )}
                      </div>
                    )}
                    {chat.isPasswordProtected && (
                      <div className="absolute top-0 right-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-primary-elements">
                        <MdLock size={12} className="text-primary-bg" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate flex items-center gap-1">
                        {getChatDisplayName(chat)}
                        {chat.isChannel && (
                          <span className="text-xs text-secondary-btn">(Channel)</span>
                        )}
                      </p>
                      {chat.lastMessageAt && (
                        <span className="text-xs font-medium text-[#FF6B00]/70">
                          {formatTimestamp(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm truncate text-white/60">
                        {user && chat.lastMessage.senderId === user.id && (
                          <span className="text-[#FF6B00] font-medium">You: </span>
                        )}
                        {chat.lastMessage.content || "(No content)"}
                      </p>
                    )}
                    {(chat.isGroup || chat.isChannel) && chat.participants && (
                      <p className="text-xs text-white/40">
                        {chat.participants.length} members
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div
        className={`${selectedChat ? "flex" : "hidden md:flex"} flex-col flex-1 h-full overflow-hidden`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-primary-elements flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdArrowBack size={24} />
              </button>
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  if (!selectedChat.isGroup && !selectedChat.isChannel) {
                    const otherUser = selectedChat.participants?.find((p) => !p.isSelf);
                    if (otherUser) {
                      setSelectedUserProfile({
                        id: otherUser.id,
                        name: otherUser.name,
                        email: null,
                        avatar: otherUser.avatar,
                        onlineStatus: otherUser.onlineStatus,
                        isBlocked: otherUser.isBlocked,
                      });
                      setShowUserProfileModal(true);
                    }
                  }
                }}
              >
                {getChatAvatar(selectedChat) && (
                  <LazyLoadingImage
                    dimension={{
                      width: "w-10",
                      height: "h-10",
                    }}
                    loading={loaded}
                  >
                    <img
                      src={getChatAvatar(selectedChat)}
                      alt="chat avatar"
                      className={`w-10 h-10 rounded-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
                      loading="lazy"
                      onLoad={() => setLoaded(true)}
                    />
                    {!loaded && (
                      <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                    )}
                  </LazyLoadingImage>
                )}
                {!selectedChat.isGroup &&
                  !selectedChat.isChannel &&
                  isOnline(selectedChat) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  {getChatDisplayName(selectedChat)}
                  {selectedChat.isChannel && (
                    <span className="text-xs text-secondary-btn px-2 py-0.5 rounded bg-secondary-btn/10">
                      Channel
                    </span>
                  )}
                  {selectedChat.isPasswordProtected && (
                    <MdLock size={16} className="text-yellow-500" />
                  )}
                </h3>
                {!selectedChat.isGroup &&
                  !selectedChat.isChannel &&
                  isOnline(selectedChat) && (
                  <p className="text-xs text-[#FF6B00] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-pulse"></span>
                    Online
                  </p>
                )}
                {!selectedChat.isGroup &&
                  !selectedChat.isChannel &&
                  !isOnline(selectedChat) && (
                  <p className="text-xs text-white/50">Offline</p>
                  )}
                {(selectedChat.isGroup || selectedChat.isChannel) && (
                  <p className="text-xs text-white/60">
                    {selectedChat.participants?.length || 0} members
                  </p>
                )}
              </div>
              {(selectedChat.isGroup || selectedChat.isChannel) && (
                <button
                  onClick={() => setShowGroupSettingsModal(true)}
                  className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
                  title="Group Settings"
                >
                  <MdSettings size={24} />
                </button>
              )}
              {!selectedChat.isGroup && !selectedChat.isChannel && (
                <button
                  onClick={() => {
                    alert("Send Pong challenge! (Feature coming soon)");
                  }}
                  className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors text-[#FF6B00]"
                  title="Challenge to Pong"
                >
                  <MdSportsEsports size={24} />
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-primary-bg">
              {messagesError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
                  {messagesError}
                </div>
              )}
              {messagesLoading ? (
                <div className="text-center py-12">
                  <p className="text-white/60 animate-pulse">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No messages yet</p>
                  <p className="text-white/40 text-sm mt-2">
                    Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = user && message.senderId === user.id;
                    const isSystemMessage = message.type === "system";

                    if (isSystemMessage) {
                      return (
                        <div
                          key={message.id}
                          className="flex justify-center"
                        >
                          <div className="bg-white/10 text-white/70 px-4 py-2 rounded-full text-sm max-w-md text-center border border-white/10">
                            {message.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? "bg-primary-btn text-primary-bg"
                              : "bg-primary-elements text-white"
                          }`}
                        >
                          {!isOwnMessage &&
                            (selectedChat.isGroup || selectedChat.isChannel) &&
                            message.sender && (
                              <p className="text-xs text-primary-btn font-semibold mb-1">
                                {message.sender.name || "Unknown"}
                              </p>
                            )}
                          {message.type === "image" && message.fileUrl && (
                            <img
                              src={message.fileUrl}
                              alt="shared"
                              className="rounded-lg mb-2 max-w-xs"
                            />
                          )}
                          {message.type === "file" && message.fileUrl && (
                            <div className="flex items-center gap-2 mb-2">
                              <MdMessage size={20} />
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {message.fileName || "Download file"}
                              </a>
                            </div>
                            )}
                          <p className="break-words">
                            {message.content || "(Empty message)"}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? "text-primary-bg/70" : "text-white/50"
                            }`}
                          >
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )
                              : "Unknown time"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {typingUsers[selectedChat.id] &&
                    typingUsers[selectedChat.id].length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-primary-elements text-white/60 px-4 py-2 rounded-2xl text-sm italic">
                          {typingUsers[selectedChat.id].join(", ")} typing...
                        </div>
                      </div>
                    )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-primary-elements flex-shrink-0">
              {sendError && (
                <div className="mb-2 p-2 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
                  {sendError}
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                      sendMessage(e as any);
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-white placeholder:text-white/40 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 disabled:opacity-50 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-3 rounded-xl bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-[#FF6B00]/30"
                >
                  <MdSend size={20} />
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-primary-bg h-full">
            <div className="text-center">
              <MdMessage className="mx-auto text-white/20 mb-4" size={80} />
              <h3 className="text-xl font-semibold text-white/70 mb-2">
                Select a chat to start messaging
              </h3>
              <p className="text-white/50">
                Choose a conversation from the list or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============== MODALS ============== */}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-elements rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Start New Chat</h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <MdSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search friends by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-primary-bg pl-10 pr-4 py-2 text-white placeholder:text-white/40 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 transition-all duration-200"
                  autoFocus
                />
              </div>
              {!searchTerm && friends.length > 0 && (
                <p className="text-xs text-white/50 mt-2">
                  {friends.length} friend{friends.length !== 1 ? "s" : ""} available
                </p>
              )}
              {searchTerm && (
                <p className="text-xs text-white/50 mt-2">
                  {isSearching
                    ? "Searching..."
                    : `${displayFriends.length} result${displayFriends.length !== 1 ? "s" : ""} found`}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {displayFriends.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">
                    {searchTerm ? "No friends found" : "No friends yet"}
                  </p>
                  <p className="text-white/40 text-sm mt-2">
                    {searchTerm
                      ? "Try a different search term"
                      : "Add friends to start chatting"}
                  </p>
                </div>
              ) : (
                      <div className="space-y-2">
                  {displayFriends.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => createChat(friend.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#FF6B00] hover:bg-primary-bg/50 transition-all duration-200 hover:shadow-md hover:shadow-[#FF6B00]/20"
                          >
                            <div className="relative shrink-0">
                              {friend.avatar && (
                                  <img
                                    src={friend.avatar}
                            alt={friend.name || "User"}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                              )}
                              {friend.onlineStatus && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-semibold truncate">
                                {friend.name || "Unknown"}
                              </p>
                              <p className="text-sm text-white/60 truncate">
                                {friend.email || ""}
                              </p>
                              {friend.onlineStatus && (
                          <p className="text-xs text-green-400 mt-0.5">Online</p>
                              )}
                            </div>
                          </button>
                        ))}
                            </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-elements rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Create Group Chat</h3>
              <button
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setGroupName("");
                  setSelectedMembers([]);
                  setSelectedAvatar(groupAvatars[0]);
                  setGroupPassword("");
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Choose Group Avatar
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {groupAvatars.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 ${
                        selectedAvatar === avatar
                          ? "ring-4 ring-primary-btn shadow-lg shadow-primary-btn/50 scale-110"
                          : "ring-2 ring-white/20 hover:ring-primary-btn/60 hover:scale-105 hover:shadow-md"
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-full object-cover bg-primary-bg"
                      />
                      {selectedAvatar === avatar && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-btn/30 to-transparent flex items-center justify-center backdrop-blur-[1px]">
                          <div className="bg-primary-btn rounded-full p-1.5 shadow-lg">
                            <MdCheck className="text-white" size={20} />
                          </div>
                        </div>
                      )}
                          </button>
                        ))}
                      </div>
                {!selectedAvatar && (
                  <p className="text-xs text-white/50 mt-2">
                    💡 Select an avatar to represent your group
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full rounded-lg border border-white/10 bg-primary-bg px-4 py-2 text-white placeholder:text-white/40 focus:border-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 transition-all duration-200"
                />
              </div>

              {/* Optional Password */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MdLock size={16} className="text-yellow-500" />
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={groupPassword}
                  onChange={(e) => setGroupPassword(e.target.value)}
                  placeholder="Set a password to protect this group..."
                  className="w-full rounded-lg border border-white/10 bg-primary-bg px-4 py-2 text-white placeholder:text-white/40 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all duration-200"
                />
                <p className="text-xs text-white/50 mt-1.5">
                  If set, members will need this password to join the group
                          </p>
                        </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Members * (At least 1)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-primary-bg">
                  {friends.length === 0 ? (
                    <p className="text-center text-white/60 py-4">
                      No friends available
                    </p>
                  ) : (
                    friends.map((friend) => (
                      <label
                        key={friend.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          selectedMembers.includes(friend.id)
                            ? "bg-primary-btn/20 border border-primary-btn/50"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, friend.id]);
                            } else {
                              setSelectedMembers(
                                selectedMembers.filter((id) => id !== friend.id)
                              );
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <img
                          src={friend.avatar || ""}
                          alt={friend.name || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{friend.name || "Unknown"}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-white/50 mt-2">
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""}{" "}
                  selected
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
                          <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedMembers.length === 0}
                className="w-full px-4 py-3 rounded-xl bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
              >
                <MdGroup size={20} />
                Create Group
              </button>
            </div>
          </div>
                        </div>
                      )}

      {/* Group Settings Modal */}
      {showGroupSettingsModal && selectedChat && (selectedChat.isGroup || selectedChat.isChannel) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-elements rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {selectedChat.isChannel ? "Channel" : "Group"} Settings
              </h3>
                          <button
                onClick={() => setShowGroupSettingsModal(false)}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Channel/Group Info */}
              <div className="text-center">
                <img
                  src={getChatAvatar(selectedChat)}
                  alt={getChatDisplayName(selectedChat)}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-xl font-bold mb-1">
                  {getChatDisplayName(selectedChat)}
                </h3>
                <p className="text-white/60 text-sm">
                  {selectedChat.participants?.length || 0} members
                </p>
              </div>

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold flex items-center gap-2">
                    <MdGroup size={18} />
                    Members
                  </h4>
                  {selectedChat.ownerId === user?.id && (
                    <button
                      onClick={() => {
                        // TODO: Implement add members
                        alert("Add members feature coming soon!");
                      }}
                      className="p-1.5 rounded-lg bg-primary-btn/20 text-primary-btn hover:bg-primary-btn hover:text-primary-bg transition-all"
                      title="Add members"
                    >
                      <MdPersonAdd size={18} />
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedChat.participants?.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-primary-bg hover:bg-primary-bg/70 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={participant.avatar || ""}
                          alt={participant.name || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {participant.name || "Unknown"}
                            {participant.isSelf && (
                              <span className="text-xs text-white/60 ml-1">(You)</span>
                            )}
                          </p>
                          {participant.role && participant.role !== "member" && (
                            <p className="text-xs text-secondary-btn flex items-center gap-1">
                              {participant.role === "owner" && (
                                <>
                                  <MdAdminPanelSettings size={12} />
                                  Owner
                                </>
                              )}
                              {participant.role === "admin" && (
                                <>
                                  <MdAdminPanelSettings size={12} />
                                  Admin
                                </>
                              )}
                                </p>
                              )}
                            </div>
                            </div>
                      {selectedChat.ownerId === user?.id &&
                        !participant.isSelf && (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                handleRemoveMember(participant.id)
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/20 transition-all"
                              title="Remove member"
                            >
                              <MdDelete size={16} />
                          </button>
                            {selectedChat.isChannel && (
                              <>
                                <button
                                  onClick={() => {
                                    alert("Mute feature coming soon!");
                                  }}
                                  className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-500/20 transition-all"
                                  title="Mute member"
                                >
                                  <MdVolumeOff size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    alert("Ban feature coming soon!");
                                  }}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/20 transition-all"
                                  title="Ban member"
                                >
                                  <MdBlock size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                    </div>
                        ))}
                      </div>
              </div>

              {/* Channel-specific actions */}
              {selectedChat.isChannel && selectedChat.ownerId === user?.id && (
                <div className="space-y-2">
                  <h4 className="font-bold mb-2">Channel Settings</h4>
                  <button
                    onClick={() => {
                      alert("Password protection feature coming soon!");
                    }}
                    className="w-full p-3 rounded-lg bg-primary-bg hover:bg-primary-bg/70 transition-all flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {selectedChat.isPasswordProtected ? (
                        <>
                          <MdLock size={18} />
                          Change Password
                        </>
                      ) : (
                        <>
                          <MdLockOpen size={18} />
                          Add Password Protection
                    </>
                  )}
                    </span>
                  </button>
                </div>
              )}

              {/* Leave/Delete actions */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                {selectedChat.ownerId === user?.id ? (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete this ${selectedChat.isChannel ? "channel" : "group"}?`
                        )
                      ) {
                        alert("Delete feature coming soon!");
                      }
                    }}
                    className="w-full p-3 rounded-lg bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <MdDelete size={18} />
                    Delete {selectedChat.isChannel ? "Channel" : "Group"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to leave this ${selectedChat.isChannel ? "channel" : "group"}?`
                        )
                      ) {
                        handleLeaveChannel();
                      }
                    }}
                    className="w-full p-3 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <MdExitToApp size={18} />
                    Leave {selectedChat.isChannel ? "Channel" : "Group"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfileModal && selectedUserProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-elements rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">User Profile</h3>
              <button
                onClick={() => {
                  setShowUserProfileModal(false);
                  setSelectedUserProfile(null);
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 text-center space-y-6">
              <div>
                <img
                  src={selectedUserProfile.avatar || ""}
                  alt={selectedUserProfile.name || "User"}
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-2xl font-bold">
                  {selectedUserProfile.name || "Unknown"}
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  {selectedUserProfile.email || ""}
                </p>
                {selectedUserProfile.onlineStatus ? (
                  <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </p>
                ) : (
                  <p className="text-white/50 text-sm mt-2">Offline</p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    alert("Pong challenge feature coming soon!");
                    setShowUserProfileModal(false);
                  }}
                  className="w-full p-3 rounded-xl bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                >
                  <MdSportsEsports size={20} />
                  Challenge to Pong
                </button>

                {selectedUserProfile.isBlocked ? (
                  <button
                    onClick={() => handleUnblockUser(selectedUserProfile.id)}
                    className="w-full p-3 rounded-xl bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                  >
                    <MdBlock size={20} />
                    Unblock User
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to block ${selectedUserProfile.name}?`
                        )
                      ) {
                        handleBlockUser(selectedUserProfile.id);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                  >
                    <MdBlock size={20} />
                    Block User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Channel Modal */}
      {showJoinChannelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-elements rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Join Channel</h3>
              <button
                onClick={() => {
                  setShowJoinChannelModal(false);
                  setChannelPassword("");
                }}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-white/60 text-sm">
                Enter the channel name to join. If it's password-protected, you'll
                need to provide the password.
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Channel Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter channel name..."
                  className="w-full rounded-lg border border-white/10 bg-primary-bg px-4 py-2 text-white placeholder:text-white/40 focus:border-secondary-btn focus:outline-none focus:ring-2 focus:ring-secondary-btn/50 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MdLock size={16} />
                  Password (if required)
                </label>
                <input
                  type="password"
                  value={channelPassword}
                  onChange={(e) => setChannelPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full rounded-lg border border-white/10 bg-primary-bg px-4 py-2 text-white placeholder:text-white/40 focus:border-secondary-btn focus:outline-none focus:ring-2 focus:ring-secondary-btn/50 transition-all duration-200"
                />
              </div>

              <button
                onClick={() => {
                  alert("Join channel feature coming soon!");
                  setShowJoinChannelModal(false);
                }}
                className="w-full p-3 rounded-xl bg-secondary-btn text-primary-bg hover:bg-[#FF8C33] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-bold"
              >
                <MdAdd size={20} />
                Join Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
