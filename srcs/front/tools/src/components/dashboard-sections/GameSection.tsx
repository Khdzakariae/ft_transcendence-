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
    
        canvas.width = 800;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        //ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.rect(0, 0 , canvas.width,  canvas.height);
        ctx.fill();
        ctx.closePath();
    },[]);

  return (
    <div>
      <canvas
        ref={canvasRef}
      />
    </div>
  );
}
