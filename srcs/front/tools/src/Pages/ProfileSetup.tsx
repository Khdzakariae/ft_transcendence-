import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Utils } from "../Utils";

// Ping-pong themed avatar options
const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=pingpong1&backgroundColor=FF6B00",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=pingpong2&backgroundColor=00CED1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=pingpong3&backgroundColor=FFD700",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=pingpong4&backgroundColor=9370DB",
];

export function ProfileSetupPage(): JSX.Element {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const authResult = await Utils.checkAuthCookie();
        
        if (!authResult.isAuthenticated || !authResult.user) {
          // Not authenticated, redirect to sign in
          navigate("/sign-in/", { replace: true });
          return;
        }

        // Pre-fill username with email prefix if available
        if (authResult.user.email) {
          setUsername(authResult.user.email.split("@")[0]);
        }

        // Check if user already has a complete profile
        const response = await fetch("http://localhost:3000/api/v1/user/me", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const userData = data.data;
          
          Utils.LogLevel.DEBUG && console.log("Profile setup - checking if profile already complete:", {
            hasAvatar: !!userData?.avatar,
            hasName: !!userData?.name,
            name: userData?.name
          });
          
          // If user already has avatar and name set, redirect to dashboard
          // This prevents users from accessing this page again after completion
          const hasValidName = userData?.name && 
                               typeof userData.name === 'string' && 
                               userData.name.trim() !== "";
          const hasAvatar = !!userData?.avatar;
          
          if (hasAvatar && hasValidName) {
            Utils.LogLevel.DEBUG && console.log("Profile already complete, redirecting to dashboard");
            navigate("/dashboard", { replace: true });
            return;
          }
          
          Utils.LogLevel.DEBUG && console.log("Profile incomplete, staying on setup page");
        }
      } catch (error) {
        Utils.LogLevel.ERROR && console.error("Profile setup check error:", error);
        navigate("/sign-in/", { replace: true });
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Username is required");
      return;
    }

    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (trimmedUsername.length > 30) {
      setError("Username must be less than 30 characters");
      return;
    }

    // Only allow alphanumeric characters, underscores, and hyphens
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    setLoading(true);

    try {
      // Get current user ID
      const authResult = await Utils.checkAuthCookie();
      if (!authResult.isAuthenticated || !authResult.user) {
        throw new Error("Not authenticated");
      }

      // Update user profile with avatar and username
      const response = await fetch(
        `http://localhost:3000/api/v1/user/${authResult.user.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedUsername,
            avatar: selectedAvatar,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to update profile");
      }

      Utils.LogLevel.DEBUG && console.log("Profile setup completed successfully");

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      Utils.LogLevel.ERROR && console.error("Profile setup error:", err);
      setError(err.message || "Failed to setup profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-primary-btn mb-4"></div>
          <p className="text-white/60 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-primary">
            Complete Your Profile
          </h1>
          <p className="text-white/70 font-secondary">
            Choose your avatar and set your username to get started
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-primary-elements border border-white/10 rounded-2xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Selection */}
            <div>
              <label className="block text-white font-semibold mb-4 text-lg font-secondary">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {AVATAR_OPTIONS.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedAvatar === avatar
                        ? "border-primary-btn bg-primary-btn/10 shadow-lg shadow-primary-btn/30"
                        : "border-white/10 bg-primary-bg hover:border-primary-btn/50"
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-auto rounded-xl"
                    />
                    {selectedAvatar === avatar && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary-btn rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-white font-semibold mb-2 text-lg font-secondary"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-primary-bg text-white placeholder:text-white/40 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn/50 transition-all duration-200"
                required
                disabled={loading}
              />
              <p className="text-sm text-white/50 mt-2">
                3-30 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 flex items-start gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full px-6 py-4 rounded-xl bg-primary-btn text-white font-bold text-lg transition-all duration-300 hover:bg-secondary-btn hover:scale-105 hover:shadow-lg hover:shadow-primary-btn/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-secondary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Setting up your profile...
                </span>
              ) : (
                "Complete Setup"
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-white/50 text-sm font-secondary">
            You can change your avatar and username later in settings
          </p>
        </div>
      </div>
    </div>
  );
}

