import { useRef, useEffect } from "react";
import { Box } from "@mui/material";
import { useImageData } from "../contexts/ImageDataContext";

function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const firstRender = useRef(true);
    const containerWidth = useRef(0);
    const currentWindowWidth = useRef(window.innerWidth);
    const scale = useRef(1);
    const offsetX = useRef(0);
    const offsetY = useRef(0);

    const { image } = useImageData();
    const imageBitmapRef = useRef<ImageBitmap | null>(null);

    useEffect(() => {
        if (image?.imageData) {
            createImageBitmap(image.imageData).then((bitmap) => {
                imageBitmapRef.current = bitmap;
                render();
            });
        }
    }, [image]);

    useEffect(() => {
        if (!containerRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const resize = () => {
            // Функция для изменения размера канваса
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                render();
            }
        };

        const observer = new ResizeObserver((entries) => {
            if (
                // Проверка на первый рендер и изменение ширины окна
                !firstRender.current &&
                currentWindowWidth.current == window.innerWidth
            ) {
                // Если ширина окна не изменилась, то не обновляем offsetX
                currentWindowWidth.current = window.innerWidth;
                const entry = entries[0];
                offsetX.current = Math.floor(
                    offsetX.current +
                        (Math.floor(entry.contentRect.width) -
                            Math.floor(containerWidth.current))
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

    function render() {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0); // Сброс трансформаций
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "red";

        ctx.setTransform(
            scale.current,
            0,
            0,
            scale.current,
            offsetX.current,
            offsetY.current
        );

        const bitmap = imageBitmapRef.current;
        if (bitmap) {
            const x = canvas.width / 2 - bitmap.width / 2;
            ctx.drawImage(bitmap, x - offsetX.current / 2, 50);
        }
    }

    useEffect(() => {
        render();
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
