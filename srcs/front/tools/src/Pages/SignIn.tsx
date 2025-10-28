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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        navigate("/dashboard/");
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isSignedIn, navigate]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      setMsg(
        "Password must be at least 6 characters long and include uppercase, lowercase letters, and a number.",
      );
      return;
    }

    try {
      setIsLoading(true);
      setCreationMsg("Signing In...");
      response = await fetch("http://localhost:3000/api/v1/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
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
          Welcome <span className="text-primary-text">Back</span>
        </h1>
        <p className="text-base sm:text-md md:text-lg text-gray-300">
          Glad to have you back!
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 font-secondary">
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

        <PrimaryButton
          func={() => {}}
          props={{
            children: creation_msg,
            type: "submit",
            disabled: isLoading,
            className: `w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 active:bg-primary-btn transition-colors duration-300 text-secondary-text py-3 font-bold shadow-md ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`,
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
    </AuthLayout>
  );
}
