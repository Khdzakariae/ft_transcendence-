import { useDashboardContext } from "../../Pages/Dashboard";

export function DashSection(): JSX.Element {
  const { user } = useDashboardContext();

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
      <h1 className="text-white text-2xl font-bold">
        Welcome {`${user?.name}`}! This is your dashboard.
      </h1>
    </div>
  );
}
