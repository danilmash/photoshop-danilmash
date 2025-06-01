// Функции для конвертации между цветовыми пространствами

export function rgbToXYZ(
    r: number,
    g: number,
    b: number
): { x: number; y: number; z: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
    g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
    b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;

    r *= 100;
    g *= 100;
    b *= 100;

    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
    const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

    return { x, y, z };
}

function xyzToLinearRgb(
    x: number,
    y: number,
    z: number
): [number, number, number] {
    x /= 100;
    y /= 100;
    z /= 100;

    const r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const b = x * 0.0557 + y * -0.204 + z * 1.057;

    return [r, g, b];
}

function linearRgbToOklab(
    r: number,
    g: number,
    b: number
): [number, number, number] {
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

    return [L, a, b2];
}

export function oklabToOklch(
    L: number,
    a: number,
    b: number
): { L: number; C: number; h: number } {
    const C = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * (180 / Math.PI);
    if (h < 0) h += 360;
    return { L, C, h };
}

export function xyzToLab(
    x: number,
    y: number,
    z: number
): { L: number; a: number; b: number } {
    const refX = 95.047;
    const refY = 100.0;
    const refZ = 108.883;

    x /= refX;
    y /= refY;
    z /= refZ;

    const epsilon = 0.008856; // δ^3
    const kappa = 903.3; // 29^3 / 3^3

    const f = (t: number): number =>
        t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116;

    const fx = f(x);
    const fy = f(y);
    const fz = f(z);

    // Расчёт координат Lab
    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);

    return { L, a, b };
}

function labToLch(
    L: number,
    a: number,
    b: number
): { L: number; c: number; h: number } {
    const c = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * (180 / Math.PI);
    if (h < 0) {
        h += 360;
    }
    return { L, c, h };
}

export function rgbToLab(
    r: number,
    g: number,
    b: number
): { L: number; a: number; b: number } {
    const { x, y, z } = rgbToXYZ(r, g, b);
    return xyzToLab(x, y, z);
}

export function rgbToLch(
    r: number,
    g: number,
    b: number
): { L: number; c: number; h: number } {
    const { L, a, b: bValue } = rgbToLab(r, g, b);
    return labToLch(L, a, bValue);
}

export function rgbToOklch(
    r: number,
    g: number,
    b: number
): { L: number; C: number; h: number } {
    const { x, y, z } = rgbToXYZ(r, g, b);
    const [lr, lg, lb] = xyzToLinearRgb(x, y, z);
    const [L, a, b_] = linearRgbToOklab(lr, lg, lb);
    return oklabToOklch(L, a, b_);
}

