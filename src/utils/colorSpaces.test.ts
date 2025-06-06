// Тесты для функций преобразования цветовых пространств

import { rgbToXYZ, rgbToLab, rgbToLch, rgbToOklch } from "./colorSpaces";
import { describe, it, expect } from "vitest";

const color = { r: 3, g: 123, b: 5 };

describe("Color Space Conversions", () => {
    it("should convert RGB to XYZ correctly", () => {
        const { x, y, z } = rgbToXYZ(color.r, color.g, color.b);
        expect(x).toBeCloseTo(7.1479, 2);
        expect(y).toBeCloseTo(14.196, 2);
        expect(z).toBeCloseTo(2.5069, 2);
    });

    it("should convert RGB to Lab correctly", () => {
        const { L, a, b } = rgbToLab(color.r, color.g, color.b);
        expect(L).toBeCloseTo(44.511, 2);
        expect(a).toBeCloseTo(-49.781, 2);
        expect(b).toBeCloseTo(47.434, 2);
    });

    it("should convert RGB to LCH correctly", () => {
        const { L, c, h } = rgbToLch(color.r, color.g, color.b);
        expect(L).toBeCloseTo(44.511, 2);
        expect(c).toBeCloseTo(68.762, 2);
        expect(h).toBeCloseTo(136.38, 2);
    });

    it("should convert RGB to OKLCH correctly", () => {
        const { L, C, h } = rgbToOklch(color.r, color.g, color.b);
        expect(L).toBeCloseTo(0.5055, 3);
        expect(C).toBeCloseTo(0.1698, 2);
        expect(h).toBeCloseTo(142.63, 1);
    });
});
