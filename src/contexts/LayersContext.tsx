import { useContext, createContext, useState } from "react";
import { Layer } from "../types/interfaces";
import { bilinearInterpolation } from "../utils/interpolation";
import { generateLUT, applyLUT } from "../utils/curves";
import { applyKernel } from "../utils/kernels";

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
        // Проверяем наличие альфа-канала при добавлении слоя
        const hasAlpha = layer.imageData ? checkForAlpha(layer.imageData) : false;
        const layerWithAlpha = {
            ...layer,
            hasAlpha,
            alphaVisible: true
        };
        setLayers((prevLayers) => [...prevLayers, layerWithAlpha]);
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
            prevLayers.map((layer) => {
                if (layer.id === id) {
                    const updatedLayer = { ...layer, ...updates };
                    // Если обновляется imageData, проверяем наличие альфа-канала
                    if (updates.imageData) {
                        updatedLayer.hasAlpha = checkForAlpha(updates.imageData);
                    }
                    return updatedLayer;
                }
                return layer;
            })
        );
    };

    // Функция для проверки наличия альфа-канала
    const checkForAlpha = (imageData: ImageData): boolean => {
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] !== 255) {
                return true;
            }
        }
        return false;
    };

    const scaleLayer = async (id: string, scale: number) => {
        const layer = layers.find(l => l.id === id);
        if (!layer?.baseImageData) return;

        const originalWidth = layer.baseImageData.width;
        const originalHeight = layer.baseImageData.height;
        const scaledWidth = Math.floor((originalWidth * scale) / 100);
        const scaledHeight = Math.floor((originalHeight * scale) / 100);

        // Определяем исходные данные для масштабирования
        let sourceImageData = layer.baseImageData;
        
        // Если есть кривые, применяем их к базовому изображению
        if (layer.curvePoints) {
            const lut = generateLUT(layer.curvePoints.point1, layer.curvePoints.point2);
            sourceImageData = applyLUT(layer.baseImageData, lut);
        }

        // Если есть kernel, применяем его к изображению после кривых
        if (layer.kernelValues) {
            sourceImageData = applyKernel(sourceImageData, layer.kernelValues);
        }

        if (scale === 100) {
            // Для 100% используем исходное изображение
            updateLayer(id, {
                imageData: sourceImageData,
                imageBitmap: await createImageBitmap(sourceImageData),
                width: originalWidth,
                height: originalHeight,
                scale: scale,
                infoPanel: {
                    ...layer.infoPanel,
                },
                hasAlpha: checkForAlpha(sourceImageData),
                alphaVisible: layer.alphaVisible
            });
        } else {
            // Для других масштабов применяем интерполяцию
            const scaledPixelArray = await bilinearInterpolation(
                {
                    data: sourceImageData.data,
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
                },
                hasAlpha: checkForAlpha(scaledImageData),
                alphaVisible: layer.alphaVisible
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
                
                // Учитываем видимость альфа-канала
                if (!layer.alphaVisible && layer.hasAlpha) {
                    // Создаем временный канвас для обработки альфа-канала
                    const tempCanvas = new OffscreenCanvas(layer.width, layer.height);
                    const tempCtx = tempCanvas.getContext("2d");
                    if (tempCtx && layer.imageData) {
                        const tempImageData = new ImageData(
                            new Uint8ClampedArray(layer.imageData.data),
                            layer.imageData.width,
                            layer.imageData.height
                        );
                        // Устанавливаем альфа-канал в 255
                        for (let j = 3; j < tempImageData.data.length; j += 4) {
                            tempImageData.data[j] = 255;
                        }
                        tempCtx.putImageData(tempImageData, 0, 0);
                        ctx.drawImage(tempCanvas, 0, 0);
                    }
                } else {
                    ctx.drawImage(layer.imageBitmap, 0, 0);
                }
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
