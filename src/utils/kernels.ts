// Типы для ядер фильтрации
export type Kernel = number[][];

// Преднастроенные ядра
export const KERNELS = {
    // Тождественное отображение
    identity: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ],

    // Повышение резкости
    sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ],

    // Фильтр Гаусса (3x3)
    gaussian: [
        [1/16, 2/16, 1/16],
        [2/16, 4/16, 2/16],
        [1/16, 2/16, 1/16]
    ],

    // Прямоугольное размытие
    boxBlur: [
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9]
    ],

    // Оператор Прюитта (горизонтальный)
    prewittHorizontal: [
        [-1, -1, -1],
        [0, 0, 0],
        [1, 1, 1]
    ],

    // Оператор Прюитта (вертикальный)
    prewittVertical: [
        [-1, 0, 1],
        [-1, 0, 1],
        [-1, 0, 1]
    ]
};

// Функция для обработки краев изображения (padding)
export function padImage(imageData: ImageData, padding: number): ImageData {
    const { width, height, data } = imageData;
    const newWidth = width + 2 * padding;
    const newHeight = height + 2 * padding;
    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

    // Заполняем центральную часть
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const sourceIndex = (y * width + x) * 4;
            const targetIndex = ((y + padding) * newWidth + (x + padding)) * 4;
            newData[targetIndex] = data[sourceIndex];         // R
            newData[targetIndex + 1] = data[sourceIndex + 1]; // G
            newData[targetIndex + 2] = data[sourceIndex + 2]; // B
            newData[targetIndex + 3] = data[sourceIndex + 3]; // A
        }
    }

    // Заполняем верхнюю и нижнюю границы
    for (let x = 0; x < newWidth; x++) {
        for (let p = 0; p < padding; p++) {
            // Верхняя граница
            const sourceY = padding;
            const targetY = p;
            const sourceIndex = (sourceY * newWidth + x) * 4;
            const targetIndex = (targetY * newWidth + x) * 4;
            newData[targetIndex] = newData[sourceIndex];
            newData[targetIndex + 1] = newData[sourceIndex + 1];
            newData[targetIndex + 2] = newData[sourceIndex + 2];
            newData[targetIndex + 3] = newData[sourceIndex + 3];

            // Нижняя граница
            const bottomSourceY = height + padding - 1;
            const bottomTargetY = height + padding + p;
            const bottomSourceIndex = (bottomSourceY * newWidth + x) * 4;
            const bottomTargetIndex = (bottomTargetY * newWidth + x) * 4;
            newData[bottomTargetIndex] = newData[bottomSourceIndex];
            newData[bottomTargetIndex + 1] = newData[bottomSourceIndex + 1];
            newData[bottomTargetIndex + 2] = newData[bottomSourceIndex + 2];
            newData[bottomTargetIndex + 3] = newData[bottomSourceIndex + 3];
        }
    }

    // Заполняем левую и правую границы
    for (let y = 0; y < newHeight; y++) {
        for (let p = 0; p < padding; p++) {
            // Левая граница
            const sourceX = padding;
            const targetX = p;
            const sourceIndex = (y * newWidth + sourceX) * 4;
            const targetIndex = (y * newWidth + targetX) * 4;
            newData[targetIndex] = newData[sourceIndex];
            newData[targetIndex + 1] = newData[sourceIndex + 1];
            newData[targetIndex + 2] = newData[sourceIndex + 2];
            newData[targetIndex + 3] = newData[sourceIndex + 3];

            // Правая граница
            const rightSourceX = width + padding - 1;
            const rightTargetX = width + padding + p;
            const rightSourceIndex = (y * newWidth + rightSourceX) * 4;
            const rightTargetIndex = (y * newWidth + rightTargetX) * 4;
            newData[rightTargetIndex] = newData[rightSourceIndex];
            newData[rightTargetIndex + 1] = newData[rightSourceIndex + 1];
            newData[rightTargetIndex + 2] = newData[rightSourceIndex + 2];
            newData[rightTargetIndex + 3] = newData[rightSourceIndex + 3];
        }
    }

    return new ImageData(newData, newWidth, newHeight);
}

// Функция для применения ядра к изображению
export function applyKernel(imageData: ImageData, kernel: Kernel): ImageData {
    const padding = Math.floor(kernel.length / 2);
    const paddedImage = padImage(imageData, padding);
    const { width: paddedWidth, height: paddedHeight, data: paddedData } = paddedImage;
    const width = imageData.width;
    const height = imageData.height;
    const result = new Uint8ClampedArray(width * height * 4);

    // Для каждого пикселя в изображении
    for (let y = padding; y < paddedHeight - padding; y++) {
        for (let x = padding; x < paddedWidth - padding; x++) {
            let sumR = 0, sumG = 0, sumB = 0;

            // Применяем ядро
            for (let ky = 0; ky < kernel.length; ky++) {
                for (let kx = 0; kx < kernel[0].length; kx++) {
                    const px = x + kx - padding;
                    const py = y + ky - padding;
                    const pixelIndex = (py * paddedWidth + px) * 4;
                    const weight = kernel[ky][kx];

                    sumR += paddedData[pixelIndex] * weight;
                    sumG += paddedData[pixelIndex + 1] * weight;
                    sumB += paddedData[pixelIndex + 2] * weight;
                }
            }

            // Записываем результат
            const targetIndex = ((y - padding) * width + (x - padding)) * 4;
            result[targetIndex] = sumR;     // R
            result[targetIndex + 1] = sumG; // G
            result[targetIndex + 2] = sumB; // B
            result[targetIndex + 3] = paddedData[(y * paddedWidth + x) * 4 + 3]; // Сохраняем оригинальную прозрачность
        }
    }

    return new ImageData(result, width, height);
}

// Функция для нормализации ядра (чтобы сумма всех элементов была равна 1)
export function normalizeKernel(kernel: Kernel): Kernel {
    const sum = kernel.flat().reduce((acc, val) => acc + val, 0);
    if (sum === 0) return kernel; // Если сумма 0, не нормализуем
    return kernel.map(row => row.map(val => val / sum));
}

// Функция для валидации ядра
export function validateKernel(kernel: Kernel): boolean {
    if (!Array.isArray(kernel) || !Array.isArray(kernel[0])) return false;
    const height = kernel.length;
    const width = kernel[0].length;
    
    // Проверяем, что ядро квадратное и нечетного размера
    if (height !== width || height % 2 === 0) return false;
    
    // Проверяем, что все строки одинаковой длины и содержат только числа
    return kernel.every(row => 
        Array.isArray(row) && 
        row.length === width && 
        row.every(val => typeof val === 'number' && !isNaN(val))
    );
} 