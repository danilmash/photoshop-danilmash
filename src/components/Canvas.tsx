import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { useImageData } from "../contexts/ImageDataContext";
import { useCanvasElement } from "../contexts/CanvasElementContext";

function Canvas() {
    const { canvasRef, offsetX, render, imageBitmapRef } = useCanvasElement();
    const containerRef = useRef<HTMLDivElement>(null);
    const firstRender = useRef(true);
    const containerWidth = useRef(0);
    const currentWindowWidth = useRef(window.innerWidth);

    const { image } = useImageData();

    useEffect(() => {
        if (image?.imageBitmap) {
            imageBitmapRef.current = image.imageBitmap;
            render();
        }
    }, [image]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !containerRef.current) return;

        const resize = () => {
            const rect = containerRef.current!.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            render();
        };

        const observer = new ResizeObserver((entries) => {
            if (
                !firstRender.current &&
                currentWindowWidth.current === window.innerWidth
            ) {
                const entry = entries[0];
                offsetX.current += Math.floor(
                    entry.contentRect.width - containerWidth.current
                );
            } else if (firstRender.current) {
                firstRender.current = false;
            }
            currentWindowWidth.current = window.innerWidth;
            containerWidth.current = entries[0].contentRect.width;
            resize();
        });

        observer.observe(containerRef.current);
        resize();

        return () => {
            observer.disconnect();
        };
    }, [image]);

    return (
        <Box
            ref={containerRef}
            sx={{ width: "100%", height: "100%", overflow: "hidden" }}
        >
            <canvas ref={canvasRef} style={{ display: "block" }} />
        </Box>
    );
}

export default Canvas;
