import { GB7Data } from "../types/interfaces";

export function isGB7Format(buffer: ArrayBuffer): boolean {
    const view = new Uint8Array(buffer);
    // Проверка первых 4 байтов на соответствие сигнатуре GB7
    const magicNumber = [0x47, 0x42, 0x37, 0x1d]; // Сигнатура GB7
    for (let i = 0; i < magicNumber.length; i++) {
        if (view[i] !== magicNumber[i]) {
            return false;
        }
    }
    return true;
}

function convertGB7PixelToRGBA(
    byte: number,
    maskFlag: boolean
): [number, number, number, number] {
    const maskBit = (0b10000000 & byte) >> 7; // Маска (0 - пиксель замаскирован, 1 - пиксель не замаскирован)
    const grayBit = 0b01111111 & byte;

    const grayScale = Math.floor((grayBit * 255) / 127); // Преобразование в диапазон 0-255
    let alpha = 255;
    if (maskFlag) {
        alpha = maskBit ? 255 : 0; // Если маска, то альфа-канал
    }

    return [grayScale, grayScale, grayScale, alpha]; // Возвращаем цвет в формате RGBA
}

export function parseGB7(buffer: ArrayBuffer): GB7Data {
    const view = new DataView(buffer);
    const version = view.getUint8(4); // Байт версии
    const flagByte = view.getUint8(5); // Байт флагов
    const maskFlag = (flagByte & 0b00000001) !== 0; // Маска
    const width = view.getUint16(6, false); // Ширина
    const height = view.getUint16(8, false); // Высота
    // const reservedByte1 = view.getUint8(10); // Зарезервированный байт 0 // Не используется
    // const reservedByte2 = view.getUint8(11); // Зарезервированный байт 1 // Не используется
    const colorDepth = maskFlag ? 8 : 7; // Глубина цвета

    const pixelCount = width * height; // Количество байт пикселей после метаданных
    const imageData = new ImageData(width, height); // Создаем объект ImageData
    for (let i = 0; i < pixelCount; i++) {
        const byteIndex = 12 + i;
        const byte = view.getUint8(byteIndex);
        const [r, g, b, a] = convertGB7PixelToRGBA(byte, maskFlag);
        const pixelIndex = i * 4; // Индекс пикселя в ImageData
        imageData.data[pixelIndex] = r; // Красный
        imageData.data[pixelIndex + 1] = g; // Зеленый
        imageData.data[pixelIndex + 2] = b; // Синий
        imageData.data[pixelIndex + 3] = a; // Альфа
    }

    return {
        width,
        height,
        colorDepth,
        version,
        imageData,
    };
}
