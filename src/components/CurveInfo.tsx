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
import { Point, generateLUT, applyLUT } from "../utils/curves";
import { bilinearInterpolation } from "../utils/interpolation";

const GRAPH_WIDTH = 255;
const GRAPH_HEIGHT = 255;
const PREVIEW_SIZE = 150;
const GRID_STEP = 51; // Чтобы получить деления 0, 51, 102, 153, 204, 255

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
            // Если у слоя нет сохраненного оригинала, считаем текущие данные оригиналом
            if (!activeLayer.originalImageData) {
                updateLayer(activeLayer.id, {
                    originalImageData: new ImageData(
                        new Uint8ClampedArray(activeLayer.imageData.data),
                        activeLayer.imageData.width,
                        activeLayer.imageData.height
                    )
                });
            }

            // Используем оригинальные данные для гистограммы
            const histData = calculateHistograms(activeLayer.originalImageData || activeLayer.imageData);
            setHistograms(histData);

            // Сохраняем копию оригинала для превью
            originalImageData.current = new ImageData(
                new Uint8ClampedArray(activeLayer.originalImageData?.data || activeLayer.imageData.data),
                activeLayer.originalImageData?.width || activeLayer.imageData.width,
                activeLayer.originalImageData?.height || activeLayer.imageData.height
            );

            // Если есть сохраненные точки в слое, восстанавливаем их
            if (activeLayer.curvePoints) {
                setPoint1(activeLayer.curvePoints.point1);
                setPoint2(activeLayer.curvePoints.point2);
            }
        }
    }, [activeLayer?.imageData]);

    // Обновляем превью и гистограммы при изменении точек
    useEffect(() => {
        const updatePreviewAndHistograms = async () => {
            const canvas = previewCanvasRef.current;
            if (!canvas || !originalImageData.current) {
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
            
            // Пересчитываем гистограммы для измененного изображения
            const newHistograms = calculateHistograms(newImageData);
            setHistograms(newHistograms);

            if (!showPreview) {
                ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
                return;
            }

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

        updatePreviewAndHistograms();
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
        if (activeLayer?.id && originalImageData.current) {
            const lut = generateLUT(point1, point2);

            // Применяем LUT к оригинальному изображению
            const newBaseImageData = applyLUT(originalImageData.current, lut);
            
            // Если текущий масштаб не 100%, применяем масштабирование
            let finalImageData = newBaseImageData;
            let finalWidth = newBaseImageData.width;
            let finalHeight = newBaseImageData.height;
            
            if (activeLayer.scale !== 100) {
                const scaledWidth = Math.floor((newBaseImageData.width * activeLayer.scale) / 100);
                const scaledHeight = Math.floor((newBaseImageData.height * activeLayer.scale) / 100);
                
                const scaledPixelArray = await bilinearInterpolation(
                    {
                        data: newBaseImageData.data,
                        width: newBaseImageData.width,
                        height: newBaseImageData.height,
                    },
                    scaledWidth,
                    scaledHeight
                );
                
                finalImageData = new ImageData(
                    scaledPixelArray.data,
                    scaledPixelArray.width,
                    scaledPixelArray.height
                );
                finalWidth = scaledWidth;
                finalHeight = scaledHeight;
            }

            const newImageBitmap = await createImageBitmap(finalImageData);

            // Сохраняем точки и обновляем слой
            updateLayer(activeLayer.id, {
                imageData: finalImageData,
                imageBitmap: newImageBitmap,
                width: finalWidth,
                height: finalHeight,
                curvePoints: { point1, point2 }
            });
        }
    };

    const handleReset = () => {
        if (activeLayer?.id && activeLayer.originalImageData) {
            setPoint1({ x: 0, y: 0 });
            setPoint2({ x: 255, y: 255 });

            // Возвращаем оригинальное изображение
            createImageBitmap(activeLayer.originalImageData).then(imageBitmap => {
                updateLayer(activeLayer.id, {
                    imageData: new ImageData(
                        new Uint8ClampedArray(activeLayer.originalImageData!.data),
                        activeLayer.originalImageData!.width,
                        activeLayer.originalImageData!.height
                    ),
                    imageBitmap,
                    curvePoints: null
                });
            });
        }
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