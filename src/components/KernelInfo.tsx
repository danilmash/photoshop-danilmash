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
    Select,
    MenuItem,
} from "@mui/material";
import { useLayers } from "../contexts/LayersContext";
import { useTools } from "../contexts/ToolsContext";
import { KERNELS, applyKernel } from "../utils/kernels";
import { bilinearInterpolation } from "../utils/interpolation";

const PreviewCanvas = styled('canvas')({
    border: '1px solid #ccc',
    borderRadius: '4px',
});

const PREVIEW_SIZE = 150;

type KernelName = keyof typeof KERNELS;

export default function KernelInfo() {
    const { layers, activeLayerId, updateLayer } = useLayers();
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    const { activeTool } = useTools();

    const [selectedKernel, setSelectedKernel] = useState<KernelName>("identity");
    const [kernelValues, setKernelValues] = useState<number[][]>(KERNELS.identity);
    const [showPreview, setShowPreview] = useState(false);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageData = useRef<ImageData | null>(null);

    // Сохраняем оригинальное изображение при изменении активного слоя
    useEffect(() => {
        if (activeLayer?.imageData) {
            if (!activeLayer.originalImageData) {
                updateLayer(activeLayer.id, {
                    originalImageData: new ImageData(
                        new Uint8ClampedArray(activeLayer.imageData.data),
                        activeLayer.imageData.width,
                        activeLayer.imageData.height
                    )
                });
            }

            originalImageData.current = new ImageData(
                new Uint8ClampedArray(activeLayer.originalImageData?.data || activeLayer.imageData.data),
                activeLayer.originalImageData?.width || activeLayer.imageData.width,
                activeLayer.originalImageData?.height || activeLayer.imageData.height
            );
        }
    }, [activeLayer?.imageData]);

    // Обновляем превью при изменении ядра
    useEffect(() => {
        const updatePreview = async () => {
            const canvas = previewCanvasRef.current;
            if (!canvas || !originalImageData.current || !showPreview) {
                const ctx = canvas?.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
                }
                return;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const newImageData = applyKernel(originalImageData.current, kernelValues);
            
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
    }, [kernelValues, showPreview]);

    const handleKernelChange = (event: any) => {
        const newKernel = event.target.value as KernelName;
        setSelectedKernel(newKernel);
        setKernelValues(KERNELS[newKernel]);
    };

    const handleValueChange = (rowIndex: number, colIndex: number, value: string) => {
        const newValue = parseFloat(value) || 0;
        const newKernelValues = kernelValues.map((row, i) =>
            i === rowIndex
                ? row.map((col, j) => (j === colIndex ? newValue : col))
                : row
        );
        setKernelValues(newKernelValues);
    };

    const handleApply = async () => {
        if (activeLayer?.id && originalImageData.current) {
            const newImageData = applyKernel(originalImageData.current, kernelValues);
            
            // Если текущий масштаб не 100%, применяем масштабирование
            let finalImageData = newImageData;
            let finalWidth = newImageData.width;
            let finalHeight = newImageData.height;
            
            if (activeLayer.scale !== 100) {
                const scaledWidth = Math.floor((newImageData.width * activeLayer.scale) / 100);
                const scaledHeight = Math.floor((newImageData.height * activeLayer.scale) / 100);
                
                const scaledPixelArray = await bilinearInterpolation(
                    {
                        data: newImageData.data,
                        width: newImageData.width,
                        height: newImageData.height,
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

            updateLayer(activeLayer.id, {
                imageData: finalImageData,
                imageBitmap: newImageBitmap,
                width: finalWidth,
                height: finalHeight,
                kernelValues: kernelValues
            });
        }
    };

    const handleReset = async () => {
        // Сбрасываем локальное состояние
        setSelectedKernel("identity");
        setKernelValues(KERNELS.identity);
        
        // Сбрасываем состояние слоя
        if (activeLayer?.id && originalImageData.current) {
            let finalImageData = originalImageData.current;
            let finalWidth = originalImageData.current.width;
            let finalHeight = originalImageData.current.height;
            
            // Если текущий масштаб не 100%, применяем масштабирование
            if (activeLayer.scale !== 100) {
                const scaledWidth = Math.floor((originalImageData.current.width * activeLayer.scale) / 100);
                const scaledHeight = Math.floor((originalImageData.current.height * activeLayer.scale) / 100);
                
                const scaledPixelArray = await bilinearInterpolation(
                    {
                        data: originalImageData.current.data,
                        width: originalImageData.current.width,
                        height: originalImageData.current.height,
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

            updateLayer(activeLayer.id, {
                imageData: finalImageData,
                imageBitmap: newImageBitmap,
                width: finalWidth,
                height: finalHeight,
                kernelValues: undefined // Используем undefined вместо null
            });
        }
    };

    if (activeTool !== "kernel") {
        console.log(activeTool)
        return null;
    }

    return (
        <Paper elevation={3} sx={{ 
            width: "100%", 
            borderRadius: "12px", 
            p: 2,
            overflow: "auto"
        }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Фильтр</Typography>
            
            <Box sx={{ mb: 2 }}>
                <Select
                    value={selectedKernel}
                    onChange={handleKernelChange}
                    fullWidth
                    size="small"
                >
                    <MenuItem value="identity">Тождественное отображение</MenuItem>
                    <MenuItem value="sharpen">Повышение резкости</MenuItem>
                    <MenuItem value="gaussian">Фильтр Гаусса</MenuItem>
                    <MenuItem value="boxBlur">Прямоугольное размытие</MenuItem>
                    <MenuItem value="prewittHorizontal">Оператор Прюитта (горизонтальный)</MenuItem>
                    <MenuItem value="prewittVertical">Оператор Прюитта (вертикальный)</MenuItem>
                </Select>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {kernelValues.map((row, i) => (
                    <Box key={`row-${i}`} sx={{ display: 'flex', gap: 1 }}>
                        {row.map((value, j) => (
                            <TextField
                                key={`${i}-${j}`}
                                value={value}
                                onChange={(e) => handleValueChange(i, j, e.target.value)}
                                size="small"
                                type="number"
                                inputProps={{ 
                                    step: "0.1",
                                    style: { textAlign: 'center' }
                                }}
                                sx={{ 
                                    width: '33%',
                                    '& input': {
                                        padding: '8px 4px'
                                    }
                                }}
                            />
                        ))}
                    </Box>
                ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
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