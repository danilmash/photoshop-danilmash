// Функция для сохранения в формате GB7
export async function saveAsGB7(imageData: ImageData, filename: string): Promise<void> {
    const width = imageData.width;
    const height = imageData.height;
    const pixelCount = width * height;
    
    // Создаем буфер для файла GB7
    const buffer = new ArrayBuffer(12 + pixelCount); // 12 байт метаданных + пиксели
    const view = new DataView(buffer);
    
    // Проверяем, есть ли прозрачность в изображении
    let hasTransparency = false;
    for (let i = 0; i < pixelCount; i++) {
        if (imageData.data[i * 4 + 3] < 128) { // Если альфа меньше 128, считаем пиксель прозрачным
            hasTransparency = true;
            break;
        }
    }
    
    // Записываем сигнатуру GB7
    view.setUint8(0, 0x47); // 'G'
    view.setUint8(1, 0x42); // 'B'
    view.setUint8(2, 0x37); // '7'
    view.setUint8(3, 0x1d); // Версия формата
    
    // Записываем метаданные
    view.setUint8(4, 1); // Версия
    view.setUint8(5, hasTransparency ? 1 : 0); // Флаги (1 - есть маска, 0 - нет маски)
    view.setUint16(6, width, false); // Ширина
    view.setUint16(8, height, false); // Высота
    view.setUint8(10, 0); // Зарезервированный байт
    view.setUint8(11, 0); // Зарезервированный байт
    
    // Конвертируем и записываем пиксели
    for (let i = 0; i < pixelCount; i++) {
        const r = imageData.data[i * 4];
        const g = imageData.data[i * 4 + 1];
        const b = imageData.data[i * 4 + 2];
        const a = imageData.data[i * 4 + 3];
        
        const gray = Math.round((r + g + b) / 3); // Преобразуем в оттенки серого
        const gb7Value = Math.round((gray * 127) / 255); // Преобразуем в диапазон 0-127
        
        // Если есть прозрачность, используем бит маски
        if (hasTransparency) {
            const maskBit = a >= 128 ? 0x80 : 0; // Устанавливаем бит маски в зависимости от прозрачности
            view.setUint8(12 + i, gb7Value | maskBit);
        } else {
            view.setUint8(12 + i, gb7Value); // Без маски просто записываем значение
        }
    }
    
    // Создаем Blob и сохраняем файл
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.gb7`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Функция для сохранения в формате PNG
export async function saveAsPNG(imageData: ImageData, filename: string): Promise<void> {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d', { alpha: true }); // Явно указываем поддержку альфа-канала
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // Очищаем канвас с полной прозрачностью
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Помещаем изображение на канвас, сохраняя прозрачность
    ctx.putImageData(imageData, 0, 0);
    
    const blob = await canvas.convertToBlob({ 
        type: 'image/png',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Функция для сохранения в формате JPEG
export async function saveAsJPEG(imageData: ImageData, filename: string, quality: number = 0.92): Promise<void> {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // Создаем новый ImageData с белым фоном вместо прозрачности
    const newImageData = new ImageData(imageData.width, imageData.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const alpha = imageData.data[i + 3] / 255; // Нормализуем альфа канал до 0-1
        
        // Смешиваем цвет с белым фоном на основе прозрачности
        newImageData.data[i] = Math.round(imageData.data[i] * alpha + 255 * (1 - alpha)); // R
        newImageData.data[i + 1] = Math.round(imageData.data[i + 1] * alpha + 255 * (1 - alpha)); // G
        newImageData.data[i + 2] = Math.round(imageData.data[i + 2] * alpha + 255 * (1 - alpha)); // B
        newImageData.data[i + 3] = 255; // Полная непрозрачность
    }
    
    ctx.putImageData(newImageData, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
} 