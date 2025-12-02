import { UserInter } from "../../interfaces/UserInterfaces";
import { useState, useCallback, useEffect } from "react";
import { ScoreBanner } from "./ScoreBanner";
import { UserDataInter } from "../../interfaces/UserInterfaces";
import {Game} from "./Game";

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  onlineStatus: boolean;
}

export function GameSection(
    {user, user_data,}: {
      user: UserInter | null;
      user_data: UserDataInter | null;
    }): JSX.Element {
    const [GameState, setGameState] = useState<String>("matchMaking");
    const [value, setValue] = useState<string>("");
    const [friends, setFriends] = useState<Friend[]>([]);
    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
  }

  const fetchFriends = useCallback(async (abortSignal?: AbortSignal) => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/friends", {
        method: "GET",
        credentials: "include",
        signal: abortSignal,
      });
      if (!response.ok) {
        const data = await response.json();
        console.log(data);
        throw new Error("Failed to fetch friends");
      }
      const data = await response.json();
      if (data.data && !abortSignal?.aborted) {
        // API returns friends in format: { friendshipId, friendSince, user: {...} }
        // Extract the user object from each friendship
        const validatedFriends = data.data
          .filter((f: any) => f && f.user && f.user.id)
          .map((f: any) => ({
            id: f.user.id,
            name: f.user.name || null,
            email: f.user.email || null,
            avatar: f.user.avatar || null,
            onlineStatus: f.user.onlineStatus || false,
          }));
          setFriends(validatedFriends);
          console.log(friends);
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && !abortSignal?.aborted) {
        throw new Error("Failed to fetch friends");
      }
    }
  }, []);

  const handleGameRequest = async (userId: string) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/friends/gamerequest",
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(
          errorData.error + ` for id: (${userId})` ||
            "Failed to send game request"
        );
      }
      alert("game request sent successfully!");
    } catch (err: any) {
        alert(err.message);
    }
  };

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    fetchFriends(controller.signal);

    return () => {
      controller.abort();
    };
  }, [user, fetchFriends]);

  const handleSubmit = (e:React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // send a game request.
      const friend = friends.find(f => f.name === value);
      if (!friend)
      {
          alert(`friend was not found`);
          return ;
      }
          // send a game request from this user to the othe user.
      handleGameRequest(friend.id);
  }

 return (
  <div className=" bg-primary-elements min-h-screen flex flex-col items-center justify-center w-full text-center text-white font-primary px-4 sm:px-6 md:px-8">
    {GameState === "matchMaking" ?
  <div
    className="
      bg-primary-elements
      p-4 sm:p-6 md:p-8
      rounded-lg
      w-2/3
      h-2/3
      max-w-4xl
      mx-auto
      border border-white/10
      flex flex-row items-center justify-center
      ">
      <button onClick={() => {
          setGameState("pairing");}}>Find A Game!</button>
      </div>
      : null}
    {GameState === "pairing" ?
    <div
      className="
        bg-primary-elements
        p-4 sm:p-6 md:p-8
        rounded-lg
        gap-20
        w-2/3
        h-2/3
        max-w-4xl
        mx-auto
        border border-white/10
        flex flex-col items-center justify-center
        ">
      <form onSubmit={handleSubmit}>
        <label> Enter your name:
        <input
          className="bg-black text-white p-2 rounded"
          type="text" 
          value={value}
          onChange={handleChange}
        />
      </label>
      <input type="submit"
            className="p-2 rounded"/>
      </form>
      <button className="border border-white/20 w-1/3 h-24 bg-primary-elements"
        onClick={() => {
          setGameState("playing");
          }}>Play vs A random Player</button>
    </div>  : null}
    { GameState === "playing" ?
      <ScoreBanner user={user as UserInter}
                  user_data={user_data as UserDataInter} />
    : null}
    { GameState === "playing" ?
    <Game user={user as UserInter}
              user_data={user_data as UserDataInter} />
      : null}
    </div>
    );
}