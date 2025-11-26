import { UserInter } from "../../interfaces/UserInterfaces";
import {useEffect, useState} from "react";
import { UserDataInter } from "../../interfaces/UserInterfaces";
import { LazyLoadingImage } from "../LazyLoadingImage";

export function PlayerGameProfile({
	user, user_data} :
		{user : UserInter | null;
			user_data: UserDataInter | null;
		}) : JSX.Element{
		const [loaded, setLoaded] = useState(false);
		const [level, setLevel] = useState<number>(0);
		
		useEffect(() => {
			if (!user_data) return;
			setLevel(user_data.level);
			},[user_data]);
	  	if (!user_data) {
				return (
					<div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
						<h1 className="text-primary-text text-2xl font-bold animate-pulse">
							Failed to load profile...
						</h1>
					</div>
				);
			}
			return (
			<div className="
				flex
				flex-col
				items-center
				bg-black 
				w-full
				max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl
				h-40 sm:h-48 md:h-56 lg:h-64
				gap-y-4
				">
			{/*profile pic */}
			
			<div className="relative shrink-0">
				{user_data.name}
			<LazyLoadingImage
          dimension={{
            width: "w-12 sm:w-18 md:w-24",
            height: "h-12 sm:h-18 md:h-24",
          }}
          loading={loaded}>
			  <img
          src={user_data.avatar}
          alt="profile image"
          className={`w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
			</LazyLoadingImage>
			{!loaded && (
        <div className="absolute inset-0 rounded-full bg-white from-cyan-400/40 to-blue-900/60 opacity-90 blur-md shadow-2xl shadow-cyan-500/30 animate-pulse"></div>
        )}
			</div>
			<div>{`level ${level}`}</div>
			{/*Game score */}
			<div>Score</div>
			</div>
	);
}