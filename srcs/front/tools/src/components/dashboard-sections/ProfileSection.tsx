import { UserInter } from "../../Utils";
import { ProfileSectionHooks } from "../../hooks/ProfileSectionHooks";

export function ProfileSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  ProfileSectionHooks({ user });

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
      <h1 className="text-white text-2xl font-bold">
        Welcome {`${user?.name}`}! This is your profile.
      </h1>
    </div>
  );
}
