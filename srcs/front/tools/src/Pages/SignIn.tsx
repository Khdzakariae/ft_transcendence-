import { AuthLayout } from "../components/AuthLayout";
import Logo from "../assets/ping_pong_logo.png";
import { Link, useNavigate } from "react-router-dom";
import { AuthInputForms } from "../components/AuthInputForms";
import { AuthProvidersButtons, PrimaryButton } from "../components/Buttons";
import { useState } from "react";
import { Utils } from "../Utils";
import { useEffect } from "react";

export function SignInPage(): JSX.Element {
  let response = null;

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [creation_msg, setCreationMsg] = useState("Sign In");
  const [msg, setMsg] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [twoFAToken, setTwoFAToken] = useState<string>("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSignedIn && !show2FA) {
      timer = setTimeout(() => {
        navigate("/dashboard/");
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isSignedIn, show2FA, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If showing 2FA, verify the token instead
    if (show2FA) {
      await handle2FAVerification();
      return;
    }

    const form = e.currentTarget;
    const formEmail = form.email.value;
    const formPassword = form.password.value;

    // Store email and password for later use
    setEmail(formEmail);
    setPassword(formPassword);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(formPassword)) {
      setMsg(
        "Password must be at least 6 characters long and include uppercase, lowercase letters, and a number.",
      );
      return;
    }

    try {
      setIsLoading(true);
      setCreationMsg("Signing In...");
      
      // First, sign in to get authentication cookie
      response = await fetch("http://localhost:3000/api/v1/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formEmail, password: formPassword }),
      });
    } catch (e) {
      Utils.LogLevel.ERROR && console.error("SignIn network error:", e);
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? (e as any).message
          : String(e);
      setMsg(`Network error: ${errorMessage}`);
      setCreationMsg("Sign In");
      setIsLoading(false);
      return;
    }

    const contentType: string | null = response.headers.get("content-type");
    let res: any = {};

    if (contentType && contentType.includes("application/json")) {
      res = await response.json();
    } else {
      Utils.LogLevel.WARN && console.warn("Response is not JSON");
    }

    switch (response.status) {
      case 200:
      case 201:
        // Successfully signed in, now check if 2FA is enabled
        try {
          // Get user info to check 2FA status
          const userResponse = await fetch(
            "http://localhost:3000/api/v1/user/me",
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            },
          );

          if (userResponse.status === 200) {
            const userData = await userResponse.json();
            const is2FAEnabled = userData?.data?.twoFactorEnabled === true;
            const currentUserId = userData?.data?.id;

            if (is2FAEnabled && currentUserId) {
              // User has 2FA enabled, show 2FA input
              setUserId(currentUserId);
              setShow2FA(true);
              setCreationMsg("Enter 2FA Code");
              setIsLoading(false);
              setMsg("");
              // Clear the auth cookie since we need to verify 2FA first
              await fetch("http://localhost:3000/api/v1/auth/sign-out", {
                method: "POST",
                credentials: "include",
              });
              return;
            }
          }
        } catch (error) {
          Utils.LogLevel.ERROR &&
            console.error("Error checking 2FA status:", error);
          // If we can't check 2FA status, proceed with normal sign-in
        }

        // No 2FA or check failed, proceed with normal sign-in
        setMsg(`${res.message}`);
        setCreationMsg("Redirecting to Dashboard...");
        setIsSignedIn(true);
        break;
      case 401:
      case 404:
      case 500:
        setMsg(`${res.error}`);
        setCreationMsg("Sign In");
        setIsLoading(false);
        break;
      default:
        Utils.LogLevel.ERROR &&
          console.error("Unexpected response status:", response.status, res);
        setMsg(
          `Unexpected error occurred (${response.status}). Please try again.`,
        );
        setCreationMsg("Sign In");
        setIsLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!userId || !twoFAToken || !/^\d{6}$/.test(twoFAToken)) {
      setMsg("Please enter a valid 6-digit 2FA code.");
      return;
    }

    try {
      setIsLoading(true);
      setCreationMsg("Verifying 2FA Code...");

      // Verify the 2FA token
      const verifyResponse = await fetch(
        "http://localhost:3000/api/v1/auth/verify-login-2fa",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId, token: twoFAToken }),
        },
      );

      const verifyData = await verifyResponse.json();

      if (verifyResponse.status === 200 && verifyData.verified) {
        // 2FA verified, now complete the sign-in
        const signInResponse = await fetch(
          "http://localhost:3000/api/v1/auth/sign-in",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          },
        );

        if (signInResponse.status === 200 || signInResponse.status === 201) {
          setMsg("Sign in successful!");
          setCreationMsg("Redirecting to Dashboard...");
          setIsSignedIn(true);
          setShow2FA(false);
          setTwoFAToken("");
        } else {
          const errorData = await signInResponse.json();
          setMsg(errorData.error || "Failed to complete sign-in.");
          setCreationMsg("Sign In");
          setIsLoading(false);
        }
      } else {
        setMsg(verifyData.error || "Invalid 2FA code. Please try again.");
        setCreationMsg("Enter 2FA Code");
        setIsLoading(false);
        setTwoFAToken("");
      }
    } catch (error) {
      Utils.LogLevel.ERROR && console.error("2FA verification error:", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as any).message
          : String(error);
      setMsg(`Network error: ${errorMessage}`);
      setCreationMsg("Enter 2FA Code");
      setIsLoading(false);
    }
  };

  const handle2FATokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setTwoFAToken(value);
    setMsg("");
  };

  const handleBackToSignIn = () => {
    setShow2FA(false);
    setTwoFAToken("");
    setUserId(null);
    setMsg("");
    setCreationMsg("Sign In");
    setIsLoading(false);
  };

  const forgotPassword = () => {
    navigate("/reset-password-email/");
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="text-center mb-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" className="h-12 sm:h-16 md:h-20" />
        </div>
        <h1 className="text-5xl font-extrabold leading-tight text-white">
          {show2FA ? (
            <>
              2FA <span className="text-primary-text">Verification</span>
            </>
          ) : (
            <>
              Welcome <span className="text-primary-text">Back</span>
            </>
          )}
        </h1>
        <p className="text-base sm:text-md md:text-lg text-gray-300">
          {show2FA
            ? "Enter the 6-digit code from your authenticator app"
            : "Glad to have you back!"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 font-secondary">
        {!show2FA ? (
          <>
            <AuthInputForms
              type="email"
              name="email"
              placeholder="Email"
              required
            />
            <AuthInputForms
              type="password"
              name="password"
              placeholder="Password"
              required
            />
          </>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                name="twoFAToken"
                placeholder="000000"
                value={twoFAToken}
                onChange={handle2FATokenChange}
                required
                maxLength={6}
                className="w-full rounded-lg border border-gray-700 bg-primary-bg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-center text-2xl tracking-widest font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleBackToSignIn}
              className="w-full text-center text-sm text-gray-300 hover:text-white transition-colors underline"
            >
              Back to sign in
            </button>
          </>
        )}

        <PrimaryButton
          func={() => {}}
          props={{
            children: creation_msg,
            type: "submit",
            disabled: isLoading || (show2FA && twoFAToken.length !== 6),
            className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${isLoading || (show2FA && twoFAToken.length !== 6) ? "opacity-50 cursor-not-allowed" : ""}`,
          }}
        />

        {msg && (
          <p
            className={`text-center font-fontFamily-secondary ${msg.includes("success") ? "bg-success/20 text-success" : "bg-error/20 text-error"} rounded-lg p-4`}
          >
            {msg}
          </p>
        )}
      </form>
      {!show2FA && (
        <>
          {/* Forgot password */}
          <div className="text-right font-primary mt-2">
            <button
              onClick={forgotPassword}
              className="text-md text-gray-300 hover:text-white transition-colors"
            >
              Forgot password?{" "}
              <span className="font-semibold text-cyan-300 underline">
                Click here
              </span>
            </button>
          </div>

          {/* Sign in with other providers */}
          <div className="text-center mb-4 mt-4 text-gray-300">
            <p className="text-md sm:text-lg">Sign in with others</p>
          </div>
          <AuthProvidersButtons />

          <div className="text-center mt-6 font-primary text-gray-300">
            <Link
              to="/sign-up/"
              className="text-md hover:text-white transition-colors"
            >
              Don't have an account yet?{" "}
              <span className="font-semibold text-cyan-300 underline">
                Register here
              </span>
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
