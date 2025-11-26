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
  <div className="bg-black min-h-screen flex flex-col items-center justify-center w-full text-center text-white font-primary px-4 sm:px-6 md:px-8">
    {GameState === "matchMaking" ?
      <div className ="
        	flex
          flex-row
        	bg-primary-elements 
        	p-4 sm:p-6 md:p-8
        	rounded-lg 
        	w-full 
        	max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl
        	border border-white/10
          ">
        <button onClick={() => {
          setGameState("playing");}}>Click HERE!</button>
      </div>
      : null}
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