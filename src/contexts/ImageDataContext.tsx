import { createContext, useContext, useEffect, useState } from "react";
import { CanvasImageData } from "../types/interfaces";
import { useLayers } from "./LayersContext";

interface ImageDataContextType {
    image: CanvasImageData;
    setImage: (image: CanvasImageData) => void;
    baseImage: CanvasImageData;
    setBaseImage: (image: CanvasImageData) => void;
}

const ImageDataContext = createContext<ImageDataContextType | undefined>(
    undefined
);

const ImageDataProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { layers, processLayers, getMaxWidthAndHeight } = useLayers();

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
        if (layers.length > 0) {
            const { width, height } = getMaxWidthAndHeight();
            const processedImage = processLayers(width, height);
            const processedImageBitmap = processedImage.imageBitmap;
            const processedImageData = processedImage.imageData;
            setImage((prev) => ({
                ...prev,
                imageData: processedImageData,
                imageBitmap: processedImageBitmap,
                width,
                height,
            }));
            setBaseImage((prev) => ({
                ...prev,
                imageData: processedImageData,
                imageBitmap: processedImageBitmap,
                width,
                height,
            }));
        }
    }, [layers]);

    return (
        <ImageDataContext.Provider
            value={{ image, setImage, baseImage, setBaseImage }}
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
