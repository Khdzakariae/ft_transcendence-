import { useEffect, useState } from "react";
import { UserInter } from "../../interfaces/UserInterfaces";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { MdOutlineVerified } from "react-icons/md";
import { UserDataInter } from "../../interfaces/UserInterfaces";

export function ProfileSection({
  user,
  user_data,
}: {
  user: UserInter | null;
  user_data: UserDataInter | null;
}): JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const total_xp: number = 6000; // mock total xp for testing
  const [xpProgress, setXpProgress] = useState<number>(0);
  const total_achievements: number = 10; // mock total achievements for testing

  // need user_data to be fetch first so this useEffect can run
  useEffect(() => {
    if (!user_data) return;
    const target = Math.min(100, Math.round((user_data.xp / total_xp) * 100));
    const t = setTimeout(() => setXpProgress(target), 100);
    return () => clearTimeout(t);
  }, [user_data]);

  if (!user_data) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-primary-text text-2xl font-bold animate-pulse">
          Failed to load profile...
        </h1>
      </div>
    );
  }

  // need to fix bio update through settings later TODO.
  if (user_data) {
    user_data.bio = "Updated bio from settings section, and keep Serving 🏓";
  }

  return (
    <div className="min-h-screen bg-primary-bg flex flex-col items-center justify-center w-full text-center text-white font-primary px-4 sm:px-6 md:px-8">
      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 md:gap-16 bg-primary-elements p-4 sm:p-6 md:p-8 rounded-lg w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl border border-white/10">
        <div className="relative shrink-0">
          <LazyLoadingImage
            dimension={{
              width: "w-24 sm:w-36 md:w-48",
              height: "h-24 sm:h-36 md:h-48",
            }}
            loading={loaded}
          >
            <img
              src={user_data.avatar}
              alt="profile image"
              className={`w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          </LazyLoadingImage>
          {!loaded && (
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
          )}
        </div>
        <div className="flex flex-col items-center sm:items-start justify-center px-2 sm:px-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold break-words max-w-xs sm:max-w-sm md:max-w-md">
            {user_data.name}
          </h1>
          {user_data.verified && (
            <div className="flex items-center text-primary-btn mt-1">
              <MdOutlineVerified size={20} />
              <span className="ml-1 text-sm">Verified User</span>
            </div>
          )}
          <div className="h-3" />
          <span className="rounded-full border border-primary-btn/50 bg-primary-bg px-3 py-1 text-white/75">
            Joined at{" "}
            {user_data.createdAt.substring(0, user_data.createdAt.indexOf("T"))}
          </span>
          <span className="rounded-full border px-3 py-1 border-amber-400/70 bg-amber-500/15 text-amber-200 mt-2">
            Game Level: {user_data.level}
          </span>
          {user_data.bio && (
            <div className="rounded border border-primary-btn/50 bg-primary-bg px-3 py-2 text-white/75 mt-4 w-full max-w-sm sm:max-w-lg max-h-32 overflow-y-auto break-words text-left">
              {user_data.bio}
            </div>
          )}
        </div>
      </div>
      {/* bars for xp and achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-stretch justify-center gap-4 bg-primary-elements p-4 sm:p-6 rounded-lg w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mt-6 sm:mt-8 font-secondary border border-white/10">
        <div className="flex flex-col w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 mt-2">
            XP Progress
          </h2>
          <div className="relative mx-2 sm:mx-4 bg-gray-400/30 h-2 rounded-lg overflow-hidden">
            <div
              className="absolute left-0 top-0 h-2 rounded-lg bg-secondary-btn transition-[width] duration-700 ease-out"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <h3 className="text-sm sm:text-md font-secondary mt-1">
            {user_data.xp} XP /{" "}
            <span className="font-secondary font-bold text-primary-text">
              {total_xp}
            </span>
          </h3>
        </div>
        <div className="flex flex-col w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 mt-2">
            Achievements
          </h2>
          <div className="relative mx-2 sm:mx-4 bg-gray-400/30 h-2 rounded-lg overflow-hidden">
            <div
              className="absolute left-0 top-0 h-2 rounded-lg bg-secondary-btn transition-[width] duration-700 ease-out"
              style={{
                width: `${(user_data.achievements.length / total_achievements) * 100}%`,
              }}
            />
          </div>
          <h3 className="text-sm sm:text-md font-secondary mt-1">
            {user_data.achievements.length} /{" "}
            <span className="font-secondary font-bold text-primary-text">
              {total_achievements}
            </span>
          </h3>
        </div>
      </div>
      {/* Gold, silver, bronze medals  */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-stretch justify-center gap-4 bg-primary-elements p-4 sm:p-6 rounded-lg w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mt-6 sm:mt-8 font-secondary border border-white/10">
        <div className="flex flex-col items-center w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-1 sm:mt-2">
            <span className="text-amber-400">Gold</span> Medals
          </h2>
          <span className="text-base sm:text-lg font-secondary mt-1">
            x{user_data.medals.gold}
          </span>
        </div>
        <div className="flex flex-col items-center w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-1 sm:mt-2">
            <span className="text-gray-400">Silver</span> Medals
          </h2>
          <span className="text-base sm:text-lg font-secondary mt-1">
            x{user_data.medals.silver}
          </span>
        </div>
        <div className="flex flex-col items-center w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 mt-1 sm:mt-2">
            <span className="text-orange-400">Bronze</span> Medals
          </h2>
          <span className="text-base sm:text-lg font-secondary mt-1">
            x{user_data.medals.bronze}
          </span>
        </div>
      </div>
    </div>
  );
}
