import { UserInter } from "../../interfaces/UserInterfaces";


export function ScoreBanner({user} : {user : UserInter | null}) : JSX.Element{
  return (
    <div className=" 
      bg-primary-elements 
      relative 
      flex 
      items-center 
      justify-center 
      p-8 sm:p-12 md:p-16 
      rounded-lg 
      w-full 
      max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl 
      h-40 sm:h-48 md:h-56 lg:h-64 
      border border-white/10 
      mb-6
    ">
  </div>
);
}