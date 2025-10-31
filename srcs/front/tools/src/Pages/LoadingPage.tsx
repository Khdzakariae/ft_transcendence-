import { useEffect, useState } from "react";
import { Utils } from "../Utils";
import { AuthResponse } from "../interfaces/AuthResponse";
import { useNavigate } from "react-router-dom";

interface LoadingPageProps {
  children: React.ReactNode;
  pageName: string;
}

export function LoadingPage({
  children,
  pageName,
}: LoadingPageProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResult: AuthResponse = await Utils.checkAuthCookie();

        if (authResult.isAuthenticated && authResult.user) {
          // remove this in case, add more seconds on loading is needed.
          setIsLoading(false); // prepare loading view for dashboard
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        Utils.LogLevel.ERROR &&
          console.error("LoadingPage auth check error:", error);
        navigate("/", { replace: true });
      }
    };
    checkAuth();
  }, []);

  // add 2s on loading
  // useEffect(() => {
  //   let timer: NodeJS.Timeout;

  //   if (isLoading) {
  //     timer = setTimeout(() => {
  //       setIsLoading(false);
  //     }, 2000);
  //   }
  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="animate-pulse text-gray-400 font-primary text-center text-md sm:text-lg">
            {`Loading ${pageName}...`}
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
