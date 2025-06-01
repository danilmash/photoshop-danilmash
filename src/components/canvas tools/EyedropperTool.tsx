import { IconButton } from "@mui/material";
import { Tooltip } from "@mui/material";
import { alpha } from "@mui/material";
import ColorizeIcon from "@mui/icons-material/Colorize";
import { useTools } from "../../contexts/ToolsContext";
import { useCanvasElement } from "../../contexts/CanvasElementContext";
import { useImageData } from "../../contexts/ImageDataContext";
import { useEffect } from "react";
function EyedropperTool() {
    const tools = useTools();
    const { canvasRef } = useCanvasElement();
    const { image, baseImage } = useImageData();

    function getColor(coordinates: { x: number; y: number }) {
        if (!image.imageData) return;
        const pixel = image.imageData.data;
        const index =
            (coordinates.y * image.imageData.width + coordinates.x) * 4;
        const r = pixel[index];
        const g = pixel[index + 1];
        const b = pixel[index + 2];
        const a = pixel[index + 3];
        if (a === 0) return { r: 255, g: 255, b: 255, a: 255 };
        return { r, g, b, a };
    }

    function handleMouseDown(event: MouseEvent) {
        if (tools.activeTool !== "eyedropper") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect) return;
        const x = Math.round(
            event.clientX - rect.left - canvas.width / 2 + image.width / 2
        );
        const y = Math.round(
            event.clientY - rect.top - canvas.height / 2 + image.height / 2
        );
        if (x < 0 || x > image.width || y < 0 || y > image.height) return;
        const color = getColor({ x, y });
        if (!color) return;
        const colorType =
            event.ctrlKey || event.shiftKey || event.altKey
                ? "secondary"
                : "primary";
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
    }, [tools.activeTool, image, baseImage]);

    return (
        <Tooltip
            title="Инструмент рука: позволяет перемещать изображение"
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
