import { IconButton } from "@mui/material";
import { Tooltip } from "@mui/material";
import { alpha } from "@mui/material";
import ColorizeIcon from "@mui/icons-material/Colorize";
import { useTools } from "../../contexts/ToolsContext";
import { useCanvasElement } from "../../contexts/CanvasElementContext";
import { useImageData } from "../../contexts/ImageDataContext";
import { useEffect } from "react";
import { useLayers } from "../../contexts/LayersContext";

function EyedropperTool() {
    const tools = useTools();
    const { canvasRef, offsetX, offsetY } = useCanvasElement();
    const { image, baseImage, scale } = useImageData();
    const { processLayers } = useLayers();

    async function getColor(coordinates: { x: number; y: number }) {
        const { imageData } = await processLayers(baseImage.width, baseImage.height, 100);
        if (!imageData) return;

        const x = Math.max(0, Math.min(coordinates.x, baseImage.width - 1));
        const y = Math.max(0, Math.min(coordinates.y, baseImage.height - 1));

        const index = (y * imageData.width + x) * 4;
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        const a = imageData.data[index + 3];

        if (a === 0) return { r: 255, g: 255, b: 255, a: 255 };
        return { r, g, b, a };
    }

    async function handleMouseDown(event: MouseEvent) {
        if (tools.activeTool !== "eyedropper") return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        
        const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
        const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);

        const canvasCenterX = canvas.width / 2;
        const canvasCenterY = canvas.height / 2;

        const offsetFromCenterX = canvasX - canvasCenterX - offsetX.current;
        const offsetFromCenterY = canvasY - canvasCenterY - offsetY.current;

        const x = Math.round(baseImage.width / 2 + (offsetFromCenterX * 100) / scale);
        const y = Math.round(baseImage.height / 2 + (offsetFromCenterY * 100) / scale);

        if (x < 0 || x >= baseImage.width || y < 0 || y >= baseImage.height) return;

        const color = await getColor({ x, y });
        if (!color) return;

        const colorType = event.ctrlKey || event.shiftKey || event.altKey ? "secondary" : "primary";
        
        if (colorType === "primary") {
            tools.setPrimaryColor(color);
            tools.setPrimaryColorCoordinates({ x, y });
        } else {
            tools.setSecondaryColor(color);
            tools.setSecondaryColorCoordinates({ x, y });
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.addEventListener("mousedown", handleMouseDown);
        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
        };
    }, [tools.activeTool, image]);

    return (
        <Tooltip
            title="Пипетка: клик для выбора основного цвета, Ctrl+клик для дополнительного цвета"
            placement="bottom"
        >
            <IconButton
                TouchRippleProps={{
                    center: false,
                }}
                color="primary"
                sx={{
                    borderRadius: "12px",
                    backgroundColor: (theme) => {
                        if (tools.activeTool === "eyedropper") {
                            return alpha(theme.palette.primary.main, 0.3);
                        }
                        return "transparent";
                    },
                    "&:hover": {
                        backgroundColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.3),
                    },
                }}
                onClick={() => tools.setActiveTool("eyedropper")}
            >
                <ColorizeIcon
                    sx={{
                        width: "30px",
                        height: "30px",
                    }}
                />
            </IconButton>
        </Tooltip>
    );
}

export default EyedropperTool;
