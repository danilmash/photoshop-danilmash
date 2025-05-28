import { PixelArray } from "../types/interfaces";

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

async function bilinearInterpolation(
    pixelArray: PixelArray,
    targetWidth: number,
    targetHeight: number
): Promise<PixelArray> {
    const { data: imageData, width, height } = pixelArray; // Входные данные

    // Проверка наличия данных изображения
    if (!imageData) {
        throw new Error(
            "Невозможно выполнить интерполяцию: отсутствуют данные изображения"
        );
    }

    const newImageData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    const scaleX = width / targetWidth; // Масштабирование по ширине
    const scaleY = height / targetHeight; // Масштабирование по высоте

    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            // Вычисление координат пикселя, если бы он был в исходном изображении
            const srcX = x * scaleX;
            const srcY = y * scaleY;

            // Координаты левого верхнего пикселя исходного изображения
            const x1 = Math.floor(srcX);
            const y1 = Math.floor(srcY);

            // Координаты правого нижнего пикселя исходного изображения.
            // Здесь нужно использовать Math.min, чтобы не выйти за границы,
            // так как верхний и левый пиксели могут быть последними в строке или столбце
            const x2 = Math.min(x1 + 1, width - 1);
            const y2 = Math.min(y1 + 1, height - 1);

            // Вычисление расстояний от координат пикселя в исходном изображении до левого верхнего ближайшего пикселя
            // a - это расстояние по X, b - по Y
            const a = srcX - x1;
            const b = srcY - y1;

            const weight1 = (1 - a) * (1 - b);
            const weight2 = a * (1 - b); // 1-b расстояние по Y от левого нижнего пикселя
            const weight3 = (1 - a) * b; // 1-a расстоение по X от правого верхнего пикселя
            const weight4 = a * b;

            for (let c = 0; c < 4; c++) {
                // Индексы пикселей в исходном изображении
                const p1 = imageData[(y1 * width + x1) * 4 + c];
                const p2 = imageData[(y1 * width + x2) * 4 + c];
                const p3 = imageData[(y2 * width + x1) * 4 + c];
                const p4 = imageData[(y2 * width + x2) * 4 + c];

                newImageData[(y * targetWidth + x) * 4 + c] =
                    p1 * weight1 + p2 * weight2 + p3 * weight3 + p4 * weight4;
            }
        }
    }

    return {
        data: newImageData,
        width: targetWidth,
        height: targetHeight,
    };
}

export { nearestNeighborInterpolation, bilinearInterpolation };
