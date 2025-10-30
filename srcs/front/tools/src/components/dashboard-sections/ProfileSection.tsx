import { useState } from "react";
import { UserInter } from "../../Utils";
import { ProfileSectionHooks } from "../../hooks/ProfileSectionHooks";
import { UserDataInter } from "../../Utils";

export function ProfileSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  const [user_data, setUserData] = useState<UserDataInter | null>(null);

  ProfileSectionHooks({ user, setUserData });

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
    <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
      <h1 className="text-white text-2xl font-bold">
        Welcome {`${user?.name}`}! This is your profile.
      </h1>
    </div>
  );
}
