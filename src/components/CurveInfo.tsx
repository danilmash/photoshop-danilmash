import { useEffect, useState, useRef } from "react";
import {
    Box,
    TextField,
    Checkbox,
    FormControlLabel,
    Button,
    styled,
    Paper,
    Typography,
} from "@mui/material";
import { useLayers } from "../contexts/LayersContext";
import { calculateHistograms, histogramToPoints, HistogramData } from "../utils/histogram";
import { useTools } from "../contexts/ToolsContext";

const GRAPH_WIDTH = 255;
const GRAPH_HEIGHT = 255;
const PREVIEW_SIZE = 150;
const GRID_STEP = 51; // Чтобы получить деления 0, 51, 102, 153, 204, 255

interface Point {
    x: number;
    y: number;
}

const StyledSvg = styled('svg')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
}));

const HistogramPath = styled('polyline')({
    fill: 'none',
    strokeWidth: 1,
});

const PreviewCanvas = styled('canvas')({
    border: '1px solid #ccc',
    borderRadius: '4px',
});

function generateLUT(point1: Point, point2: Point): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256);
    
    // Сортируем точки по x
    const [p1, p2] = point1.x <= point2.x ? [point1, point2] : [point2, point1];
    
    // Заполняем значения до первой точки
    for (let x = 0; x < p1.x; x++) {
        lut[x] = Math.max(0, Math.min(255, p1.y * (x / p1.x)));
    }
    
    // Заполняем значения между точками
    const slope = (p2.y - p1.y) / (p2.x - p1.x);
    for (let x = p1.x; x <= p2.x; x++) {
        lut[x] = Math.max(0, Math.min(255, p1.y + slope * (x - p1.x)));
    }
    
    // Заполняем значения после второй точки
    for (let x = p2.x + 1; x < 256; x++) {
        lut[x] = Math.max(0, Math.min(255, p2.y + (255 - p2.y) * ((x - p2.x) / (255 - p2.x))));
    }
    
    return lut;
}

function applyLUT(imageData: ImageData, lut: Uint8ClampedArray): ImageData {
    const newData = new Uint8ClampedArray(imageData.data.length);
    for (let i = 0; i < imageData.data.length; i += 4) {
        newData[i] = lut[imageData.data[i]];         // R
        newData[i + 1] = lut[imageData.data[i + 1]]; // G
        newData[i + 2] = lut[imageData.data[i + 2]]; // B
        newData[i + 3] = imageData.data[i + 3];      // A
    }
    return new ImageData(newData, imageData.width, imageData.height);
}

