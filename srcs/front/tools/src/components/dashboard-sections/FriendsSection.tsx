import { UserInter } from "../../interfaces/UserInterfaces";
import { SearchBarFriends } from "../searchBarFriends";

export function FriendsSection({
  user,
}: {
  user: UserInter | null;
}): JSX.Element {
  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
        <h1 className="text-white text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return <SearchBarFriends currentUserId={user.id} />;
}
