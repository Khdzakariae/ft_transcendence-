import { useState, useEffect, useCallback } from "react";
import { UserInter } from "../../interfaces/UserInterfaces";
import { MdCheck, MdClose } from "react-icons/md";

interface FriendRequest {
  requestId: string;
  from: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  createdAt: string;
}

export function NotificationsSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchFriendRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/friends/requests",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }

      const data = await response.json();
      if (data.data && data.data.incoming) {
        setFriendRequests(data.data.incoming);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load friend requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
    }
  }, [user, fetchFriendRequests]);

  const handleAccept = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/friends/${requestId}/accept`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept friend request");
      }

      // Remove the accepted request from the list
      setFriendRequests((prev) =>
        prev.filter((req) => req.requestId !== requestId)
      );
    } catch (err: any) {
      setError(err.message || "Failed to accept friend request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/friends/${requestId}/decline`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to decline friend request");
      }

      // Remove the declined request from the list
      setFriendRequests((prev) =>
        prev.filter((req) => req.requestId !== requestId)
      );
    } catch (err: any) {
      setError(err.message || "Failed to decline friend request");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

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
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Notifications</h2>
          <p className="text-white/70">Manage your friend requests</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/60 animate-pulse">Loading friend requests...</p>
          </div>
        ) : friendRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No pending friend requests</p>
            <p className="text-white/40 text-sm mt-2">
              When someone sends you a friend request, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">
              Friend Requests ({friendRequests.length})
            </h3>
            {friendRequests.map((request) => {
              const isProcessing = processingIds.has(request.requestId);
              const initials = request.from.name
                ? request.from.name
                    .split(" ")
                    .map((n) => n.charAt(0))
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : request.from.email.charAt(0).toUpperCase();

              return (
                <div
                  key={request.requestId}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-primary-elements hover:border-primary-btn transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {request.from.avatar ? (
                        <img
                          src={request.from.avatar}
                          alt={request.from.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-primary-btn"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary-btn/30 border-2 border-primary-btn flex items-center justify-center text-lg font-semibold">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{request.from.name}</p>
                      <p className="text-sm text-white/60">{request.from.email}</p>
                      <p className="text-xs text-white/40 mt-1">
                        {new Date(request.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.requestId)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <MdCheck size={20} />
                      {isProcessing ? "Processing..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleDecline(request.requestId)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 hover:bg-rose-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <MdClose size={20} />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
