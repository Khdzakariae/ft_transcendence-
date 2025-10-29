import { UserInter } from "../../Utils";

export function DashSection({ user }: { user: UserInter | null }): JSX.Element {
  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
      <h1 className="text-white text-2xl font-bold">
        Welcome {`${user?.name}`}! This is your dashboard.
      </h1>
    </div>
  );
}
