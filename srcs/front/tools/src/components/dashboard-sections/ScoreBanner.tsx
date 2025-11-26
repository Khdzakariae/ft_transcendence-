import { UserInter } from "../../interfaces/UserInterfaces";
import { PlayerGameProfile } from "./PlayerGameProfile";
import { UserDataInter } from "../../interfaces/UserInterfaces";

export function ScoreBanner({user, user_data} : 
      {user : UserInter | null;
      user_data : UserDataInter;}) : JSX.Element{
  return (
    <div className=" 
      bg-primary-elements 
      relative 
      flex 
      items-center 
      rounded-lg
      w-full
      max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl 
      h-40 sm:h-48 md:h-56 lg:h-64 
      border border-white/10 
      mb-6
    ">
      {/*Player 1 section */}
    <PlayerGameProfile user={user as UserInter} user_data={user_data as UserDataInter}/>
    <div className="
      bg-blue
      w-full
      max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl
      h-40 sm:h-48 md:h-56 lg:h-64 
      ">Player 2</div>
  </div>
);
}