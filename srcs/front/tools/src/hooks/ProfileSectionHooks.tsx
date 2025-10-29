import { useEffect } from "react";
import { UserInter, Utils } from "../Utils";

export function ProfileSectionHooks({
  user,
  setUserData,
}: {
  user: UserInter | null;
  setUserData: (data: any) => void;
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
        setUserData(user_data);
        Utils.LogLevel.DEBUG && console.log("Profile data:", user_data);
      }
    };

    fetchProfile();
  }, [user]);
}
