// Мок для ImageData
export class ImageDataMock {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(width: number, height: number);
    constructor(data: Uint8ClampedArray, width: number, height: number);
    constructor(arg1: number | Uint8ClampedArray, arg2: number, arg3?: number) {
        if (typeof arg1 === 'number') {
            this.width = arg1;
            this.height = arg2;
            this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
            this.data = arg1;
            this.width = arg2;
            this.height = arg3!;
        }
    }
}

// Переопределяем глобальный ImageData
(global as any).ImageData = ImageDataMock; 