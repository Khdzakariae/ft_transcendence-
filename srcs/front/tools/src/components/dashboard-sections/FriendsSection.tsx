import { useState, useEffect, useCallback, useMemo } from "react";
import { UserInter } from "../../interfaces/UserInterfaces";
import { SearchBarFriends } from "../searchBarFriends";
import { MdDelete, MdPerson, MdGroup, MdPersonAdd, MdCheckCircle } from "react-icons/md";

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  onlineStatus: boolean;
}

export function FriendsSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFriendId, setDeletingFriendId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    friendId: string | null;
    friendName: string | null;
  }>({ isOpen: false, friendId: null, friendName: null });

  const fetchFriends = useCallback(async (abortSignal?: AbortSignal) => {
    setLoading(true);
    setError(null);

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
        setError(err.message || "Failed to load friends");
      }
    } finally {
      if (!abortSignal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleDeleteFriend = (friendId: string, friendName: string | null) => {
    setConfirmModal({
      isOpen: true,
      friendId,
      friendName,
    });
  };

  const confirmDeleteFriend = async () => {
    const friendId = confirmModal.friendId;
    if (!friendId) return;

    setConfirmModal({ isOpen: false, friendId: null, friendName: null });
    setDeletingFriendId(friendId);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/friends/${friendId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove friend");
      }

      // Remove friend from local state
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (err: any) {
      setError(err.message || "Failed to remove friend");
    } finally {
      setDeletingFriendId(null);
    }
  };

  const cancelDeleteFriend = () => {
    setConfirmModal({ isOpen: false, friendId: null, friendName: null });
  };

  const getInitials = (name?: string | null): string => {
    if (!name || name.trim().length === 0) {
      return "?";
    }
    return name.charAt(0).toUpperCase();
  };

  // Memoized stats for performance
  const friendsStats = useMemo(() => {
    return {
      total: friends.length,
      online: friends.filter(f => f.onlineStatus).length,
      offline: friends.filter(f => !f.onlineStatus).length,
    };
  }, [friends]);

  // Separate online and offline friends
  const { onlineFriends, offlineFriends } = useMemo(() => {
    return {
      onlineFriends: friends.filter(f => f.onlineStatus),
      offlineFriends: friends.filter(f => !f.onlineStatus),
    };
  }, [friends]);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    fetchFriends(controller.signal);

    return () => {
      controller.abort();
    };
  }, [user, fetchFriends]);

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold animate-pulse">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="bg-primary-bg min-h-screen w-full text-white font-primary overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-[#FF6B00] bg-clip-text text-transparent">
            My Friends
          </h2>
          <p className="text-white/70 text-sm sm:text-base">
            Manage your friends list and connect with others
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && friends.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
            {/* Total Friends */}
            <div className="bg-primary-elements p-4 sm:p-6 rounded-xl border border-white/10 hover:border-[#FF6B00]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF6B00]/20 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] group-hover:bg-[#FF6B00]/20 transition-colors">
                  <MdGroup size={24} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">{friendsStats.total}</p>
                  <p className="text-xs sm:text-sm text-white/60">Total Friends</p>
                </div>
              </div>
            </div>

            {/* Online Friends */}
            <div className="bg-primary-elements p-4 sm:p-6 rounded-xl border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
                  <MdCheckCircle size={24} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">{friendsStats.online}</p>
                  <p className="text-xs sm:text-sm text-white/60">Online Now</p>
                </div>
              </div>
            </div>

            {/* Offline Friends */}
            <div className="bg-primary-elements p-4 sm:p-6 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 group">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 rounded-lg bg-white/5 text-white/60 group-hover:bg-white/10 transition-colors">
                  <MdPerson size={24} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-white/60">{friendsStats.offline}</p>
                  <p className="text-xs sm:text-sm text-white/60">Offline</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 flex items-start gap-3">
            <div className="text-rose-400 mt-0.5">⚠️</div>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Friends List Section */}
        <div className="bg-primary-elements rounded-xl border border-white/10 overflow-hidden mb-6 sm:mb-8">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold">Friends List</h3>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-[#FF6B00] mb-4"></div>
                <p className="text-white/60 animate-pulse">Loading friends...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-block p-6 rounded-full bg-white/5 mb-4">
                  <MdPerson className="text-white/30" size={64} />
                </div>
                <p className="text-white/60 text-lg font-semibold mb-2">No friends yet</p>
                <p className="text-white/40 text-sm mb-6">
                  Start building your network by searching and adding friends below
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30">
                  <MdPersonAdd size={20} />
                  <span className="text-sm font-medium">Search below to add friends</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Online Friends */}
                {onlineFriends.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <h4 className="text-sm font-bold text-green-400 uppercase tracking-wide">
                        Online ({onlineFriends.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {onlineFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:border-green-500/40 hover:bg-green-500/10 transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative shrink-0">
                              {friend.avatar ? (
                                <img
                                  src={friend.avatar}
                                  alt={friend.name || "Friend"}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-green-500/30"
                                />
                              ) : (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C33] flex items-center justify-center text-lg font-semibold border-2 border-green-500/30">
                                  {getInitials(friend.name)}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-primary-elements">
                                <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">
                                {friend.name || "Unknown User"}
                              </p>
                              <p className="text-sm text-white/60 truncate">
                                {friend.email || "No email"}
                              </p>
                              <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                Active now
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFriend(friend.id, friend.name)}
                            disabled={deletingFriendId === friend.id}
                            className="ml-2 px-3 py-2 rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:border-rose-400/60 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 shrink-0"
                            title="Remove friend"
                          >
                            <MdDelete size={18} />
                            <span className="hidden sm:inline text-sm">
                              {deletingFriendId === friend.id ? "Removing..." : "Remove"}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Friends */}
                {offlineFriends.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                      <h4 className="text-sm font-bold text-white/60 uppercase tracking-wide">
                        Offline ({offlineFriends.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {offlineFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-primary-bg/50 hover:border-[#FF6B00]/50 hover:bg-primary-bg transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF6B00]/10"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative shrink-0">
                              {friend.avatar ? (
                                <img
                                  src={friend.avatar}
                                  alt={friend.name || "Friend"}
                                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                              ) : (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-lg font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                                  {getInitials(friend.name)}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white/30 rounded-full border-2 border-primary-elements"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white/90 truncate">
                                {friend.name || "Unknown User"}
                              </p>
                              <p className="text-sm text-white/50 truncate">
                                {friend.email || "No email"}
                              </p>
                              <p className="text-xs text-white/40 mt-0.5">
                                Offline
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteFriend(friend.id, friend.name)}
                            disabled={deletingFriendId === friend.id}
                            className="ml-2 px-3 py-2 rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:border-rose-400/60 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 shrink-0"
                            title="Remove friend"
                          >
                            <MdDelete size={18} />
                            <span className="hidden sm:inline text-sm">
                              {deletingFriendId === friend.id ? "Removing..." : "Remove"}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Friends Section */}
        <div className="bg-primary-elements rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00]">
                <MdPersonAdd size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Add New Friends</h3>
                <p className="text-sm text-white/60">Search and connect with other users</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <SearchBarFriends currentUserId={user.id} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelDeleteFriend}
          ></div>

          {/* Modal */}
          <div className="relative bg-primary-elements border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-rose-500/20 border-2 border-rose-400/40">
                <MdDelete className="text-rose-400" size={40} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-2 text-white">
              Remove Friend?
            </h3>

            {/* Message */}
            <p className="text-center text-white/70 mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#FF6B00]">
                {confirmModal.friendName || "this user"}
              </span>{" "}
              from your friends list? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={cancelDeleteFriend}
                className="flex-1 px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/30 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFriend}
                className="flex-1 px-6 py-3 rounded-xl border border-rose-400/40 bg-rose-500/20 text-rose-200 font-semibold hover:bg-rose-500/30 hover:border-rose-400/60 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-rose-500/50 flex items-center justify-center gap-2"
              >
                <MdDelete size={20} />
                Remove Friend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
