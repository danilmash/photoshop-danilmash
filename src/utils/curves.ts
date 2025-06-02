interface Point {
    x: number;
    y: number;
}

export function generateLUT(point1: Point, point2: Point): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256);
    
    // Сортируем точки по x
    const [p1, p2] = point1.x <= point2.x ? [point1, point2] : [point2, point1];
    
    // Заполняем значения до первой точки
    for (let x = 0; x < p1.x; x++) {
        lut[x] = Math.max(0, Math.min(255, p1.y * (x / p1.x)));
    }
    
    // Заполняем значения между точками
    const slope = (p2.y - p1.y) / (p2.x - p1.x);
    for (let x = p1.x; x <= p2.x; x++) {
        lut[x] = Math.max(0, Math.min(255, p1.y + slope * (x - p1.x)));
    }
    
    // Заполняем значения после второй точки
    for (let x = p2.x + 1; x < 256; x++) {
        lut[x] = Math.max(0, Math.min(255, p2.y + (255 - p2.y) * ((x - p2.x) / (255 - p2.x))));
    }
    
    return lut;
}

export function applyLUT(imageData: ImageData, lut: Uint8ClampedArray): ImageData {
    const newData = new Uint8ClampedArray(imageData.data.length);
    for (let i = 0; i < imageData.data.length; i += 4) {
        newData[i] = lut[imageData.data[i]];         // R
        newData[i + 1] = lut[imageData.data[i + 1]]; // G
        newData[i + 2] = lut[imageData.data[i + 2]]; // B
        newData[i + 3] = imageData.data[i + 3];      // A
    }
    return new ImageData(newData, imageData.width, imageData.height);
}

export type { Point }; 