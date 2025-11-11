import { useState, useEffect, useCallback } from "react";
import { UserInter } from "../../interfaces/UserInterfaces";
import { SearchBarFriends } from "../searchBarFriends";
import { MdDelete, MdPerson } from "react-icons/md";

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

  const handleDeleteFriend = async (friendId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) {
      return;
    }

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

  const getInitials = (name?: string | null): string => {
    if (!name || name.trim().length === 0) {
      return "?";
    }
    return name.charAt(0).toUpperCase();
  };

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
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="bg-primary-bg min-h-screen w-full text-white font-primary p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Friends List Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">My Friends</h2>
            <p className="text-white/70">
              Manage your friends list and connect with others
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 text-rose-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-white/60 animate-pulse">Loading friends...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-white/10 bg-primary-elements">
              <MdPerson className="mx-auto text-white/30 mb-4" size={64} />
              <p className="text-white/60 text-lg mb-2">No friends yet</p>
              <p className="text-white/40 text-sm">
                Search below to find and add friends
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-primary-elements hover:border-primary-btn transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name || "Friend"}
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
                    <div>
                      <p className="font-semibold">
                        {friend.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-white/60">
                        {friend.email || ""}
                      </p>
                      {friend.onlineStatus && (
                        <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                          Online
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFriend(friend.id)}
                    disabled={deletingFriendId === friend.id}
                    className="px-4 py-2 rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:border-rose-400/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    title="Remove friend"
                  >
                    <MdDelete size={18} />
                    {deletingFriendId === friend.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Friends Section */}
        <div className="border-t border-white/10 pt-8 mt-8">
          <SearchBarFriends currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
