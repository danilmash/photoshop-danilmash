import { createContext, useContext, useEffect, useState } from "react";
import { CanvasImageData } from "../types/interfaces";
import { useLayers } from "./LayersContext";

interface ImageDataContextType {
    image: CanvasImageData;
    setImage: (image: CanvasImageData) => void;
    baseImage: CanvasImageData;
    setBaseImage: (image: CanvasImageData) => void;
    scale: number;
    setScale: (scale: number) => void;
}

const ImageDataContext = createContext<ImageDataContextType | undefined>(
    undefined
);

const ImageDataProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { layers, processLayers, getMaxWidthAndHeight } = useLayers();
    const [scale, setScale] = useState(100);

    const [image, setImage] = useState<CanvasImageData>({
        imageData: null,
        imageBitmap: null,
        source: null,
        width: 0,
        height: 0,
        colorDepth: 0,
        format: "",
    });

    const [baseImage, setBaseImage] = useState<CanvasImageData>({
        imageData: null,
        imageBitmap: null,
        source: null,
        width: 0,
        height: 0,
        colorDepth: 0,
        format: "",
    });

    useEffect(() => {
        const updateImage = async () => {
            if (layers.length > 0) {
                const { width, height } = getMaxWidthAndHeight();
                const processedImage = await processLayers(width, height, scale);

                // Обновляем baseImage с оригинальными размерами
                setBaseImage((prev) => ({
                    ...prev,
                    imageData: processedImage.imageData,
                    imageBitmap: processedImage.imageBitmap,
                    width,
                    height,
                }));

                // Обновляем image с масштабированными размерами
                const scaledWidth = Math.floor((width * scale) / 100);
                const scaledHeight = Math.floor((height * scale) / 100);
                setImage((prev) => ({
                    ...prev,
                    imageData: processedImage.imageData,
                    imageBitmap: processedImage.imageBitmap,
                    width: scaledWidth,
                    height: scaledHeight,
                }));
            }
        };

        updateImage();
    }, [layers, scale, getMaxWidthAndHeight, processLayers]);

    return (
        <ImageDataContext.Provider
            value={{ image, setImage, baseImage, setBaseImage, scale, setScale }}
        >
            {children}
        </ImageDataContext.Provider>
    );
};

const useImageData = (): ImageDataContextType => {
    const context = useContext(ImageDataContext);
    if (!context) {
        throw new Error(
            "useImageData должен использоваться внутри ImageDataProvider"
        );
    }
    return context;
};

export { ImageDataProvider, useImageData, ImageDataContext };
