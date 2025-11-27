import { useState, useEffect } from "react";
import type { IconType } from "react-icons";
import { MdOutlinePerson } from "react-icons/md";
import { RiShieldKeyholeLine } from "react-icons/ri";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineDownload,
  AiOutlineCopy,
  AiOutlineClose,
  AiOutlineWarning,
} from "react-icons/ai";
import { Utils } from "../../Utils";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { useDashboardContext } from "../../Pages/Dashboard";

// Ping-pong themed avatar options
const AVATAR_OPTIONS = [
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00&primaryColor=FFFFFF",
    color: "from-orange-500 to-orange-600",
    name: "Paddle Master",
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-champion-2&backgroundColor=00CED1&primaryColor=FFD700",
    color: "from-cyan-500 to-blue-600",
    name: "Table Champion",
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-spin-3&backgroundColor=FFD700&primaryColor=FF6B00",
    color: "from-yellow-400 to-amber-500",
    name: "Spin King",
  },
  {
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-ace-4&backgroundColor=9370DB&primaryColor=00CED1",
    color: "from-purple-500 to-indigo-600",
    name: "Ace Player",
  },
];

const TABS = [
  {
    id: "profile",
    label: "Profile Studio",
    eyebrow: "Identity",
    heading: "Profile Studio",
    description:
      "Craft how the community sees you and keep your credentials up to date.",
    icon: MdOutlinePerson as IconType,
  },
  {
    id: "2fa",
    label: "Security Vault",
    eyebrow: "Security",
    heading: "Security Vault",
    description:
      "Add an extra layer of protection with two-factor authentication and backup codes.",
    icon: RiShieldKeyholeLine as IconType,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-primary-btn/40 bg-primary-elements p-6 ring-2 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-secondary text-xl font-semibold text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 transition-colors hover:text-white"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SettingsSection(): JSX.Element {
  const { user, user_data } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile update state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0].url);
  const [oauthAvatar, setOauthAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user_data?.twoFactorEnabled || false
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableToken, setDisableToken] = useState("");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);

  const primaryActionClasses =
    "inline-flex items-center justify-center rounded-xl bg-secondary-btn px-6 py-3 font-semibold text-secondary-text font-secondary border-2 border-secondary-btn/50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary-btn/90 hover:border-secondary-btn disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryActionClasses =
    "inline-flex items-center justify-center rounded-xl border-2 border-white/25 bg-primary-elements px-5 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-primary-elements/80 hover:border-white/40";
  const subtleCardClasses =
    "rounded-2xl border-2 border-white/20 bg-primary-elements p-5 relative before:absolute before:inset-0 before:rounded-2xl before:border before:border-primary-btn/30 before:pointer-events-none";

  useEffect(() => {
    if (user_data) {
      // Split name into firstName and lastName
      const nameParts = (user_data.name || "").split(" ");
      const first = nameParts[0] || "";
      const last = nameParts.slice(1).join(" ") || "";

      setFirstName(first);
      setLastName(last);
      setTwoFactorEnabled(user_data.twoFactorEnabled || false);
      
      // Set current avatar
      if (user_data.avatar) {
        setSelectedAvatar(user_data.avatar);
        
        // Check if it's an OAuth avatar (not in our predefined list)
        const isOAuthAvatar = !AVATAR_OPTIONS.some(opt => opt.url === user_data.avatar);
        if (isOAuthAvatar) {
          setOauthAvatar(user_data.avatar);
        }
      }
    }
  }, [user_data]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user_data || !user) return;

    // Validate inputs before making API calls
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // Check if at least one name field has content
    if (!trimmedFirstName && !trimmedLastName) {
      setProfileMessage({
        type: "error",
        text: "Please provide at least a first name or last name",
      });
      return;
    }

    // Validate password if provided
    const trimmedPassword = newPassword.trim();
    if (trimmedPassword && trimmedPassword.length < 6) {
      setProfileMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      return;
    }

    // Check if name would be empty after combining
    const newName = `${trimmedFirstName} ${trimmedLastName}`.trim();
    if (!newName) {
      setProfileMessage({
        type: "error",
        text: "Name cannot be empty",
      });
      return;
    }

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      // Prepare update payload - send name, avatar, and password
      const payload: any = {
        name: newName,
        avatar: selectedAvatar,
      };

      // Add password to payload if provided (already trimmed in validation)
      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }

      // Update profile using the existing API endpoint
      const updateResponse = await fetch(
        `http://localhost:3000/api/v1/user/${user.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!updateResponse.ok) {
        let errorMessage = "Failed to update profile";
        try {
          const errorData = await updateResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = updateResponse.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const updateData = await updateResponse.json();
      Utils.LogLevel.DEBUG && console.log("Profile updated:", updateData);

      // Clear password field on success
      setNewPassword("");
      setShowPassword(false);

      setProfileMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Refresh user data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("Profile update error:", error);
      setProfileMessage({
        type: "error",
        text: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    if (!user) return;
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);

    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/auth/enable-2fa",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to setup 2FA");
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setQrCodeLoaded(false);
      setBackupCodes(data.backupCodes || []);
      setIsSetupModalOpen(true);
      setTwoFactorMessage({
        type: "success",
        text: "2FA setup initiated. Please scan the QR code.",
      });
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("2FA setup error:", error);
      setTwoFactorMessage({
        type: "error",
        text: error.message || "Failed to setup 2FA",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setTwoFactorEnabled(true);
    setIsSetupModalOpen(false);
    setShowBackupCodesModal(true);
    setTwoFactorMessage({
      type: "success",
      text: "2FA enabled successfully! Save your backup codes.",
    });
  };

  const handleVerify2FA = async () => {
    if (!user) return;
    setTwoFactorLoading(true);

    if (!/^\d{6}$/.test(verificationToken)) {
      setTwoFactorMessage({
        type: "error",
        text: "Token must be a 6-digit number",
      });
      setTwoFactorLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/auth/verify-2fa",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            token: verificationToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify 2FA");
      }

      await response.json();
      setVerificationToken("");
      handleVerificationSuccess();
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("2FA verification error:", error);
      setTwoFactorMessage({
        type: "error",
        text: error.message || "Failed to verify 2FA",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);

    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/auth/disable-2fa",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            token: disableToken || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to disable 2FA");
      }

      setTwoFactorEnabled(false);
      setShowDisableConfirm(false);
      setDisableToken("");
      setTwoFactorMessage({
        type: "success",
        text: "2FA disabled successfully",
      });

      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("2FA disable error:", error);
      setTwoFactorMessage({
        type: "error",
        text: error.message || "Failed to disable 2FA",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (!user_data) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-primary-text text-2xl font-bold animate-pulse">
          Loading settings...
        </h1>
      </div>
    );
  }

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab)!;
  const joinedDate = new Date(user_data.createdAt).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
  const accentGlow = "ring-2 ring-primary-btn/40 ring-offset-2 ring-offset-primary-bg";

  return (
    <div className="bg-primary-bg min-h-screen w-full text-white font-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:px-8 lg:flex-row lg:py-14">
        <aside className="w-full space-y-6 lg:w-80">
          <div className={`${subtleCardClasses} relative ${accentGlow}`}>
            <div className="flex flex-col items-center gap-5 text-center text-white">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-primary-btn bg-primary-bg shadow-inner">
                <LazyLoadingImage
                  dimension={{
                    width: "w-24 sm:w-36 md:w-48",
                    height: "h-24 sm:h-36 md:h-48",
                  }}
                  loading={loaded}
                >
                  <img
                    src={user_data.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00"}
                    alt="profile image"
                    className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                  />
                </LazyLoadingImage>
                {/* {!loaded && (
                  <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                )} */}
              </div>
              <div className="space-y-1">
                <p className="font-secondary text-2xl font-semibold tracking-wide text-secondary-btn">
                  {user_data.name}
                </p>
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">
                  @{user_data.email?.split("@")[0] || user?.email || "user"}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-white/65">
                <span className="rounded-full border border-primary-btn/50 bg-primary-bg px-3 py-1 text-white/75">
                  Joined {joinedDate}
                </span>
                <span className="rounded-full border border-primary-btn/50 bg-primary-bg px-3 py-1 text-white/75">
                  Level {user_data.level}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 ${twoFactorEnabled ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200" : "border-amber-400/70 bg-amber-500/15 text-amber-200"}`}
                >
                  {twoFactorEnabled ? "2FA Active" : "2FA Pending"}
                </span>
              </div>
            </div>
          </div>

          <nav className={`${subtleCardClasses} space-y-2 p-4 sm:p-5`}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex w-full items-center justify-between rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-primary-btn bg-primary-btn text-white ring-2 ring-primary-btn/30 ring-offset-2 ring-offset-primary-elements"
                      : "border-white/20 bg-primary-elements text-white/65 hover:border-primary-btn hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl border text-lg transition-colors ${
                        isActive
                          ? "border-secondary-text bg-secondary-text text-primary-btn"
                          : "border-white/10 bg-primary-bg text-primary-btn group-hover:border-primary-btn group-hover:text-primary-text"
                      }`}
                    >
                      <Icon />
                    </span>
                    <span>
                      <p
                        className={`font-secondary text-lg font-semibold tracking-wide ${isActive ? "text-secondary-text" : "text-white/75"}`}
                      >
                        {tab.label}
                      </p>
                      <p
                        className={`text-xs uppercase tracking-[0.3em] ${isActive ? "text-secondary-text" : "text-white/50"}`}
                      >
                        {tab.eyebrow}
                      </p>
                    </span>
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-[0.35em] ${isActive ? "text-secondary-text" : "text-white/50"}`}
                  >
                    {isActive ? "Active" : "View"}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1 overflow-hidden rounded-3xl border-2 border-white/20 bg-primary-elements ring-1 ring-primary-btn/40">
          <header className="border-b border-white/10 px-6 py-6 sm:px-8 sm:py-8 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
              {activeTabMeta.eyebrow}
            </p>
            <h2 className="mt-2 font-secondary text-3xl font-semibold text-white sm:text-4xl">
              {activeTabMeta.heading}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
              {activeTabMeta.description}
            </p>
          </header>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                {/* Avatar Selection */}
                <div className={subtleCardClasses}>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                    Appearance
                  </p>
                  <h3 className="mt-2 font-secondary text-2xl font-semibold text-white">
                    Choose Your Avatar
                  </h3>
                  <p className="mt-1 text-sm text-white/75">
                    Select a ping-pong themed avatar to represent you.
                  </p>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* OAuth provider avatar if exists */}
                    {oauthAvatar && (
                      <button
                        type="button"
                        onClick={() => setSelectedAvatar(oauthAvatar)}
                        className={`relative group transition-all duration-300 ${
                          selectedAvatar === oauthAvatar ? "scale-105" : "hover:scale-105"
                        }`}
                      >
                        <div
                          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                            selectedAvatar === oauthAvatar
                              ? "border-primary-btn bg-gradient-to-br from-green-500 to-emerald-600 ring-2 ring-primary-btn/50 ring-offset-2 ring-offset-primary-elements"
                              : "border-white/20 bg-gradient-to-br from-primary-bg to-primary-bg/80 hover:border-primary-btn/60"
                          }`}
                        >
                          <img
                            src={oauthAvatar}
                            alt="Your provider avatar"
                            className="w-full h-auto rounded-full"
                          />
                          {selectedAvatar === oauthAvatar && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className={`text-center mt-2 text-xs font-semibold ${
                          selectedAvatar === oauthAvatar ? "text-primary-btn" : "text-white/60"
                        }`}>
                          Your Photo
                        </p>
                      </button>
                    )}
                    
                    {/* Predefined avatar options */}
                    {AVATAR_OPTIONS.map((avatar, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.url)}
                        className={`relative group transition-all duration-300 ${
                          selectedAvatar === avatar.url ? "scale-105" : "hover:scale-105"
                        }`}
                      >
                        <div
                          className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                            selectedAvatar === avatar.url
                              ? `border-primary-btn bg-gradient-to-br ${avatar.color} ring-2 ring-primary-btn/50 ring-offset-2 ring-offset-primary-elements`
                              : "border-white/20 bg-gradient-to-br from-primary-bg to-primary-bg/80 hover:border-primary-btn/60"
                          }`}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-auto rounded-xl"
                          />
                          {selectedAvatar === avatar.url && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className={`text-center mt-2 text-xs font-semibold ${
                          selectedAvatar === avatar.url ? "text-primary-btn" : "text-white/60"
                        }`}>
                          {avatar.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className={subtleCardClasses}>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                      Basics
                    </p>
                    <h3 className="mt-2 font-secondary text-2xl font-semibold text-white">
                      Profile Information
                    </h3>
                    <p className="mt-1 text-sm text-white/75">
                      Update your name to personalize your profile.
                    </p>
                    <div className="mt-6 space-y-5">
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className={subtleCardClasses}>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                      Security
                    </p>
                    <h3 className="mt-2 font-secondary text-2xl font-semibold text-white">
                      Password Refresh
                    </h3>
                    <p className="mt-1 text-sm text-white/75">
                      Enter a new password to update your account security.
                      Leave blank to keep your current password.
                    </p>
                    <div className="mt-6">
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 pr-12 text-white placeholder:text-white/35 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
                            placeholder="Enter new password (min. 6 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-0 flex h-full items-center px-4 text-white/60 hover:text-white"
                          >
                            {showPassword ? (
                              <AiOutlineEyeInvisible size={20} />
                            ) : (
                              <AiOutlineEye size={20} />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-white/50 mt-2">
                          💡 No need for your old password - just enter your new
                          one!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {profileMessage && (
                  <div
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur ${
                      profileMessage.type === "success"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    <span className="text-base">
                      {profileMessage.type === "success" ? "✨" : "⚠️"}
                    </span>
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                  💡Quick tip: refresh your password every few months.
                  </p>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className={primaryActionClasses}
                  >
                    {profileLoading ? "Updating..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "2fa" && (
              <div className="space-y-8 text-white/80">
                {twoFactorEnabled ? (
                  <div
                    className={`${subtleCardClasses} border-emerald-400/40 text-white`}
                  >
                    <h3 className="font-secondary text-2xl font-semibold text-primary-text">
                      Two-factor authentication is active
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      Your account is protected with an additional verification
                      layer. Keep your backup codes in a safe place in case you
                      misplace your device.
                    </p>

                    {!showDisableConfirm ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => setShowDisableConfirm(true)}
                          className={secondaryActionClasses}
                        >
                          Disable 2FA
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleDisable2FA}
                        className="mt-6 space-y-4"
                      >
                        <p className="text-sm text-white/65">
                          Optionally confirm with a current authenticator code.
                        </p>
                        <input
                          type="text"
                          value={disableToken}
                          onChange={(e) => setDisableToken(e.target.value)}
                          placeholder="Optional 6-digit code"
                          maxLength={6}
                          className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={twoFactorLoading}
                            className="inline-flex items-center justify-center rounded-xl border-2 border-rose-400 bg-rose-500/10 px-5 py-2.5 font-semibold text-rose-200 transition-colors duration-200 hover:bg-rose-500/20 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {twoFactorLoading
                              ? "Disabling..."
                              : "Confirm disable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisableConfirm(false);
                              setDisableToken("");
                            }}
                            className={secondaryActionClasses}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className={subtleCardClasses}>
                    <h3 className="font-secondary text-2xl font-semibold text-white">
                      Add another checkpoint
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      Enable two-factor authentication to require a one-time
                      code from your authenticator app whenever you sign in.
                    </p>
                    <button
                      onClick={handleSetup2FA}
                      disabled={twoFactorLoading}
                      className={`mt-6 ${primaryActionClasses}`}
                    >
                      {twoFactorLoading
                        ? "Generating secret..."
                        : "Start 2FA setup"}
                    </button>
                  </div>
                )}

                {twoFactorMessage && (
                  <div
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur ${
                      twoFactorMessage.type === "success"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    <span className="text-base">
                      {twoFactorMessage.type === "success" ? "🔐" : "⚠️"}
                    </span>
                    <span>{twoFactorMessage.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={isSetupModalOpen}
        onClose={() => {
          setIsSetupModalOpen(false);
          setQrCode(null);
          setQrCodeLoaded(false);
          setVerificationToken("");
        }}
        title="Setup Authenticator App"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.), then enter the 6-digit code below.
          </p>

          {qrCode && (
            <div className="flex justify-center rounded-2xl border border-primary-btn bg-white p-4 relative">
              <LazyLoadingImage
                dimension={{
                  width: "w-48",
                  height: "h-48",
                }}
                loading={qrCodeLoaded}
                color="bg-gray-200"
              >
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className={`h-48 w-48 object-contain transition-opacity duration-300 ${qrCodeLoaded ? "opacity-100" : "opacity-0"}`}
                  loading="lazy"
                  onLoad={() => setQrCodeLoaded(true)}
                  onError={() => setQrCodeLoaded(true)}
                />
              </LazyLoadingImage>
              {!qrCodeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse rounded-2xl">
                  <div className="w-32 h-32 bg-gray-300 rounded"></div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationToken}
              onChange={(e) =>
                setVerificationToken(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-center text-2xl font-semibold tracking-[0.6em] text-white focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
            />
          </div>

          {twoFactorMessage && twoFactorMessage.type === "error" && (
            <p className="text-sm text-rose-400">{twoFactorMessage.text}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                setIsSetupModalOpen(false);
                setQrCode(null);
          setQrCodeLoaded(false);
                setVerificationToken("");
              }}
              className={secondaryActionClasses}
            >
              Cancel
            </button>
            <button
              onClick={handleVerify2FA}
              disabled={twoFactorLoading || verificationToken.length !== 6}
              className={primaryActionClasses}
            >
              {twoFactorLoading ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        isOpen={showBackupCodesModal}
        onClose={() => setShowBackupCodesModal(false)}
        title="Save Your Backup Codes"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 p-4">
            <p className="flex items-start gap-2 text-sm text-amber-200">
              <AiOutlineWarning className="mt-0.5 flex-shrink-0" size={18} />
              <span>
                <strong>Important:</strong> Store these codes in a safe place.
                Each can be used once if you lose your device.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-primary-bg p-4 font-mono text-sm">
            {backupCodes.map((code, index) => (
              <span
                key={`${code}-${index}`}
                className="rounded-lg border border-primary-btn/50 bg-primary-elements px-3 py-2 text-center tracking-wider text-white"
              >
                {code}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                const codesString = backupCodes.join("\n");
                navigator.clipboard
                  .writeText(codesString)
                  .then(() => {
                    setTwoFactorMessage({
                      type: "success",
                      text: "Backup codes copied to clipboard!",
                    });
                  })
                  .catch(() => {
                    setTwoFactorMessage({
                      type: "error",
                      text: "Failed to copy codes",
                    });
                  });
              }}
              className="flex items-center gap-2 rounded-xl border-2 border-white/25 bg-primary-elements px-5 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-primary-elements/80 hover:border-white/40"
            >
              <AiOutlineCopy size={18} /> Copy
            </button>
            <button
              onClick={() => {
                const codesString = backupCodes.join("\n");
                const blob = new Blob([codesString], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "backup-codes.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 rounded-xl border-2 border-white/25 bg-primary-elements px-5 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-primary-elements/80 hover:border-white/40"
            >
              <AiOutlineDownload size={18} /> Download
            </button>
            <button
              onClick={() => setShowBackupCodesModal(false)}
              className={primaryActionClasses}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
