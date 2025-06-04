import { Kernel } from '../utils/kernels';

interface GB7Data {
    width: number;
    height: number;
    colorDepth: number;
    version: number;
    imageData: ImageData;
    imageBitmap: ImageBitmap;
}

interface CanvasImageData {
    imageData: ImageData | null;
    imageBitmap: ImageBitmap | null;
    source: string | null | File;
    width: number;
    height: number;
    colorDepth: number;
    format: string;
}

// Интерфейс для работы с массивом пикселей
interface PixelArray {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}

interface Layer {
    id: string;
    name: string;
    imageData: ImageData | null;
    imageBitmap: ImageBitmap | null;
    baseImageData: ImageData | null;
    visible: boolean;
    opacity: number;
    blendMode: GlobalCompositeOperation;
    width: number;
    height: number;
    scale: number;
    curvePoints?: {
        point1: { x: number; y: number };
        point2: { x: number; y: number };
    };
    kernelValues?: Kernel;
    infoPanel: {
        [key: string]: any;
    };
    alphaVisible: boolean;  // Видимость альфа-канала
    hasAlpha: boolean;      // Наличие альфа-канала
}

export type { GB7Data, CanvasImageData, PixelArray, Layer };
