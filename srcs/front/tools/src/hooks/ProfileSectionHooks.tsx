import { useEffect } from "react";
import { UserInter, Utils } from "../Utils";

export function ProfileSectionHooks({
  user,
}: {
  user: UserInter | null;
}): void {
  let user_data: any;
  useEffect(() => {
    let response: any;
    const fetchProfile = async () => {
      try {
        response = await fetch("http://localhost:3000/api/v1/user/me", {
          method: "GET",
          credentials: "include",
        });
      } catch (error) {
        Utils.LogLevel.DEBUG &&
          console.error("Error fetching profile data:", error);
      }
      user_data = await response.json();
      if (user_data?.error) {
        Utils.LogLevel.DEBUG &&
          console.error("Error fetching profile data:", user_data.error);
      } else {
        Utils.LogLevel.DEBUG && console.log("Profile data:", user_data);
      }
    };

    fetchProfile();
  }, [user]);
}