export default function CurveInfo() {
    const { layers, activeLayerId, updateLayer } = useLayers();
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    const { activeTool } = useTools();
    
    const [histograms, setHistograms] = useState<HistogramData | null>(null);
    const [point1, setPoint1] = useState<Point>({ x: 0, y: 0 });
    const [point2, setPoint2] = useState<Point>({ x: 255, y: 255 });
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageData = useRef<ImageData | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Обновляем гистограммы и сохраняем оригинальное изображение при изменении активного слоя
    useEffect(() => {
        if (activeLayer?.imageData) {
            const histData = calculateHistograms(activeLayer.imageData);
            setHistograms(histData);
            originalImageData.current = new ImageData(
                new Uint8ClampedArray(activeLayer.imageData.data),
                activeLayer.imageData.width,
                activeLayer.imageData.height
            );
        }
    }, [activeLayer]);

    // Обновляем превью при изменении точек
    useEffect(() => {
        const updatePreview = async () => {
            const canvas = previewCanvasRef.current;
            if (!canvas || !originalImageData.current || !showPreview) {
                // Очищаем превью если предпросмотр выключен
                const ctx = canvas?.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
                }
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const lut = generateLUT(point1, point2);
            const newImageData = applyLUT(originalImageData.current, lut);
            
            // Создаем временный канвас для масштабирования
            const tempCanvas = new OffscreenCanvas(
                originalImageData.current.width,
                originalImageData.current.height
            );
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            // Отрисовываем новое изображение
            tempCtx.putImageData(newImageData, 0, 0);

            // Очищаем превью и отрисовываем масштабированное изображение
            ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
            ctx.drawImage(
                tempCanvas,
                0, 0, originalImageData.current.width, originalImageData.current.height,
                0, 0, PREVIEW_SIZE, PREVIEW_SIZE
            );
        };

        updatePreview();
    }, [point1, point2, showPreview]);

    // Рисуем сетку
    const renderGrid = () => {
        const lines = [];
        // Вертикальные линии
        for (let x = 0; x <= GRAPH_WIDTH; x += GRID_STEP) {
            lines.push(
                <line
                    key={`v${x}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={GRAPH_HEIGHT}
                    stroke="#444"
                    strokeWidth="0.5"
                    strokeDasharray="4,4"
                />
            );
            // Подписи по X
            lines.push(
                <text
                    key={`tx${x}`}
                    x={x}
                    y={GRAPH_HEIGHT + 15}
                    fill="#888"
                    fontSize="10"
                    textAnchor="middle"
                >
                    {x}
                </text>
            );
        }
        // Горизонтальные линии
        for (let y = 0; y <= GRAPH_HEIGHT; y += GRID_STEP) {
            lines.push(
                <line
                    key={`h${y}`}
                    x1={0}
                    y1={y}
                    x2={GRAPH_WIDTH}
                    y2={y}
                    stroke="#444"
                    strokeWidth="0.5"
                    strokeDasharray="4,4"
                />
            );
            // Подписи по Y
            lines.push(
                <text
                    key={`ty${y}`}
                    x={-5}
                    y={GRAPH_HEIGHT - y}
                    fill="#888"
                    fontSize="10"
                    textAnchor="end"
                    alignmentBaseline="middle"
                >
                    {y}
                </text>
            );
        }
        return lines;
    };

    const handleApply = async () => {
        if (activeLayer?.imageData && activeLayer.id && originalImageData.current) {
            const lut = generateLUT(point1, point2);
            const newImageData = applyLUT(originalImageData.current, lut);
            const newImageBitmap = await createImageBitmap(newImageData);
            updateLayer(activeLayer.id, {
                imageData: newImageData,
                imageBitmap: newImageBitmap,
            });
        }
    };

    const handleReset = () => {
        setPoint1({ x: 0, y: 0 });
        setPoint2({ x: 255, y: 255 });
    };

    if (activeTool !== "curve") {
        return null;
    }

    return (
        <Paper elevation={3} sx={{ width: "100%", borderRadius: "12px", p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Кривые</Typography>
            
            <Box>
                <StyledSvg
                    width={GRAPH_WIDTH + 20}
                    height={GRAPH_HEIGHT + 20}
                    viewBox={`-20 -10 ${GRAPH_WIDTH + 40} ${GRAPH_HEIGHT + 30}`}
                >
                    {/* Сетка */}
                    {renderGrid()}

                    {/* Гистограммы */}
                    {histograms && (
                        <>
                            <HistogramPath
                                points={histogramToPoints(histograms.r, GRAPH_WIDTH, GRAPH_HEIGHT)}
                                stroke="red"
                                opacity={0.5}
                            />
                            <HistogramPath
                                points={histogramToPoints(histograms.g, GRAPH_WIDTH, GRAPH_HEIGHT)}
                                stroke="green"
                                opacity={0.5}
                            />
                            <HistogramPath
                                points={histogramToPoints(histograms.b, GRAPH_WIDTH, GRAPH_HEIGHT)}
                                stroke="blue"
                                opacity={0.5}
                            />
                        </>
                    )}

                    {/* Направляющие линии */}
                    <line
                        x1={0}
                        y1={GRAPH_HEIGHT - point1.y}
                        x2={point1.x}
                        y2={GRAPH_HEIGHT - point1.y}
                        stroke="black"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                    />
                    <line
                        x1={point1.x}
                        y1={GRAPH_HEIGHT - point1.y}
                        x2={point1.x}
                        y2={GRAPH_HEIGHT}
                        stroke="black"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                    />
                    <line
                        x1={point2.x}
                        y1={GRAPH_HEIGHT - point2.y}
                        x2={GRAPH_WIDTH}
                        y2={GRAPH_HEIGHT - point2.y}
                        stroke="black"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                    />
                    <line
                        x1={point2.x}
                        y1={GRAPH_HEIGHT - point2.y}
                        x2={point2.x}
                        y2={GRAPH_HEIGHT}
                        stroke="black"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                    />

                    {/* Основная кривая */}
                    <line
                        x1={point1.x}
                        y1={GRAPH_HEIGHT - point1.y}
                        x2={point2.x}
                        y2={GRAPH_HEIGHT - point2.y}
                        stroke="black"
                        strokeWidth="2"
                    />

                    {/* Точки */}
                    <circle
                        cx={point1.x}
                        cy={GRAPH_HEIGHT - point1.y}
                        r="5"
                        fill="white"
                        stroke="black"
                    />
                    <circle
                        cx={point2.x}
                        cy={GRAPH_HEIGHT - point2.y}
                        r="5"
                        fill="white"
                        stroke="black"
                    />
                </StyledSvg>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="X1"
                                type="number"
                                value={point1.x}
                                onChange={(e) => setPoint1({ ...point1, x: Math.max(0, Math.min(255, Number(e.target.value))) })}
                                size="small"
                                inputProps={{ min: 0, max: 255 }}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Y1"
                                type="number"
                                value={point1.y}
                                onChange={(e) => setPoint1({ ...point1, y: Math.max(0, Math.min(255, Number(e.target.value))) })}
                                size="small"
                                inputProps={{ min: 0, max: 255 }}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="X2"
                                type="number"
                                value={point2.x}
                                onChange={(e) => setPoint2({ ...point2, x: Math.max(0, Math.min(255, Number(e.target.value))) })}
                                size="small"
                                inputProps={{ min: 0, max: 255 }}
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Y2"
                                type="number"
                                value={point2.y}
                                onChange={(e) => setPoint2({ ...point2, y: Math.max(0, Math.min(255, Number(e.target.value))) })}
                                size="small"
                                inputProps={{ min: 0, max: 255 }}
                                sx={{ flex: 1 }}
                            />
                        </Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showPreview}
                                    onChange={(e) => setShowPreview(e.target.checked)}
                                />
                            }
                            label="Показать предпросмотр"
                        />
                    </Box>
                </Box>

                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 1,
                    opacity: showPreview ? 1 : 0.3,
                    transition: 'opacity 0.2s'
                }}>
                    <Typography variant="subtitle2">Предпросмотр</Typography>
                    <PreviewCanvas
                        ref={previewCanvasRef}
                        width={PREVIEW_SIZE}
                        height={PREVIEW_SIZE}
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={handleReset} variant="outlined">
                    Сбросить
                </Button>
                <Button onClick={handleApply} variant="contained" color="primary">
                    Применить
                </Button>
            </Box>
        </Paper>
    );
} 