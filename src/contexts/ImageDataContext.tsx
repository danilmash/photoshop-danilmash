import { createContext, useContext, useState } from "react";
import { CanvasImageData } from "../types/interfaces";

interface ImageDataContextType {
    image: CanvasImageData;
    setImage: (image: CanvasImageData) => void;
}

const ImageDataContext = createContext<ImageDataContextType | undefined>(
    undefined
);

const ImageDataProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [image, setImage] = useState<CanvasImageData>({
        imageData: null,
        imageBitmap: null,
        source: null,
        width: 0,
        height: 0,
        colorDepth: 0,
        format: "",
    });

    return (
        <ImageDataContext.Provider value={{ image, setImage }}>
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
