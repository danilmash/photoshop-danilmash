import React, {
    createContext,
    useContext,
    useRef,
    useCallback,
    useEffect,
} from "react";
import { useImageData } from "./ImageDataContext";

interface CanvasElementContextType {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    scale: React.RefObject<number>;
    offsetX: React.RefObject<number>;
    offsetY: React.RefObject<number>;
    imageBitmapRef: React.RefObject<ImageBitmap | null>;
    render: () => void;
}

const CanvasElementContext = createContext<
    CanvasElementContextType | undefined
>(undefined);

const CanvasElementProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scale = useRef(1);
    const offsetX = useRef(0);
    const offsetY = useRef(0);
    const imageBitmapRef = useRef<ImageBitmap | null>(null);
    const { image } = useImageData();
    useEffect(() => {
        if (image?.imageBitmap) {
            imageBitmapRef.current = image.imageBitmap;
            render();
        }
    }, [image]);

    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        containerRef.current = canvas.parentElement;
        if (!containerRef.current) return;

        const resize = () => {
            const rect = containerRef.current!.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            render();
        };

        const observer = new ResizeObserver(() => {
            resize();
        });

        observer.observe(containerRef.current);
        resize();

        return () => {
            observer.disconnect();
        };
    }, [image]);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
            const y = canvas.height / 2 - bitmap.height / 2;
            ctx.drawImage(bitmap, x, y);
        }
    }, []);

    return (
        <CanvasElementContext.Provider
            value={{
                canvasRef,
                scale,
                offsetX,
                offsetY,
                imageBitmapRef,
                render,
            }}
        >
            {children}
        </CanvasElementContext.Provider>
    );
};

const useCanvasElement = (): CanvasElementContextType => {
    const context = useContext(CanvasElementContext);
    if (!context) {
        throw new Error(
            "useCanvasElement должен использоваться внутри CanvasElementProvider"
        );
    }
    return context;
};

export { CanvasElementProvider, useCanvasElement };
