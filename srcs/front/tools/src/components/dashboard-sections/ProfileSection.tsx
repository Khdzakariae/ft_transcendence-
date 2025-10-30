import { useEffect, useState } from "react";
import { UserInter } from "../../Utils";
import { ProfileSectionHooks } from "../../hooks/ProfileSectionHooks";
import { UserDataInter } from "../../Utils";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { MdOutlineVerified } from "react-icons/md";

export function ProfileSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  const [user_data, setUserData] = useState<UserDataInter | null>(null);
  const [loaded, setLoaded] = useState(false);
  const total_xp: number = 6000;
  const [xpProgress, setXpProgress] = useState<number>(0);

  ProfileSectionHooks({ user, setUserData });

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
        <h1 className="text-white text-2xl font-bold">
          Failed to load profile...
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg flex flex-col items-center justify-center w-full text-center text-white font-primary">
      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 bg-primary-elements p-4 rounded-lg w-full max-w-xl md:max-w-2xl lg:max-w-3xl">
        <div className="relative">
          <LazyLoadingImage
            dimension={{ width: "w-24 sm:w-48", height: "h-24 sm:h-48" }}
            loading={loaded}
          >
            <img
              src={user_data.avatar}
              alt="profile image"
              className={`w-24 h-24 sm:w-48 sm:h-48 rounded-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          </LazyLoadingImage>
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold">{user_data.name}</h1>
          {user_data.verified && (
            <div className="flex items-center text-primary-btn mt-1">
              <MdOutlineVerified size={20} />
              <span className="ml-1 text-sm">Verified User</span>
            </div>
          )}
          <br />
          <p className="text-md">
            Joined at{" "}
            {user_data.createdAt.substring(0, user_data.createdAt.indexOf("T"))}
          </p>
          <p className="text-lg font-bold font-secondary mt-4 text-primary-text">
            Current Game Level: {user_data.level}
          </p>
          <p className="text-lg font-bold font-secondary text-primary-text">
            Keep Serving 🏓
          </p>
        </div>
      </div>
      {/* bars for xp and achievements */}
      <div className="flex flex-row items-center justify-center gap-4 bg-primary-elements p-4 rounded-lg w-full max-w-xl md:max-w-2xl lg:max-w-3xl mt-8">
        <div className="flex flex-col w-full">
          <h2 className="text-2xl font-bold mb-2 mt-2">XP Progress</h2>
          <div className="relative mx-4 bg-gray-400/30 h-2 rounded-lg overflow-hidden">
            <div
              className="absolute left-0 top-0 h-2 rounded-lg bg-secondary-btn transition-[width] duration-700 ease-out"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <h3 className="text-md font-secondary mt-1">
            {user_data.xp} XP /{" "}
            <span className="font-secondary font-bold text-primary-text">
              {total_xp}
            </span>
          </h3>
        </div>
      </div>
    </div>
  );
}
