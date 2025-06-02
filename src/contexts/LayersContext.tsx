import { useContext, createContext, useState } from "react";
import { Layer } from "../types/interfaces";

interface LayersContextType {
    layers: Layer[];
    activeLayerId: string | null;
    setLayers: (layers: Layer[]) => void;
    setActiveLayerId: (id: string | null) => void;
    addLayer: (layer: Layer) => void;
    removeLayer: (id: string) => void;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    processLayers: (
        width: number,
        height: number
    ) => { imageBitmap: ImageBitmap; imageData: ImageData }; // Опционально, если нужно
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
            setActiveLayerId(null);
        }
    };

    const updateLayer = (id: string, updates: Partial<Layer>) => {
        setLayers((prevLayers) =>
            prevLayers.map((layer) =>
                layer.id === id ? { ...layer, ...updates } : layer
            )
        );
    };

    function processLayers(
        width: number,
        height: number
    ): { imageBitmap: ImageBitmap; imageData: ImageData } {
        const canvas = new OffscreenCanvas(width, height); // Замените на нужные размеры
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Не удалось получить контекст рисования");
        }
        ctx.clearRect(0, 0, width, height);
        layers.forEach((layer) => {
            if (layer.imageBitmap && layer.visible) {
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = layer.blendMode;
                ctx.drawImage(layer.imageBitmap, 0, 0);
            }
        });

        const imageData = ctx.getImageData(0, 0, width, height);
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
            ...layers.map((layer) => layer.imageBitmap?.width || 0)
        );
        const maxHeight = Math.max(
            ...layers.map((layer) => layer.imageBitmap?.height || 0)
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
