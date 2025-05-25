import { CanvasImageData } from "../types/interfaces";
import getColorDepth from "./getColorDepth";

async function loadImageFromFile(file: File): Promise<CanvasImageData> {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const colorDepth = await getColorDepth(file);
    const format = file.type.replace("image/", "").toUpperCase();

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context не найден");

    ctx.drawImage(imageBitmap, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return {
        imageData,
        source: file,
        width: canvas.width,
        height: canvas.height,
        colorDepth: colorDepth,
        format: format,
    };
}

export default loadImageFromFile;
