import { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    TextField,
    Checkbox,
    FormControlLabel,
    Button,
    styled,
    alpha,
    IconButton,
    Tooltip,
} from "@mui/material";
import { useLayers } from "../../contexts/LayersContext";
import { calculateHistograms, histogramToPoints, HistogramData } from "../../utils/histogram";
import { useTools } from "../../contexts/ToolsContext";
import ShowChartIcon from "@mui/icons-material/ShowChart";

const GRAPH_WIDTH = 400;
const GRAPH_HEIGHT = 300;
const GRID_STEP = 50;

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

export default function CurveDialog() {
    const { layers, activeLayerId } = useLayers();
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    const { activeTool } = useTools();
    
    const [histograms, setHistograms] = useState<HistogramData | null>(null);
    const [point1, setPoint1] = useState<Point>({ x: 0, y: 0 });
    const [point2, setPoint2] = useState<Point>({ x: GRAPH_WIDTH, y: GRAPH_HEIGHT });
    const [showPreview, setShowPreview] = useState(true);

    const [curveDialogOpen, setCurveDialogOpen] = useState(false);

    // Обновляем гистограммы при изменении активного слоя
    useEffect(() => {
        if (activeLayer?.imageData) {
            const histData = calculateHistograms(activeLayer.imageData);
            setHistograms(histData);
        }
    }, [activeLayer]);

    function onClose() {
        setCurveDialogOpen(false);
    }

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
        }
        return lines;
    };

    const handleReset = () => {
        setPoint1({ x: 0, y: 0 });
        setPoint2({ x: GRAPH_WIDTH, y: GRAPH_HEIGHT });
    };

    const handleApply = () => {
        // TODO: Применить кривую к изображению
        onClose();
    };

    return (
        <>
        <Tooltip title="Кривые" placement="bottom">
                    <IconButton
                        onClick={() => setCurveDialogOpen(true)}
                        TouchRippleProps={{
                            center: false,
                        }}
                        color="primary"
                        sx={{
                            borderRadius: "12px",
                            backgroundColor: (theme) => {
                                if (activeTool === "eyedropper") {
                                    return alpha(theme.palette.primary.main, 0.3);
                                }
                                return "transparent";
                            },
                            "&:hover": {
                                backgroundColor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.3),
                            },
                        }}
                    >
                        <ShowChartIcon sx={{ width: "30px", height: "30px" }} />
                    </IconButton>
                </Tooltip>
        <Dialog open={curveDialogOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Кривые</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
                    <Box>
                        <StyledSvg
                            width={GRAPH_WIDTH}
                            height={GRAPH_HEIGHT}
                            viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
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

                            {/* Кривая */}
                            <line
                                x1={point1.x}
                                y1={point1.y}
                                x2={point2.x}
                                y2={point2.y}
                                stroke="white"
                                strokeWidth="2"
                            />

                            {/* Точки */}
                            <circle
                                cx={point1.x}
                                cy={point1.y}
                                r="5"
                                fill="white"
                            />
                            <circle
                                cx={point2.x}
                                cy={point2.y}
                                r="5"
                                fill="white"
                            />
                        </StyledSvg>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                            <TextField
                                label="X1"
                                type="number"
                                value={point1.x}
                                onChange={(e) => setPoint1({ ...point1, x: Number(e.target.value) })}
                                size="small"
                            />
                            <TextField
                                label="Y1"
                                type="number"
                                value={point1.y}
                                onChange={(e) => setPoint1({ ...point1, y: Number(e.target.value) })}
                                size="small"
                            />
                        </Box>
                        <Box>
                            <TextField
                                label="X2"
                                type="number"
                                value={point2.x}
                                onChange={(e) => setPoint2({ ...point2, x: Number(e.target.value) })}
                                size="small"
                            />
                            <TextField
                                label="Y2"
                                type="number"
                                value={point2.y}
                                onChange={(e) => setPoint2({ ...point2, y: Number(e.target.value) })}
                                size="small"
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showPreview}
                                    onChange={(e) => setShowPreview(e.target.checked)}
                                />
                            }
                            label="Предпросмотр"
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={handleReset}>Сбросить</Button>
                    <Button onClick={onClose}>Закрыть</Button>
                    <Button variant="contained" onClick={handleApply}>
                        Применить
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
        </>
    );
} 