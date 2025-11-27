import { UserInter } from "../../interfaces/UserInterfaces";
import { useState  } from "react";
import { ScoreBanner } from "./ScoreBanner";
import { UserDataInter } from "../../interfaces/UserInterfaces";
import {Game} from "./Game";

export function GameSection(
    {user, user_data,}: {
      user: UserInter | null;
      user_data: UserDataInter | null;
    }): JSX.Element {
    const [GameState, setGameState] = useState<String>("matchMaking");
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
          <button className=
            "border border-green/20 w-1/3 h-24 bg-primary-elements"
            onClick={() => {
              setGameState("playing");
            }}
              >Play vs A Friend </button>
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