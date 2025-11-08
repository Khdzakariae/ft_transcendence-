import { useState, useEffect, useCallback, useRef } from "react";
import { UserInter } from "../../interfaces/UserInterfaces";
import { IoChatbubblesOutline, IoSend } from "react-icons/io5";
import { MdSearch } from "react-icons/md";

interface ChatParticipant {
  id: string;
  name: string;
  avatar: string | null;
  onlineStatus: boolean;
  isSelf: boolean;
}

interface Chat {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  participants: ChatParticipant[];
}

interface Message {
  id: string;
  content: string;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  senderId: string;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  createdAt: string;
}

export function MessagesSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/v1/chats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const data = await response.json();
      if (data.success && data.data) {
        const newChats = Array.isArray(data.data) ? data.data : [];
        setChats((prevChats) => {
          // Ensure selected chat still exists, or select first chat if available
          setSelectedChat((currentSelected) => {
            if (currentSelected) {
              const chatStillExists = newChats.some((chat) => chat.id === currentSelected.id);
              if (!chatStillExists && newChats.length > 0) {
                return newChats[0];
              }
              return currentSelected;
            }
            return null;
          });
          return newChats;
        });
      } else {
        setChats([]);
        setSelectedChat(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(
    async (chatId: string) => {
      setLoadingMessages(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/chats/${chatId}/messages?page=1&limit=100`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        if (data.success) {
          // Handle different response structures
          if (Array.isArray(data.data)) {
            setMessages(data.data);
          } else if (data.data?.messages && Array.isArray(data.data.messages)) {
            setMessages(data.data.messages);
          } else if (data.data && Array.isArray(data.data)) {
            setMessages(data.data);
          } else {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  // Send a message
  const sendMessage = async () => {
    if (!selectedChat || !messageInput.trim() || sendingMessage) return;

    const messageContent = messageInput.trim();
    setMessageInput("");
    setSendingMessage(true);
    setError(null);

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
        let errorMessage = "Failed to send message";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      // Refresh messages after sending
      await fetchMessages(selectedChat.id);
      // Refresh chats to update last message
      await fetchChats();
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      // Restore message input on error
      setMessageInput(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch chats on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  // Auto-select first chat when chats are loaded
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    } else {
      setMessages([]);
    }
  }, [selectedChat, fetchMessages]);

  // Handle Enter key to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get chat display name
  const getChatName = (chat: Chat): string => {
    if (chat.isGroup && chat.name) {
      return chat.name;
    }
    const otherParticipant = chat.participants.find((p) => !p.isSelf);
    return otherParticipant?.name || "Unknown User";
  };

  // Get chat display avatar
  const getChatAvatar = (chat: Chat): string | null => {
    if (chat.isGroup && chat.avatar) {
      return chat.avatar;
    }
    const otherParticipant = chat.participants.find((p) => !p.isSelf);
    return otherParticipant?.avatar || null;
  };

  // Get initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Filter chats based on search term
  const filteredChats = chats.filter((chat) => {
    if (!searchTerm.trim()) return true;
    const chatName = getChatName(chat).toLowerCase();
    return chatName.includes(searchTerm.toLowerCase());
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="bg-primary-bg min-h-screen w-full text-white font-primary flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-primary-elements p-4">
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-white/70 text-sm mt-1">Chat with your friends</p>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-4 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200">
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r border-white/10 bg-primary-elements flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-xl" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-primary-bg pl-10 pr-4 py-2 text-white placeholder:text-white/40 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-white/60 animate-pulse">Loading chats...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center">
                <IoChatbubblesOutline className="mx-auto text-4xl text-white/30 mb-2" />
                <p className="text-white/60">
                  {searchTerm ? "No chats found" : "No chats yet"}
                </p>
                <p className="text-white/40 text-sm mt-2">
                  {searchTerm
                    ? "Try a different search term"
                    : "Start a conversation with a friend"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredChats.map((chat) => {
                  const chatName = getChatName(chat);
                  const chatAvatar = getChatAvatar(chat);
                  const isSelected = selectedChat?.id === chat.id;
                  const otherParticipant = chat.participants.find((p) => !p.isSelf);

                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`w-full p-4 text-left hover:bg-primary-bg/50 transition-colors ${
                        isSelected ? "bg-primary-bg border-l-4 border-primary-btn" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {chatAvatar ? (
                            <img
                              src={chatAvatar}
                              alt={chatName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-btn/30 border-2 border-primary-btn flex items-center justify-center text-sm font-semibold">
                              {getInitials(chatName)}
                            </div>
                          )}
                          {otherParticipant?.onlineStatus && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-elements"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold truncate">{chatName}</p>
                            {chat.lastMessage && (
                              <span className="text-xs text-white/40 shrink-0 ml-2">
                                {new Date(chat.lastMessage.createdAt).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            )}
                          </div>
                          {chat.lastMessage ? (
                            <p className="text-sm text-white/60 truncate">
                              {chat.lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-sm text-white/40 italic">No messages yet</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col bg-primary-bg">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-white/10 bg-primary-elements p-4">
                <div className="flex items-center gap-3">
                  {getChatAvatar(selectedChat) ? (
                    <img
                      src={getChatAvatar(selectedChat)!}
                      alt={getChatName(selectedChat)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-btn/30 border-2 border-primary-btn flex items-center justify-center text-xs font-semibold">
                      {getInitials(getChatName(selectedChat))}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{getChatName(selectedChat)}</p>
                    {selectedChat.isGroup && (
                      <p className="text-xs text-white/60">
                        {selectedChat.participants.length} participants
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {loadingMessages ? (
                  <div className="text-center py-8">
                    <p className="text-white/60 animate-pulse">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <IoChatbubblesOutline className="mx-auto text-5xl text-white/30 mb-4" />
                    <p className="text-white/60">No messages yet</p>
                    <p className="text-white/40 text-sm mt-2">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === user.id;
                    const senderName =
                      message.sender?.name ||
                      (isOwnMessage ? user.name : "Unknown User");
                    const senderAvatar = message.sender?.avatar || null;

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          isOwnMessage ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div className="shrink-0">
                          {senderAvatar ? (
                            <img
                              src={senderAvatar}
                              alt={senderName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-btn/30 border border-primary-btn flex items-center justify-center text-xs font-semibold">
                              {getInitials(senderName)}
                            </div>
                          )}
                        </div>
                        <div
                          className={`flex flex-col max-w-[70%] ${
                            isOwnMessage ? "items-end" : "items-start"
                          }`}
                        >
                          {!selectedChat.isGroup && !isOwnMessage && (
                            <p className="text-xs text-white/50 mb-1">{senderName}</p>
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? "bg-primary-btn text-primary-text"
                                : "bg-primary-elements border border-white/10"
                            }`}
                          >
                            {message.type === "text" ? (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            ) : message.type === "image" && message.fileUrl ? (
                              <img
                                src={message.fileUrl}
                                alt={message.fileName || "Image"}
                                className="max-w-full rounded-lg"
                              />
                            ) : message.fileUrl ? (
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-btn hover:underline"
                              >
                                {message.fileName || "File"}
                              </a>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-white/10 bg-primary-elements p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                    className="flex-1 rounded-lg border border-white/10 bg-primary-bg px-4 py-2 text-white placeholder:text-white/40 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="px-4 py-2 rounded-lg bg-primary-btn text-primary-text hover:bg-primary-btn/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <IoSend size={20} />
                    {sendingMessage ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <IoChatbubblesOutline className="mx-auto text-6xl text-white/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a chat</h3>
                <p className="text-white/60">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
