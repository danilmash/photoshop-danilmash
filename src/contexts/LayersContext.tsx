import { useContext, createContext, useState } from "react";
import { Layer } from "../types/interfaces";
import { bilinearInterpolation } from "../utils/interpolation";

interface LayersContextType {
    layers: Layer[];
    activeLayerId: string | null;
    setLayers: (layers: Layer[]) => void;
    setActiveLayerId: (id: string | null) => void;
    addLayer: (layer: Layer) => void;
    removeLayer: (id: string) => void;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    scaleLayer: (id: string, scale: number) => Promise<void>;
    processLayers: (
        width: number,
        height: number,
        scale: number
    ) => Promise<{ imageBitmap: ImageBitmap; imageData: ImageData }>;
    getMaxWidthAndHeight: () => { width: number; height: number };
}

const LayersContext = createContext<LayersContextType | undefined>(undefined);

function LayersProvider({ children }: { children: React.ReactNode }) {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

    const addLayer = (layer: Layer) => {
        setLayers((prevLayers) => [...prevLayers, layer]);
        setActiveLayerId(layer.id);
    };

    const removeLayer = (id: string) => {
        setLayers((prevLayers) =>
            prevLayers.filter((layer) => layer.id !== id)
        );
        if (activeLayerId === id) {
            setActiveLayerId(layers[0]?.id || null);
        }
    };

    const updateLayer = (id: string, updates: Partial<Layer>) => {
        setLayers((prevLayers) =>
            prevLayers.map((layer) =>
                layer.id === id ? { ...layer, ...updates } : layer
            )
        );
    };

    const scaleLayer = async (id: string, scale: number) => {
        const layer = layers.find(l => l.id === id);
        if (!layer?.baseImageData) return;

        const originalWidth = layer.baseImageData.width;
        const originalHeight = layer.baseImageData.height;
        const scaledWidth = Math.floor((originalWidth * scale) / 100);
        const scaledHeight = Math.floor((originalHeight * scale) / 100);

        if (scale === 100) {
            // Для 100% используем оригинальное изображение
            updateLayer(id, {
                imageData: layer.baseImageData,
                imageBitmap: layer.baseImageBitmap,
                width: originalWidth,
                height: originalHeight,
                scale: scale,
                infoPanel: {
                    ...layer.infoPanel,
                    width: originalWidth,
                    height: originalHeight,
                },
            });
        } else {
            // Для других масштабов применяем интерполяцию
            const scaledPixelArray = await bilinearInterpolation(
                {
                    data: layer.baseImageData.data,
                    width: originalWidth,
                    height: originalHeight,
                },
                scaledWidth,
                scaledHeight
            );

            const scaledImageData = new ImageData(
                scaledPixelArray.data,
                scaledPixelArray.width,
                scaledPixelArray.height
            );

            const scaledImageBitmap = await createImageBitmap(scaledImageData);

            updateLayer(id, {
                imageData: scaledImageData,
                imageBitmap: scaledImageBitmap,
                width: scaledWidth,
                height: scaledHeight,
                scale: scale,
                infoPanel: {
                    ...layer.infoPanel,
                    width: scaledWidth,
                    height: scaledHeight,
                },
            });
        }
    };

    async function processLayers(
        width: number,
        height: number,
        scale: number
    ): Promise<{ imageBitmap: ImageBitmap; imageData: ImageData }> {
        // Создаем канвас с масштабированными размерами
        const scaledWidth = Math.floor((width * scale) / 100);
        const scaledHeight = Math.floor((height * scale) / 100);
        const canvas = new OffscreenCanvas(scaledWidth, scaledHeight);
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Не удалось получить контекст рисования");
        }

        ctx.clearRect(0, 0, scaledWidth, scaledHeight);

        // Отрисовываем слои в обратном порядке, чтобы верхний слой в панели отрисовывался последним
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.visible && layer.imageBitmap) {
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = layer.blendMode;
                ctx.drawImage(layer.imageBitmap, 0, 0);
            }
        }

        const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
        const imageBitmap = canvas.transferToImageBitmap();

        return { imageBitmap, imageData };
    }

    function getMaxWidthAndHeight(): {
        width: number;
        height: number;
    } {
        if (layers.length === 0) {
            return { width: 0, height: 0 };
        }

        const maxWidth = Math.max(
            ...layers.map((layer) => layer.width || 0)
        );
        const maxHeight = Math.max(
            ...layers.map((layer) => layer.height || 0)
        );
        return { width: maxWidth, height: maxHeight };
    }

    return (
        <LayersContext.Provider
            value={{
                layers,
                activeLayerId,
                setLayers,
                setActiveLayerId,
                addLayer,
                removeLayer,
                updateLayer,
                scaleLayer,
                processLayers,
                getMaxWidthAndHeight,
            }}
        >
            {children}
        </LayersContext.Provider>
    );
}

function useLayers() {
    const context = useContext(LayersContext);
    if (!context) {
        throw new Error(
            "useLayers должен использоваться внутри LayersProvider"
        );
    }
    return context;
}

export { LayersProvider, useLayers, LayersContext };
