import { useState, useEffect } from "react";
import type { IconType } from "react-icons";
import { MdOutlinePerson } from "react-icons/md";
import { RiShieldKeyholeLine } from "react-icons/ri";
import { IoSettingsOutline } from "react-icons/io5";
import { UserInter } from "../../interfaces/UserInterfaces";
import { UserDataInter } from "../../interfaces/UserInterfaces";
import { Utils } from "../../Utils";

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
  {
    id: "preferences",
    label: "Personal Vibes",
    eyebrow: "Experience",
    heading: "Personal Vibes",
    description:
      "Control notifications and tailor the experience to fit your flow.",
    icon: IoSettingsOutline as IconType,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsSection({
  user,
  user_data,
}: {
  user: UserInter;
  user_data: UserDataInter | null;
}): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile update state
  const [name, setName] = useState(user_data?.name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user_data?.twoFactorEnabled || false
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableToken, setDisableToken] = useState("");

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const primaryActionClasses =
    "inline-flex items-center justify-center rounded-xl bg-secondary-btn px-6 py-3 font-semibold text-secondary-text font-secondary shadow-lg shadow-[0_18px_40px_-18px_rgba(255,107,0,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary-btn/90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryActionClasses =
    "inline-flex items-center justify-center rounded-xl border border-white/15 bg-primary-elements px-5 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-primary-elements/80";
  const subtleCardClasses =
    "rounded-2xl border border-white/10 bg-primary-elements p-5 shadow-lg shadow-[0_26px_60px_-35px_rgba(0,255,255,0.35)]";

  useEffect(() => {
    if (user_data) {
      setName(user_data.name || "");
      setTwoFactorEnabled(user_data.twoFactorEnabled || false);
    }
  }, [user_data]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user_data) return;

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      // Update name if changed
      if (name !== user_data.name) {
        const updateResponse = await fetch(
          `http://localhost:3000/api/v1/user/${user.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name.trim(),
            }),
          }
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || "Failed to update profile");
        }

        const updateData = await updateResponse.json();
        Utils.LogLevel.DEBUG && console.log("Profile updated:", updateData);
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match");
        }

        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const passwordResponse = await fetch(
          "http://localhost:3000/api/v1/auth/change-password",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              oldPassword,
              newPassword,
            }),
          }
        );

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(errorData.error || "Failed to change password");
        }

        // Clear password fields on success
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

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
        text: error.message || "Failed to update profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSetup2FA = async () => {
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
      setBackupCodes(data.backupCodes || []);
      setTwoFactorMessage({
        type: "success",
        text: "Scan the QR code with your authenticator app",
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

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);

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
      setTwoFactorEnabled(true);
      setQrCode(null);
      setVerificationToken("");
      setTwoFactorMessage({
        type: "success",
        text: "2FA enabled successfully! Save your backup codes.",
      });

      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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

  const handlePreferencesUpdate = async () => {
    setPreferencesLoading(true);
    setPreferencesMessage(null);

    try {
      // Simulate API call for preferences (you'll need to implement this endpoint)
      await new Promise((resolve) => setTimeout(resolve, 500));

      setPreferencesMessage({
        type: "success",
        text: "Preferences updated successfully!",
      });
    } catch (error: any) {
      Utils.LogLevel.ERROR && console.error("Preferences update error:", error);
      setPreferencesMessage({
        type: "error",
        text: error.message || "Failed to update preferences",
      });
    } finally {
      setPreferencesLoading(false);
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
  const initials = user_data.name
    ? user_data.name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user.email.charAt(0).toUpperCase();
  const accentGlow = "shadow-[0_24px_48px_-28px_rgba(0,255,255,0.35)]";

  return (
    <div className="bg-primary-bg min-h-screen w-full text-white font-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:px-8 lg:flex-row lg:py-14">
        <aside className="w-full space-y-6 lg:w-80">
          <div className={`${subtleCardClasses} relative ${accentGlow}`}>
            <div className="flex flex-col items-center gap-5 text-center text-white">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-primary-btn bg-primary-bg shadow-inner">
                {user_data.avatar ? (
                  <img
                    src={user_data.avatar}
                    alt={`${user_data.name} avatar`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-secondary-text">
                    {initials}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-secondary text-2xl font-semibold tracking-wide text-secondary-btn">
                  {user_data.name}
                </p>
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">
                  @{user_data.email?.split("@")[0] || user.email}
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
                  className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-primary-btn bg-primary-btn text-white shadow-[0_18px_40px_-22px_rgba(0,255,255,0.55)]"
                      : "border-white/15 bg-primary-elements text-white/65 hover:border-primary-btn hover:text-white"
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

        <section className="flex-1 overflow-hidden rounded-3xl border border-white/10 bg-primary-elements shadow-lg shadow-primary-btn/30">
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
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className={subtleCardClasses}>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                      Basics
                    </p>
                    <h3 className="mt-2 font-secondary text-2xl font-semibold text-white">
                      Profile Information
                    </h3>
                    <p className="mt-1 text-sm text-white/75">
                      Update your display name to personalize your profile.
                    </p>
                    <div className="mt-6 space-y-5">
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
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
                      Change your password to keep your account secure. Leave
                      fields blank to keep your current password.
                    </p>
                    <div className="mt-6 grid gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-white placeholder:text-white/35 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-white placeholder:text-white/35 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.3em] text-white/65">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-primary-bg px-4 py-3 text-white placeholder:text-white/35 focus:border-primary-btn focus:outline-none focus:ring-2 focus:ring-primary-btn"
                          placeholder="Repeat new password"
                        />
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
                    Pro tip: refresh your password every few months.
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
                            className="inline-flex items-center justify-center rounded-xl border border-rose-400 bg-rose-500/10 px-5 py-2.5 font-semibold text-rose-200 transition-colors duration-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                    {!qrCode ? (
                      <button
                        onClick={handleSetup2FA}
                        disabled={twoFactorLoading}
                        className={`mt-6 ${primaryActionClasses}`}
                      >
                        {twoFactorLoading
                          ? "Generating secret..."
                          : "Start 2FA setup"}
                      </button>
                    ) : (
                      <form
                        onSubmit={handleVerify2FA}
                        className="mt-6 space-y-6"
                      >
                        <div className="text-sm text-white/70">
                          <p className="font-semibold text-white">
                            Scan & verify
                          </p>
                          <p className="mt-1">
                            Use Google Authenticator, Authy, or any TOTP app.
                            After scanning, enter the 6-digit code below.
                          </p>
                        </div>
                        {qrCode && (
                          <div className="mx-auto w-fit rounded-2xl border border-primary-btn bg-primary-bg p-4 shadow-lg shadow-primary-btn/30">
                            <img
                              src={qrCode}
                              alt="2FA QR Code"
                              className="h-48 w-48 object-contain"
                            />
                          </div>
                        )}

                        {backupCodes.length > 0 && (
                          <div className="rounded-2xl border border-amber-400/60 bg-primary-bg p-4 text-amber-100">
                            <p className="font-semibold uppercase tracking-[0.3em] text-xs text-primary-text">
                              Backup codes
                            </p>
                            <p className="mt-1 text-sm text-white/70">
                              Store these codes somewhere safe. Each can be used
                              once if you lose access to your authenticator
                              device.
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-2 text-center font-mono text-sm sm:grid-cols-4">
                              {backupCodes.map((code, index) => (
                                <span
                                  key={`${code}-${index}`}
                                  className="rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 tracking-widest text-amber-100"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="block text-xs uppercase tracking-[0.3em] text-white/60">
                            Verification code
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
                            required
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={
                              twoFactorLoading || verificationToken.length !== 6
                            }
                            className={primaryActionClasses}
                          >
                            {twoFactorLoading
                              ? "Verifying..."
                              : "Verify & enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQrCode(null);
                              setBackupCodes([]);
                              setVerificationToken("");
                            }}
                            className={secondaryActionClasses}
                          >
                            Start over
                          </button>
                        </div>
                      </form>
                    )}
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

            {activeTab === "preferences" && (
              <div className="space-y-8 text-white/75">
                <div className={`${subtleCardClasses} space-y-4`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/55">
                        Notifications
                      </p>
                      <h3 className="mt-2 font-secondary text-2xl font-semibold text-white">
                        Email alerts
                      </h3>
                      <p className="mt-1 text-sm text-white/70">
                        Decide if you want match summaries, friend requests, and
                        service announcements delivered to your inbox.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) =>
                          setEmailNotifications(e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <span className="h-7 w-14 rounded-full border border-primary-btn/60 bg-primary-bg transition-colors peer-checked:bg-secondary-btn" />
                      <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-secondary-text shadow transition-all peer-checked:translate-x-7" />
                    </label>
                  </div>
                  <ul className="grid gap-2 text-sm text-white/70">
                    <li>• Weekly performance recaps</li>
                    <li>• Tournament invitations & milestones</li>
                    <li>• Security reminders and account nudges</li>
                  </ul>
                </div>

                {preferencesMessage && (
                  <div
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur ${
                      preferencesMessage.type === "success"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : "border-rose-400/40 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    <span className="text-base">
                      {preferencesMessage.type === "success" ? "✅" : "⚠️"}
                    </span>
                    <span>{preferencesMessage.text}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                    Stay in sync with the rally you care about.
                  </p>
                  <button
                    onClick={handlePreferencesUpdate}
                    disabled={preferencesLoading}
                    className={primaryActionClasses}
                  >
                    {preferencesLoading ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
