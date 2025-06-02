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
    visible: boolean;
    opacity: number;
    blendMode: GlobalCompositeOperation;
    imageData: ImageData | null;
    imageBitmap: ImageBitmap | null;
    baseImageData: ImageData | null;
    baseImageBitmap: ImageBitmap | null;
    infoPanel: {
        colorDepth: number;
        format: string;
        source: string | null | File;
        width: number;
        height: number;
    };
}

export type { GB7Data, CanvasImageData, PixelArray, Layer };
