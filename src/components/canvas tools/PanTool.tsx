import { useCanvasElement } from "../../contexts/CanvasElementContext";
import { useImageData } from "../../contexts/ImageDataContext";
import { useTools } from "../../contexts/ToolsContext";
import PanToolIcon from "@mui/icons-material/PanTool";
import IconButton from "@mui/material/IconButton";
import { clamp } from "../../utils/helpers";
import { Tooltip } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { alpha } from "@mui/material";

function PanTool() {
    const { canvasRef, offsetX, offsetY, render } = useCanvasElement();
    const { image } = useImageData();
    const { activeTool, setActiveTool } = useTools();
    const [lastMouseX, setLastMouseX] = useState(0);
    const [lastMouseY, setLastMouseY] = useState(0);
    const [lastOffsetX, setLastOffsetX] = useState(offsetX.current);
    const [lastOffsetY, setLastOffsetY] = useState(offsetY.current);
    const [isDragging, setIsDragging] = useState(false);
    const maxOffsetX = useRef(0);
    const maxOffsetY = useRef(0);
    const handleMouseDown = (event: MouseEvent) => {
        if (activeTool !== "pan") return;
        setLastMouseX(event.clientX);
        setLastMouseY(event.clientY);
        setIsDragging(true);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setLastOffsetX(offsetX.current);
        setLastOffsetY(offsetY.current);
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (activeTool !== "pan" || !isDragging) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const x = event.clientX;
        const y = event.clientY;

        const deltaX = x - lastMouseX;
        const deltaY = y - lastMouseY;

        updateMaxOffset();
        offsetX.current = clamp(
            lastOffsetX + deltaX,
            -maxOffsetX.current,
            maxOffsetX.current
        );
        offsetY.current = clamp(
            lastOffsetY + deltaY,
            -maxOffsetY.current,
            maxOffsetY.current
        );

        render();
    };

    function updateMaxOffset() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        maxOffsetX.current = canvas.width / 2;
        maxOffsetY.current = canvas.height / 2;

        if (image.width > canvas.width) {
            maxOffsetX.current = image.width / 2;
        }
        if (image.height > canvas.height) {
            maxOffsetY.current = image.height / 2;
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousemove", handleMouseMove);
        };
    }, [isDragging, activeTool]);

    useEffect(() => {
        updateMaxOffset();
        const currentOffsetX = offsetX.current;
        const currentOffsetY = offsetY.current;
        
        offsetX.current = clamp(
            currentOffsetX,
            -maxOffsetX.current,
            maxOffsetX.current
        );
        offsetY.current = clamp(
            currentOffsetY,
            -maxOffsetY.current,
            maxOffsetY.current
        );
        
        if (offsetX.current !== currentOffsetX) {
            setLastOffsetX(offsetX.current);
        }
        if (offsetY.current !== currentOffsetY) {
            setLastOffsetY(offsetY.current);
        }
        
        render();
    }, [image, canvasRef]);

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
                        if (activeTool === "pan") {
                            return alpha(theme.palette.primary.main, 0.3);
                        }
                        return "transparent";
                    },

                    "&:hover": {
                        backgroundColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.3),
                    },
                }}
                onClick={() => setActiveTool("pan")}
            >
                <PanToolIcon
                    sx={{
                        width: "30px",
                        height: "30px",
                    }}
                />
            </IconButton>
        </Tooltip>
    );
}

export default PanTool;
