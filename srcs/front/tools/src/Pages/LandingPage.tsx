import { useNavigate } from "react-router-dom";
import Logo from "../assets/ping_pong_logo.png";
import Banner from "../assets/landing_page_banner_4k.png";
import { PrimaryButton, SecondaryButton } from "../components/Buttons";

export function LandingPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div
      className="background-auth"
      style={{ backgroundImage: `url(${Banner})` }}
    >
      <img
        src={Banner}
        alt="Ping Pong Banner"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Dark Overlay for Readability (Instead of a separate absolute div) */}
      <div className="absolute inset-0 bg-black/45 z-0"></div>

      {/* Content Wrapper: Centers the main text and buttons */}
      <div className="relative z-10 flex flex-col items-center text-center mx-auto">
        <img
          src={Logo}
          alt="Logo"
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-10 // Increased spacing for visual break"
        />

        <h1 className="// Text size and font weight for high impact text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-primary font-extrabold leading-none mb-4 text-shadow-md">
          Ready to Play?
          <span className="text-white drop-shadow-lg font-primary">
            <br />
            it's Your Serve
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-gray-300 font-light mb-12 // Increased spacing before buttons font-secondary underline">
          Track stats, connect with friends, and dominate the leaderboard
        </p>

        {/* Buttons Container: Responsive layout */}
        <div className="flex flex-col w-full max-w-sm space-y-4 justify-center">
          <SecondaryButton
            func={() => navigate("/sign-up/")}
            props={{ children: "Join Now" }}
          />
          <PrimaryButton
            func={() => navigate("/sign-in/")}
            props={{ children: "Sign In" }}
          />
        </div>
      </div>
    </div>
  );
}
