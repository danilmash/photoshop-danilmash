import { isGB7Format } from "./GB7Parser";

async function getColorDepth(file: File): Promise<number> {
    if (await isGB7Format(file)) {
        // Если файл в формате GB7, возвращаем 7 или 8 бит в зависимости от наличия маски
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        const flagByte = view.getUint8(5); // Байт флагов
        const maskFlag = (flagByte & 0b00000001) !== 0; // Проверяем наличие маски
        return maskFlag ? 8 : 7;
    }

    if (file.type === "image/png") {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const bitDepth = bytes[24]; // 25-й байт в PNG - это битовая глубина
        return bitDepth;
    }

    if (file.type === "image/jpeg" || file.type === "image/jpg") {
        // JPEG обычно имеет 24 бита (8 бит на канал RGB)
        return 24;
    }

    throw new Error(
        "Неподдерживаемый формат изображения для определения глубины цвета"
    );
}

export default getColorDepth;
