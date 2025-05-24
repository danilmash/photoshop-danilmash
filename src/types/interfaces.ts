interface ImageProperties {
    width: number;
    height: number;
    colorDepth: number;
    format: string;
}

interface GB7Data {
    width: number;
    height: number;
    colorDepth: number;
    version: number;
    imageData: ImageData;
}

export type { ImageProperties, GB7Data };
