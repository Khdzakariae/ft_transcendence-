import { useEffect, useState } from "react";
import { LazyLoadingImage } from "../LazyLoadingImage";
import { MdOutlineVerified } from "react-icons/md";
import { useDashboardContext } from "../../Pages/Dashboard";
import { UserDataInter } from "../../interfaces/UserInterfaces";

interface ProfileSectionProps {
  user_data?: UserDataInter | null;
}

export function ProfileSection({ user_data: propUserData }: ProfileSectionProps = {}): JSX.Element {
  // Try to get context, but don't fail if not in Dashboard
  let contextUserData: UserDataInter | null = null;
  try {
    const context = useDashboardContext();
    contextUserData = context.user_data;
  } catch {
    // Not within Dashboard context, use props only
  }
  const user_data = propUserData ?? contextUserData;
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

  return (
    <div className="min-h-screen bg-primary-bg flex flex-col items-center justify-start w-full text-white font-primary px-4 sm:px-6 md:px-8 py-8 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-btn/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary-btn/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-5xl space-y-6">
        {/* Profile Header Card */}
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden group">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-btn/10 to-secondary-btn/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* Avatar Section */}
          <div className="relative shrink-0 z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-btn to-secondary-btn rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative">
              <LazyLoadingImage
                dimension={{
                  width: "w-32 sm:w-40 md:w-48",
                  height: "h-32 sm:h-40 md:h-48",
                }}
                loading={loaded}
              >
                <img
                  src={user_data.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=pingpong-paddle-1&backgroundColor=FF6B00"}
                  alt="profile image"
                  className={`w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full transition-all duration-500 border-4 border-primary-btn/50 ring-4 ring-primary-btn/20 shadow-2xl ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                  loading="lazy"
                  onLoad={() => setLoaded(true)}
                />
              </LazyLoadingImage>
              {!loaded && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-btn/40 via-secondary-btn/40 to-primary-btn/40 opacity-90 blur-lg animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col items-center sm:items-start justify-center flex-1 z-10 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-secondary bg-gradient-to-r from-cyan-400 via-white to-orange-400 bg-clip-text text-transparent break-words">
              {user_data.name}
            </h1>
            
            {user_data.verified && (
              <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-btn/20 to-secondary-btn/20 border border-primary-btn/30">
                <MdOutlineVerified className="text-primary-btn" size={20} />
                <span className="text-sm font-semibold text-white/90">Verified Player</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary-btn/40 bg-gradient-to-br from-primary-btn/10 to-primary-btn/5 text-white/80 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <span className="text-base">📅</span>
                Joined {user_data.createdAt.substring(0, user_data.createdAt.indexOf("T"))}
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-400/60 bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-300 text-sm font-bold backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <span className="text-base">⚡</span>
                Level {user_data.level}
              </span>
            </div>
          </div>
        </div>
        {/* Stats Cards - XP and Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* XP Progress Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-btn/10 to-primary-btn/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-btn to-primary-btn flex items-center justify-center text-2xl shadow-lg">
                  ⚡
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-secondary text-white">
                    XP Progress
                  </h2>
                  <p className="text-xs text-white/60">Experience Points</p>
                </div>
              </div>
              
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-secondary-btn to-primary-btn transition-[width] duration-700 ease-out shadow-lg"
                  style={{ width: `${xpProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xl font-bold text-white">
                  {user_data.xp}
                </span>
                <span className="text-sm text-white/50">
                  / <span className="text-primary-btn font-semibold">{total_xp}</span> XP
                </span>
              </div>
              
              <div className="mt-2 text-xs text-white/60">
                {xpProgress}% Complete
              </div>
            </div>
          </div>

          {/* Achievements Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
                  🏆
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-secondary text-white">
                    Achievements
                  </h2>
                  <p className="text-xs text-white/60">Unlocked Badges</p>
                </div>
              </div>
              
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-[width] duration-700 ease-out shadow-lg"
                  style={{
                    width: `${(user_data.achievements.length / total_achievements) * 100}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xl font-bold text-white">
                  {user_data.achievements.length}
                </span>
                <span className="text-sm text-white/50">
                  / <span className="text-amber-400 font-semibold">{total_achievements}</span> Unlocked
                </span>
              </div>
              
              <div className="mt-2 text-xs text-white/60">
                {Math.round((user_data.achievements.length / total_achievements) * 100)}% Complete
              </div>
            </div>
          </div>
        </div>
        {/* Medals Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Gold Medal Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-amber-400/30 shadow-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:border-amber-400/50">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-3xl shadow-2xl shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                🥇
              </div>
              <h3 className="text-lg font-bold text-amber-400 mb-1">
                Gold Medals
              </h3>
              <p className="text-3xl font-bold font-secondary text-white">
                {user_data.medals.gold}
              </p>
              <p className="text-xs text-white/50 mt-1">First Place</p>
            </div>
          </div>

          {/* Silver Medal Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-gray-400/30 shadow-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:border-gray-400/50">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 to-gray-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-3xl shadow-2xl shadow-gray-400/30 group-hover:scale-110 transition-transform duration-300">
                🥈
              </div>
              <h3 className="text-lg font-bold text-gray-400 mb-1">
                Silver Medals
              </h3>
              <p className="text-3xl font-bold font-secondary text-white">
                {user_data.medals.silver}
              </p>
              <p className="text-xs text-white/50 mt-1">Second Place</p>
            </div>
          </div>

          {/* Bronze Medal Card */}
          <div className="relative bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-6 rounded-2xl border-2 border-orange-400/30 shadow-xl overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:border-orange-400/50">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-amber-700 flex items-center justify-center text-3xl shadow-2xl shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                🥉
              </div>
              <h3 className="text-lg font-bold text-orange-400 mb-1">
                Bronze Medals
              </h3>
              <p className="text-3xl font-bold font-secondary text-white">
                {user_data.medals.bronze}
              </p>
              <p className="text-xs text-white/50 mt-1">Third Place</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//  <img
//                                   src={friend.avatar}
//                                   alt={friend.name || "User"}
//                                   className="w-12 h-12 rounded-full object-cover"
//                                 />
//                               ) : (
//                                 <div className="w-12 h-12 rounded-full bg-primary-btn/30 flex items-center justify-center text-lg font-semibold">
//                                   {getInitials(friend.name)}
//                                 </div>

{
  /* <LazyLoadingImage
                        dimension={{
                          width: "w-10",
                          height: "h-10",
                        }}
                        loading={loaded}
                      >
                        <img
                          src={getChatAvatar(chat)}
                          alt="profile image"
                          className={`w-10 h-10 rounded-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
                          loading="lazy"
                          onLoad={() => setLoaded(true)}
                        />
                        {!loaded && (
                          <div className="absolute inset-0 rounded-full bg-gradient-radial from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
                        )}
                      </LazyLoadingImage> */
}
