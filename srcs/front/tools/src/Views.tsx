import { Routes, Route } from "react-router-dom";
import { SignUpPage } from "./Pages/SignUp";
import { SignInPage } from "./Pages/SignIn";
import { AuthGuard } from "./components/AuthGuard";
import { Dashboard } from "./Pages/Dashboard";
import { LandingPage } from "./Pages/LandingPage";
import {
  ResetPasswordEmailPage,
  ResetPasswordPage,
} from "./Pages/ResetPassword";
import { NotFoundPage } from "./Pages/NotFound";
import { LoadingPage } from "./Pages/LoadingPage";
import { OAuth2FAPage } from "./Pages/OAuth2FA";

// Pages
export function Views(): JSX.Element {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthGuard>
            <LandingPage />
          </AuthGuard>
        }
      />
      <Route
        path="/public/"
        element={
          <AuthGuard>
            <LandingPage />
          </AuthGuard>
        }
      />
      <Route
        path="/sign-up/"
        element={
          <AuthGuard>
            <SignUpPage />
          </AuthGuard>
        }
      />
      <Route
        path="/sign-in/"
        element={
          <AuthGuard>
            <SignInPage />
          </AuthGuard>
        }
      />
      <Route
        path="/reset-password-email/"
        element={<ResetPasswordEmailPage />}
      />
      <Route path="/reset-password/:userId/" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard/"
        element={
          <LoadingPage pageName="Dashboard">
            <Dashboard />
          </LoadingPage>
        }
      />
      {/* OAuth 2FA route */}
      <Route path="/oauth-2fa/" element={<OAuth2FAPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
