import { Layer } from "../types/interfaces";

export interface HistogramData {
    r: number[];
    g: number[];
    b: number[];
    a?: number[];
}

export function calculateHistograms(
    imageData: ImageData | Layer,
    includeAlpha: boolean = false
): HistogramData {
    // Инициализируем массивы для каждого канала (256 значений, по одному на каждый уровень яркости)
    const histograms: HistogramData = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0),
    };

    if (includeAlpha) {
        histograms.a = new Array(256).fill(0);
    }

    // Получаем данные пикселей
    const pixels = 'imageData' in imageData ? 
        imageData.imageData?.data : 
        imageData.data;

    if (!pixels) return histograms;

    // Проходим по всем пикселям
    for (let i = 0; i < pixels.length; i += 4) {
        histograms.r[pixels[i]]++;     // Красный канал
        histograms.g[pixels[i + 1]]++; // Зеленый канал
        histograms.b[pixels[i + 2]]++; // Синий канал
        
        if (includeAlpha) {
            histograms.a![pixels[i + 3]]++; // Альфа канал
        }
    }

    // Нормализуем значения к диапазону 0-1
    const maxR = Math.max(...histograms.r);
    const maxG = Math.max(...histograms.g);
    const maxB = Math.max(...histograms.b);
    const maxValue = Math.max(maxR, maxG, maxB);

    histograms.r = histograms.r.map(v => v / maxValue);
    histograms.g = histograms.g.map(v => v / maxValue);
    histograms.b = histograms.b.map(v => v / maxValue);

    if (includeAlpha) {
        const maxA = Math.max(...histograms.a!);
        histograms.a = histograms.a!.map(v => v / maxA);
    }

    return histograms;
}

export function histogramToPoints(
    values: number[],
    width: number,
    height: number
): string {
    const step = width / (values.length - 1);
    return values
        .map((value, index) => `${index * step},${height - value * height}`)
        .join(" ");
} 