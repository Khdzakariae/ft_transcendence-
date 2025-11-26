import { UserInter } from "../../interfaces/UserInterfaces";
import { useEffect, useRef  } from "react";
import { ScoreBanner } from "./ScoreBanner";
import { UserDataInter } from "../../interfaces/UserInterfaces";

export function GameSection(
    {user, user_data,}: {
      user: UserInter | null;
      user_data: UserDataInter | null;
    }): JSX.Element {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return ;
        // making ccs dims match canvas dims.
        //const rect = canvas.getBoundingClientRect();
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        const ctx = canvas.getContext("2d");
        if  (!ctx)
            return;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.rect(0, 0 , canvas.width,  canvas.height);
        ctx.fill();
        ctx.closePath();
    },[]);

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center w-full text-center text-white font-primary px-4 sm:px-6 md:px-8">
      {/*GAME BANNER */}
    <ScoreBanner user={user as UserInter}
                  user_data={user_data as UserDataInter} />
    {/*Game canvas */}
    <canvas
      ref={canvasRef}
      className="
        block 
        bg-primary-elements 
        p-4 sm:p-6 md:p-8 
        rounded-lg 
        w-full 
        max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-5xl
        border border-white/10
    "
    />
</div>);
}


