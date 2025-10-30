import { useEffect } from "react";
import { UserInter, Utils } from "../Utils";
import { UserDataInter } from "../Utils";

export function ProfileSectionHooks({
  user,
  setUserData,
}: {
  user: UserInter | null;
  setUserData: (data: any) => void;
}): void {
  let user_data: UserDataInter | null = null;

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
      const data: any = await response.json();
      data.data.xp = 1000; // mock xp for testing
      user_data = data.data as UserDataInter;
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
