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
    format: string | null;
}

export type { GB7Data, CanvasImageData };
