import { UserInter } from "../../interfaces/UserInterfaces";
import { useEffect, useRef  } from "react";
export function GameSection({ user }: { user: UserInter | null }): JSX.Element {
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
<div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">

    {/* Top overlay  : add some game functionality to this*/}
    <div className="absolute top-0 left-0 w-full flex items-center justify-center z-10 pointer-events-none">
      <p className="text-white text-xl font-bold text-center">Game Functions</p>
  </div>
    {/* Canvas for game*/}
    <canvas
      ref={canvasRef}
      className="block bg-primary-elements p-4 sm:p-6 md:p-8 rounded-lg w-full border border-white/10"
    />

</div>

  );
}


