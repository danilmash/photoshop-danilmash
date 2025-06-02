import { PixelArray } from "../types/interfaces";

function hashPixelData(data: Uint8ClampedArray): string {
    let hash = 0;
    const len = Math.min(data.length, 1000); // Хешируем только первые 1000 байт
    for (let i = 0; i < len; i++) {
        hash = (hash * 31 + data[i]) | 0;
    }
    return hash.toString();
}

async function nearestNeighborInterpolation(
    pixelArray: PixelArray,
    targetWidth: number,
    targetHeight: number
): Promise<PixelArray> {
    const { data: imageData, width, height } = pixelArray; // Входные данные

    if (!imageData) {
        // Проверка наличия данных изображения
        throw new Error(
            "Невозможно выполнить интерполяцию: отсутствуют данные изображения"
        );
    }

    const newImageData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    const scaleX = width / targetWidth; // Масштабирование по ширине
    const scaleY = height / targetHeight; // Масштабирование по высоте

    // Вложенные циклы для перебора пикселей целевого изображения (y - кол-во строк, x - кол-во столбцов)
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            // Вычисление координат пикселя, если бы он был в исходном изображении
            const srcX = Math.floor(x * scaleX);
            const srcY = Math.floor(y * scaleY);

            // Индексы в массиве данных изображения
            const srcIndex = (srcY * width + srcX) * 4;
            const destIndex = (y * targetWidth + x) * 4;

            // Копирование данных пикселя из исходного изображения в новое
            newImageData[destIndex] = imageData[srcIndex];
            newImageData[destIndex + 1] = imageData[srcIndex + 1];
            newImageData[destIndex + 2] = imageData[srcIndex + 2];
            newImageData[destIndex + 3] = imageData[srcIndex + 3];
        }
    }

    return {
        data: newImageData,
        width: targetWidth,
        height: targetHeight,
    };
}

const bilinearCache = new Map<string, Promise<PixelArray>>();

async function bilinearInterpolation(
    pixelArray: PixelArray,
    targetWidth: number,
    targetHeight: number
): Promise<PixelArray> {
    const { data: imageData, width, height } = pixelArray;

    if (!imageData) {
        throw new Error(
            "Невозможно выполнить интерполяцию: отсутствуют данные изображения"
        );
    }

    // Ключ кэша — уникальная строка, идентифицирующая входные данные
    const cacheKey = JSON.stringify({
        width,
        height,
        targetWidth,
        targetHeight,
        hash: hashPixelData(imageData), // см. ниже
    });

    const promise = (async () => {
        const newImageData = new Uint8ClampedArray(
            targetWidth * targetHeight * 4
        );
        const scaleX = width / targetWidth;
        const scaleY = height / targetHeight;

        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const srcX = x * scaleX;
                const srcY = y * scaleY;

                const x1 = Math.floor(srcX);
                const y1 = Math.floor(srcY);
                const x2 = Math.min(x1 + 1, width - 1);
                const y2 = Math.min(y1 + 1, height - 1);

                const a = srcX - x1;
                const b = srcY - y1;

                const weight1 = (1 - a) * (1 - b);
                const weight2 = a * (1 - b);
                const weight3 = (1 - a) * b;
                const weight4 = a * b;

                for (let c = 0; c < 4; c++) {
                    const p1 = imageData[(y1 * width + x1) * 4 + c];
                    const p2 = imageData[(y1 * width + x2) * 4 + c];
                    const p3 = imageData[(y2 * width + x1) * 4 + c];
                    const p4 = imageData[(y2 * width + x2) * 4 + c];

                    newImageData[(y * targetWidth + x) * 4 + c] =
                        p1 * weight1 +
                        p2 * weight2 +
                        p3 * weight3 +
                        p4 * weight4;
                }
            }
        }

        return {
            data: newImageData,
            width: targetWidth,
            height: targetHeight,
        };
    })();

    bilinearCache.set(cacheKey, promise);

    return promise;
}

export { nearestNeighborInterpolation, bilinearInterpolation };