function calculateRelativeLuminance(r: number, g: number, b: number): number {
    const rSRGB = r / 255;
    const gSRGB = g / 255;
    const bSRGB = b / 255;

    const rLinear =
        rSRGB <= 0.03928 ? rSRGB / 12.92 : ((rSRGB + 0.055) / 1.055) ** 2.4;
    const gLinear =
        gSRGB <= 0.03928 ? gSRGB / 12.92 : ((gSRGB + 0.055) / 1.055) ** 2.4;
    const bLinear =
        bSRGB <= 0.03928 ? bSRGB / 12.92 : ((bSRGB + 0.055) / 1.055) ** 2.4;

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

export function calculateContrast(
    primaryColor: { r: number; g: number; b: number },
    secondaryColor: { r: number; g: number; b: number }
): number {
    const luminance1 = calculateRelativeLuminance(
        primaryColor.r,
        primaryColor.g,
        primaryColor.b
    );
    const luminance2 = calculateRelativeLuminance(
        secondaryColor.r,
        secondaryColor.g,
        secondaryColor.b
    );

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
}

export function isContrastSufficient(
    primaryColor: { r: number; g: number; b: number },
    secondaryColor: { r: number; g: number; b: number }
): boolean {
    const contrastRatio = calculateContrast(primaryColor, secondaryColor);
    return contrastRatio >= 4.5; // WCAG 2.0 AA standard
}

export function calculateAPCAContrast(
    textRGB: { r: number; g: number; b: number },
    bgRGB: { r: number; g: number; b: number }
): number {
    const Ntxt = 0.57;
    const Nbg = 0.56;
    const Rtxt = 0.62;
    const Rbg = 0.65;
    const Wscale = 1.14;
    const Woffset = 0.027;
    const Wclamp = 0.1;
    const B_thrsh = 0.022;
    const B_clip = 1.414;

    const tr = textRGB.r / 255;
    const tg = textRGB.g / 255;
    const tb = textRGB.b / 255;
    const br = bgRGB.r / 255;
    const bg = bgRGB.g / 255;
    const bb = bgRGB.b / 255;

    function computeYs(r: number, g: number, b: number, S_trc = 2.4): number {
        return (
            0.2126729 * r ** S_trc +
            0.7151522 * g ** S_trc +
            0.072175 * b ** S_trc
        );
    }

    function soft_clip(Ys: number, B_thrsh = 0.022, B_clip = 1.414): number {
        if (Ys < 0.0) {
            return 0;
        } else if (Ys < B_thrsh) {
            return Ys + (B_thrsh - Ys) ** B_clip;
        } else {
            return Ys;
        }
    }

    const Ys_txt = computeYs(tr, tg, tb);
    const Ys_bg = computeYs(br, bg, bb);
    const Ytxt = soft_clip(Ys_txt, B_thrsh, B_clip);
    const Ybg = soft_clip(Ys_bg, B_thrsh, B_clip);

    const Sapc =
        Ybg > Ytxt
            ? (Ybg ** Nbg - Ytxt ** Ntxt) * Wscale
            : (Ybg ** Rbg - Ytxt ** Rtxt) * Wscale;

    if (Math.abs(Sapc) < Wclamp) {
        return 0;
    } else if (Sapc > 0) {
        return (Sapc - Woffset) * 100;
    } else if (Sapc < 0) {
        return (Sapc + Woffset) * 100;
    }
    return 0;
}

// Информация о цветовых пространствах для отображения в интерфейсе
export const colorSpaceInfo = {
    rgb: {
        name: "RGB (Red, Green, Blue)",
        description:
            "Аддитивная цветовая модель, в которой цвета получаются смешиванием красного, зеленого и синего света.",
        axes: [
            { name: "R", description: "Красный", range: "0-255" },
            { name: "G", description: "Зеленый", range: "0-255" },
            { name: "B", description: "Синий", range: "0-255" },
        ],
    },
    xyz: {
        name: "XYZ",
        description:
            "Базовое цветовое пространство, от которого происходят другие пространства. Моделирует человеческое восприятие цвета.",
        axes: [
            {
                name: "X",
                description: "Смесь кривых отклика колбочек глаза",
                range: "0-0.95047",
            },
            {
                name: "Y",
                description: "Яркость (люминанс)",
                range: "0-1.00000",
            },
            {
                name: "Z",
                description: "Квази-синий стимул",
                range: "0-1.08883",
            },
        ],
    },
    lab: {
        name: "Lab (L*a*b*)",
        description:
            "Перцепционно-равномерное цветовое пространство, где L представляет яркость, а a и b - цветовые оппонентные каналы.",
        axes: [
            { name: "L", description: "Светлота", range: "0-100" },
            {
                name: "a",
                description: "Красно-зеленая ось",
                range: "-128 до +127",
            },
            {
                name: "b",
                description: "Желто-синяя ось",
                range: "-128 до +127",
            },
        ],
    },
    lch: {
        name: "LCH (L*C*h°)",
        description:
            "Цилиндрическая версия Lab, где цвет представлен светлотой, насыщенностью и оттенком.",
        axes: [
            { name: "L", description: "Светлота", range: "0-100" },
            { name: "C", description: "Насыщенность (хрома)", range: "0-150+" },
            { name: "H", description: "Оттенок (в градусах)", range: "0-360°" },
        ],
    },
    oklch: {
        name: "OKLch",
        description:
            "Улучшенная версия LCH с более точной перцепционной равномерностью для дизайна интерфейсов.",
        axes: [
            { name: "L", description: "Светлота", range: "0-1" },
            { name: "C", description: "Насыщенность (хрома)", range: "0-0.4" },
            { name: "h", description: "Оттенок (в градусах)", range: "0-360°" },
        ],
    },
};
