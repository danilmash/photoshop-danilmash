import { describe, it, expect } from 'vitest';
import { validateKernel, normalizeKernel, KERNELS, padImage, applyKernel } from '../kernels';
import './mocks';

describe('Kernel Validation', () => {
    it('should validate correct kernels', () => {
        expect(validateKernel(KERNELS.identity)).toBe(true);
        expect(validateKernel(KERNELS.gaussian)).toBe(true);
        expect(validateKernel(KERNELS.sharpen)).toBe(true);
    });

    it('should reject non-square kernels', () => {
        const nonSquareKernel = [
            [1, 1],
            [1, 1],
            [1, 1]
        ];
        expect(validateKernel(nonSquareKernel)).toBe(false);
    });

    it('should reject even-sized kernels', () => {
        const evenKernel = [
            [1, 1, 1, 1],
            [1, 1, 1, 1],
            [1, 1, 1, 1],
            [1, 1, 1, 1]
        ];
        expect(validateKernel(evenKernel)).toBe(false);
    });

    it('should reject kernels with non-numeric values', () => {
        const invalidKernel = [
            [1, '2' as any, 1],
            [1, 1, 1],
            [1, 1, 1]
        ];
        expect(validateKernel(invalidKernel)).toBe(false);
    });
});

describe('Kernel Normalization', () => {
    it('should normalize kernel values to sum to 1', () => {
        const kernel = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ];
        const normalized = normalizeKernel(kernel);
        const sum = normalized.flat().reduce((acc, val) => acc + val, 0);
        expect(sum).toBeCloseTo(1);
    });

    it('should not change zero-sum kernels', () => {
        const kernel = [
            [-1, -1, -1],
            [-1, 8, -1],
            [-1, -1, -1]
        ];
        const normalized = normalizeKernel(kernel);
        expect(normalized).toEqual(kernel);
    });

    it('should preserve kernel structure', () => {
        const kernel = KERNELS.gaussian;
        const normalized = normalizeKernel(kernel);
        expect(normalized.length).toBe(kernel.length);
        expect(normalized[0].length).toBe(kernel[0].length);
    });
});

describe('Image Padding', () => {
    it('should correctly pad image data', () => {
        // Создаем тестовое изображение 2x2
        const imageData = new ImageData(2, 2);
        // Заполняем красным цветом
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;     // R
            imageData.data[i + 1] = 0;   // G
            imageData.data[i + 2] = 0;   // B
            imageData.data[i + 3] = 255; // A
        }

        const padding = 1;
        const paddedImage = padImage(imageData, padding);

        // Проверяем размеры
        expect(paddedImage.width).toBe(imageData.width + 2 * padding);
        expect(paddedImage.height).toBe(imageData.height + 2 * padding);

        // Проверяем, что центральные пиксели сохранились
        const centerPixelIndex = ((padding * paddedImage.width) + padding) * 4;
        expect(paddedImage.data[centerPixelIndex]).toBe(255);     // R
        expect(paddedImage.data[centerPixelIndex + 1]).toBe(0);   // G
        expect(paddedImage.data[centerPixelIndex + 2]).toBe(0);   // B
        expect(paddedImage.data[centerPixelIndex + 3]).toBe(255); // A
    });
});

describe('Kernel Application', () => {
    it('should apply identity kernel without changing the image', () => {
        // Создаем тестовое изображение
        const imageData = new ImageData(2, 2);
        // Заполняем случайными значениями
        for (let i = 0; i < imageData.data.length; i++) {
            imageData.data[i] = Math.floor(Math.random() * 256);
        }

        const result = applyKernel(imageData, KERNELS.identity);

        // Проверяем, что размеры сохранились
        expect(result.width).toBe(imageData.width);
        expect(result.height).toBe(imageData.height);

        // При применении тождественного ядра значения должны остаться примерно теми же
        for (let i = 0; i < imageData.data.length; i++) {
            expect(result.data[i]).toBeCloseTo(imageData.data[i], 0);
        }
    });

    it('should apply gaussian blur kernel', () => {
        // Создаем тестовое изображение с резким переходом
        const imageData = new ImageData(3, 3);
        // Левая половина белая, правая черная
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const i = (y * 3 + x) * 4;
                const value = x < 1 ? 255 : 0;
                imageData.data[i] = value;     // R
                imageData.data[i + 1] = value; // G
                imageData.data[i + 2] = value; // B
                imageData.data[i + 3] = 255;   // A
            }
        }

        const result = applyKernel(imageData, KERNELS.gaussian);

        // После размытия значения должны быть между 0 и 255
        for (let i = 0; i < result.data.length; i += 4) {
            expect(result.data[i]).toBeGreaterThanOrEqual(0);
            expect(result.data[i]).toBeLessThanOrEqual(255);
        }
    });
}); 