import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { UserInter } from "../../interfaces/UserInterfaces";
import {
  MdSend,
  MdArrowBack,
  MdAdd,
  MdClose,
  MdSearch,
  MdMessage,
  MdDelete,
} from "react-icons/md";

// Interfaces
interface ChatParticipant {
  id: string;
  name: string | null;
  avatar: string | null;
  onlineStatus: boolean;
  isSelf: boolean;
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
}

interface Message {
  id: string;
  content: string;
  type: "text" | "image" | "file";
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
}

export function MessagesSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false); // Ref to prevent double submissions
  const currentChatIdRef = useRef<string | null>(null); // Track current chat to prevent race conditions
  const isNearBottomRef = useRef(true); // Track if user is at bottom of messages
  const isFreshChatLoadRef = useRef(false); // Track if this is a fresh chat load to force instant scroll
  const lastMessageTimestampRef = useRef<string | null>(null); // Track last message timestamp for polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Track polling interval

  // Fetch all chats
  const fetchChats = useCallback(
    async (abortSignal?: AbortSignal, silent: boolean = false): Promise<Chat[]> => {
      if (!silent) {
        setLoading(true);
      }
      setChatsError(null);

      try {
        const response = await fetch("http://localhost:3000/api/v1/chats", {
          method: "GET",
          credentials: "include",
          signal: abortSignal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await response.json();
        if (data.data && !abortSignal?.aborted) {
          // Update chats while preserving hidden chat IDs
          setChats((prevChats) => {
            const updatedChats = data.data;
            // Merge with existing chats to preserve any local state
            // Update existing chats with new data, add new chats
            const chatMap = new Map(prevChats.map((c) => [c.id, c]));
            updatedChats.forEach((newChat: Chat) => {
              const existingChat = chatMap.get(newChat.id);
              if (existingChat) {
                // Update existing chat with new data (especially lastMessage)
                chatMap.set(newChat.id, newChat);
              } else {
                // Add new chat
                chatMap.set(newChat.id, newChat);
              }
            });
            return Array.from(chatMap.values());
          });
          return data.data;
        }
        return [];
      } catch (err: any) {
        if (err.name !== "AbortError" && !abortSignal?.aborted && !silent) {
          setChatsError(err.message || "Failed to load chats");
        }
        return [];
      } finally {
        if (!abortSignal?.aborted && !silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(
    async (
      chatId: string,
      abortSignal?: AbortSignal,
      mergeNewOnly: boolean = false
    ) => {
      if (!mergeNewOnly) {
        setMessagesLoading(true);
      }
      setMessagesError(null);

      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/chats/${chatId}/messages?limit=50`,
          {
            method: "GET",
            credentials: "include",
            signal: abortSignal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();

        // Only update messages if we're still on the same chat and not aborted
        if (currentChatIdRef.current !== chatId || abortSignal?.aborted) {
          return; // User switched chats, discard these messages
        }

        if (data.data && data.data.length > 0) {
          // Sort messages by createdAt to ensure proper order and remove duplicates
          const uniqueMessages = Array.from(
            new Map(data.data.map((msg: Message) => [msg.id, msg])).values()
          ) as Message[];
          const sortedMessages: Message[] = uniqueMessages.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          if (mergeNewOnly) {
            // Merge with existing messages, keeping only unique ones
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMessages = sortedMessages.filter(
                (m) => !existingIds.has(m.id)
              );
              if (newMessages.length === 0) return prev;

              // Combine and sort
              const combined = [...prev, ...newMessages].sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );
              return combined;
            });

            // Update last message timestamp
            const lastMsg = sortedMessages[sortedMessages.length - 1];
            if (lastMsg) {
              lastMessageTimestampRef.current = lastMsg.createdAt;
            }
          } else {
            // Replace all messages (initial load)
            setMessages(sortedMessages);
            const lastMsg = sortedMessages[sortedMessages.length - 1];
            if (lastMsg) {
              lastMessageTimestampRef.current = lastMsg.createdAt;
            } else {
              lastMessageTimestampRef.current = null;
            }
          }
        } else {
          if (!mergeNewOnly) {
            setMessages([]);
            lastMessageTimestampRef.current = null;
          }
        }
      } catch (err: any) {
        // Only show error if still on same chat and not aborted
        if (
          err.name !== "AbortError" &&
          currentChatIdRef.current === chatId &&
          !abortSignal?.aborted &&
          !mergeNewOnly
        ) {
          setMessagesError(err.message || "Failed to load messages");
          setMessages([]);
        }
      } finally {
        if (currentChatIdRef.current === chatId && !abortSignal?.aborted) {
          if (!mergeNewOnly) {
            setMessagesLoading(false);
          }
        }
      }
    },
    []
  );

  // Fetch friends for new chat
  const fetchFriends = useCallback(async (abortSignal?: AbortSignal) => {
    setFriendsLoading(true);
    setModalError(null);

    try {
      const response = await fetch("http://localhost:3000/api/v1/friends", {
        method: "GET",
        credentials: "include",
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }

      const data = await response.json();
      if (data.data && !abortSignal?.aborted) {
        // API returns friends in format: { friendshipId, friendSince, user: {...} }
        // Extract the user object from each friendship
        const validatedFriends = data.data
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
      if (err.name !== "AbortError" && !abortSignal?.aborted) {
        setModalError(err.message || "Failed to load friends");
      }
    } finally {
      if (!abortSignal?.aborted) {
        setFriendsLoading(false);
      }
    }
  }, []);

  // Search users by name (like in FriendsSection)
  const searchUsers = useCallback(
    async (term: string, abortSignal?: AbortSignal) => {
      if (!term.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setModalError(null);

      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/user/search?name=${encodeURIComponent(term)}`,
          {
            method: "GET",
            credentials: "include",
            signal: abortSignal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();
        if (data.data && !abortSignal?.aborted) {
          // Filter out current user and map to Friend interface
          const results = data.data
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
        if (err.name !== "AbortError" && !abortSignal?.aborted) {
          setModalError(err.message || "Search failed");
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

  // Create new chat with a friend or open existing chat
  const createChat = async (friendId: string) => {
    if (!friendId) {
      setModalError("Invalid friend selection");
      return;
    }

    setModalError(null);
    setCreatingChat(true);

    try {
      // Check if chat already exists with this friend in our LOCAL state
      // (already has complete participant data from fetchChats)
      const existingChatInState = chats.find(
        (chat) =>
          !chat.isGroup &&
          chat.participants &&
          chat.participants.length > 0 &&
          chat.participants.some((p) => p.id === friendId && !p.isSelf)
      );

      if (existingChatInState) {
        // Open existing chat from local state (already has complete data)
        currentChatIdRef.current = existingChatInState.id;
        isFreshChatLoadRef.current = true;
        setMessages([]);
        setMessagesError(null);
        setSelectedChat(existingChatInState);
        fetchMessages(existingChatInState.id);
        closeNewChatModal();
        return;
      }

      // Create new chat
      const response = await fetch("http://localhost:3000/api/v1/chats", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: friendId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create chat");
      }

      const data = await response.json();
      if (data.data && data.data.id) {
        const newChatId = data.data.id;

        // The API returns incomplete chat data (without participant details)
        // Refetch all chats to get the complete data structure
        const updatedChats = await fetchChats();

        // Find the newly created chat in the updated list
        const completeChat = updatedChats.find((c) => c.id === newChatId);

        if (completeChat) {
          currentChatIdRef.current = completeChat.id;
          isFreshChatLoadRef.current = true;
          setMessages([]);
          setMessagesError(null);
          setSelectedChat(completeChat);
          closeNewChatModal();
        } else {
          throw new Error("Failed to find the created chat");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to create chat");
      console.error("Error creating chat:", err);
    } finally {
      setCreatingChat(false);
    }
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Double-submission prevention with ref (immediate, synchronous check)
    if (
      !newMessage.trim() ||
      !selectedChat ||
      sendingMessage ||
      isSendingRef.current
    ) {
      return;
    }

    // Set ref immediately to block any subsequent calls
    isSendingRef.current = true;

    const messageContent = newMessage.trim();
    setSendingMessage(true);
    setSendError(null);
    setNewMessage(""); // Clear input immediately for better UX

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/chats/${selectedChat.id}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageContent,
            type: "text",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();
      if (data.data) {
        // Add message only if it doesn't already exist (prevent duplicates)
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === data.data.id);
          if (messageExists) {
            return prev;
          }
          const newMessages = [...prev, data.data].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          // Update last message timestamp
          lastMessageTimestampRef.current = data.data.createdAt;
          return newMessages;
        });

        // Update the chat's last message - this ensures empty chats become visible
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage: {
                    content: data.data.content,
                    createdAt: data.data.createdAt,
                    senderId: data.data.senderId,
                  },
                  lastMessageAt: data.data.createdAt,
                }
              : chat
          )
        );
      }
    } catch (err: any) {
      setSendError(err.message || "Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSendingMessage(false);
      isSendingRef.current = false; // Release the lock
    }
  };

  // Select a chat
  const handleSelectChat = (chat: Chat) => {
    // Update current chat ref immediately (synchronous)
    currentChatIdRef.current = chat.id;
    // Mark this as a fresh chat load to force instant scroll to bottom
    isFreshChatLoadRef.current = true;
    // Clear messages immediately before switching
    setMessages([]);
    setMessagesError(null);
    setSendError(null);
    lastMessageTimestampRef.current = null; // Reset timestamp for new chat
    setSelectedChat(chat);
    // Fetch messages for the new chat
    fetchMessages(chat.id);
  };

  // Remove a chat from the list (does not delete the chat on server)
  const handleRemoveChat = useCallback(
    (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering chat selection

      // If this is the currently selected chat, clear the selection
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
        currentChatIdRef.current = null;
      }

      // Remove chat from local state
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    },
    [selectedChat]
  );

  // Check if user is near bottom of messages (for auto-scroll)
  const checkIfNearBottom = useCallback(() => {
    const element = messagesEndRef.current?.parentElement;
    if (!element) return false;

    const threshold = 150; // pixels from bottom
    const isNearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight <
      threshold;
    isNearBottomRef.current = isNearBottom;
    return isNearBottom;
  }, []);

  // Scroll to bottom of messages (only if user was already near bottom)
  const scrollToBottom = useCallback(
    (force: boolean = false, instant: boolean = false) => {
      if (force || isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({
          behavior: instant ? "auto" : "smooth",
        });
      }
    },
    []
  );

  // Fetch chats on mount
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    fetchChats(controller.signal);

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch friends when modal opens
  useEffect(() => {
    if (!showNewChatModal || friends.length > 0) return;

    const controller = new AbortController();
    fetchFriends(controller.signal);

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewChatModal]);

  // Auto-scroll to bottom when messages change (if user was near bottom)
  useEffect(() => {
    if (messages.length > 0) {
      // Force instant scroll on fresh chat load (when user clicks on a chat)
      if (isFreshChatLoadRef.current) {
        scrollToBottom(true, true); // Force instant scroll to bottom (no animation)
        isFreshChatLoadRef.current = false; // Reset flag after scrolling
      } else {
        scrollToBottom(false, false); // Use smart scroll with smooth animation (only if near bottom)
      }
    }
  }, [messages, scrollToBottom]);

  // Search users with debounce (like in FriendsSection)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, showNewChatModal]);

  // Poll for new messages in the current chat
  useEffect(() => {
    if (!user || !selectedChat) {
      // Clear polling interval if no chat is selected
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const chatId = selectedChat.id;

    // Poll for new messages every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      // Only poll if we're still on the same chat
      if (currentChatIdRef.current === chatId) {
        fetchMessages(chatId, undefined, true); // mergeNewOnly = true
      }
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedChat?.id]);

  // Poll for chat list updates (to get new messages in other chats)
  useEffect(() => {
    if (!user) return;

    // Poll for chat list updates every 3 seconds
    const chatListInterval = setInterval(() => {
      fetchChats(undefined, true); // silent = true to avoid loading spinner
    }, 3000);

    return () => {
      clearInterval(chatListInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Memoized modal close handler
  const closeNewChatModal = useCallback(() => {
    setShowNewChatModal(false);
    setSearchTerm("");
    setSearchResults([]);
    setModalError(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes modal
      if (e.key === "Escape" && showNewChatModal) {
        closeNewChatModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNewChatModal, closeNewChatModal]);

  // Helper functions - memoized for performance
  const getInitials = useCallback((name?: string | null): string => {
    if (!name || name.trim().length === 0) {
      return "?";
    }
    return name.charAt(0).toUpperCase();
  }, []);

  const getChatDisplayName = useCallback((chat: Chat): string => {
    if (chat.isGroup) {
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
    if (!chat.isGroup && chat.participants && chat.participants.length > 0) {
      const otherParticipant = chat.participants.find((p) => !p.isSelf);
      return otherParticipant?.avatar || "";
    }
    return "";
  }, []);

  const isOnline = useCallback((chat: Chat): boolean => {
    if (chat.isGroup) return false;
    if (!chat.participants || chat.participants.length === 0) return false;
    const otherParticipant = chat.participants.find((p) => !p.isSelf);
    return otherParticipant?.onlineStatus || false;
  }, []);

  const formatTimestamp = useCallback((timestamp: string): string => {
    try {
      const date = new Date(timestamp);

      // Check for invalid date
      if (isNaN(date.getTime())) {
        return "Unknown";
      }

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

  // Memoized computed values for performance optimization
  const chatsWithMessages = useMemo(() => {
    // Filter chats to only show those with messages (exclude empty chats)
    // Sort by most recent message first
    return chats
      .filter((chat) => chat.lastMessage !== null)
      .sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
  }, [chats]);

  // Get list of friend IDs that already have chats WITH messages
  const friendIdsWithChats = useMemo(() => {
    return new Set(
      chatsWithMessages
        .filter(
          (chat) =>
            !chat.isGroup && chat.participants && chat.participants.length > 0
        )
        .map((chat) => {
          const otherParticipant = chat.participants.find((p) => !p.isSelf);
          return otherParticipant?.id;
        })
        .filter((id): id is string => id !== undefined)
    );
  }, [chatsWithMessages]);

  // Use search results if searching, otherwise use friends list
  const displayFriends = useMemo(() => {
    return searchTerm.trim() ? searchResults : friends;
  }, [searchTerm, searchResults, friends]);

  // Separate into those with and without chats for display purposes
  const friendsWithoutChats = useMemo(() => {
    return displayFriends.filter(
      (friend) => !friendIdsWithChats.has(friend.id)
    );
  }, [displayFriends, friendIdsWithChats]);

  const friendsWithChats = useMemo(() => {
    return displayFriends.filter((friend) => friendIdsWithChats.has(friend.id));
  }, [displayFriends, friendIdsWithChats]);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

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
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-lg bg-primary-btn text-primary-bg hover:bg-[#FF6B00] hover:text-white transition-all duration-300 hover:scale-110"
              title="New Chat"
            >
              <MdAdd size={24} />
            </button>
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
                    {getChatAvatar(chat) ? (
                      <img
                        src={getChatAvatar(chat)}
                        alt={getChatDisplayName(chat)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-btn/30 flex items-center justify-center text-lg font-semibold">
                        {getInitials(getChatDisplayName(chat))}
                      </div>
                    )}
                    {!chat.isGroup && isOnline(chat) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">
                        {getChatDisplayName(chat)}
                      </p>
                      {chat.lastMessageAt && (
                        <span className="text-xs text-[#FF6B00] font-medium">
                          {formatTimestamp(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-white/60 truncate">
                        {user && chat.lastMessage.senderId === user.id && (
                          <span className="text-[#FF6B00] font-medium">
                            You:{" "}
                          </span>
                        )}
                        {chat.lastMessage.content || "(No content)"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleRemoveChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 text-white/50 shrink-0"
                    title="Remove from list"
                  >
                    <MdDelete size={18} />
                  </button>
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
              <div className="relative">
                {getChatAvatar(selectedChat) ? (
                  <img
                    src={getChatAvatar(selectedChat)}
                    alt={getChatDisplayName(selectedChat)}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-btn/30 flex items-center justify-center font-semibold">
                    {getInitials(getChatDisplayName(selectedChat))}
                  </div>
                )}
                {!selectedChat.isGroup && isOnline(selectedChat) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {getChatDisplayName(selectedChat)}
                </h3>
                {!selectedChat.isGroup && isOnline(selectedChat) && (
                  <p className="text-xs text-[#FF6B00] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-pulse"></span>
                    Online
                  </p>
                )}
                {!selectedChat.isGroup && !isOnline(selectedChat) && (
                  <p className="text-xs text-white/50">Offline</p>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 bg-primary-bg"
              onScroll={checkIfNearBottom}
            >
              {messagesError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
                  {messagesError}
                </div>
              )}
              {messagesLoading ? (
                <div className="text-center py-12">
                  <p className="text-white/60 animate-pulse">
                    Loading messages...
                  </p>
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
                            selectedChat.isGroup &&
                            message.sender && (
                              <p className="text-xs text-primary-btn font-semibold mb-1">
                                {message.sender.name || "Unknown"}
                              </p>
                            )}
                          <p className="break-words">
                            {message.content || "(Empty message)"}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage
                                ? "text-primary-bg/70"
                                : "text-white/50"
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
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    // Submit on Enter (without modifiers)
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

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary-elements rounded-2xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold">Start New Chat</h3>
              <button
                onClick={closeNewChatModal}
                className="p-2 rounded-lg hover:bg-primary-bg/50 transition-colors"
                title="Close (Esc)"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Search */}
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
                  {friends.length} friend{friends.length !== 1 ? "s" : ""}{" "}
                  available
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

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-sm">
                  {modalError}
                </div>
              )}
              {creatingChat && (
                <div className="mb-4 p-3 rounded-lg bg-primary-btn/20 border border-primary-btn/50 text-white text-sm">
                  Creating chat...
                </div>
              )}
              {friendsLoading || (isSearching && searchTerm) ? (
                <div className="text-center py-12">
                  <p className="text-white/60 animate-pulse">
                    {isSearching ? "Searching..." : "Loading friends..."}
                  </p>
                </div>
              ) : displayFriends.length === 0 ? (
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
                <div className="space-y-3">
                  {/* Friends WITHOUT existing chats - Higher priority */}
                  {friendsWithoutChats.length > 0 && (
                    <>
                      {!searchTerm && (
                        <div className="px-2 pb-1">
                          <p className="text-xs font-bold text-[#FF6B00] uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#FF6B00] rounded-full animate-pulse"></span>
                            New Conversations
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        {friendsWithoutChats.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => createChat(friend.id)}
                            disabled={creatingChat}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-[#FF6B00] hover:bg-primary-bg/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-[#FF6B00]/20"
                          >
                            <div className="relative shrink-0">
                              {friend.avatar ? (
                                <img
                                  src={friend.avatar}
                                  alt={friend.name || "User"}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary-btn/30 flex items-center justify-center text-lg font-semibold">
                                  {getInitials(friend.name)}
                                </div>
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
                                <p className="text-xs text-green-400 mt-0.5">
                                  Online
                                </p>
                              )}
                            </div>
                            <div className="text-[#FF6B00] opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 group-hover:scale-110">
                              <MdAdd size={24} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Friends WITH existing chats - Show to continue conversation */}
                  {friendsWithChats.length > 0 && (
                    <>
                      {!searchTerm && friendsWithoutChats.length > 0 && (
                        <div className="px-2 pt-2">
                          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                            Existing Chats
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        {friendsWithChats.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => createChat(friend.id)}
                            disabled={creatingChat}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-primary-btn hover:bg-primary-bg/50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-primary-btn/20"
                          >
                            <div className="relative shrink-0">
                              {friend.avatar ? (
                                <img
                                  src={friend.avatar}
                                  alt={friend.name || "User"}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary-btn/30 flex items-center justify-center text-lg font-semibold">
                                  {getInitials(friend.name)}
                                </div>
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
                                <p className="text-xs text-green-400 mt-0.5">
                                  Online
                                </p>
                              )}
                            </div>
                            <div className="text-white/50 shrink-0 text-xs">
                              Active chat
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
