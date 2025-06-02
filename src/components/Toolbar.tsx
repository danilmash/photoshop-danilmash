import { useTools } from "../contexts/ToolsContext";
import { useCanvasElement } from "../contexts/CanvasElementContext";
import { useEffect } from "react";
import { useImageData } from "../contexts/ImageDataContext";
import { Box, Paper, Typography } from "@mui/material";
import PanTool from "./canvas tools/PanTool";
import EyedropperTool from "./canvas tools/EyedropperTool";
import CurveTool from "./canvas tools/CurveTool";
import CurveInfo from "./CurveInfo";

function Toolbar() {
    const { activeTool, setActiveTool } = useTools();
    const { canvasRef } = useCanvasElement();
    const { image } = useImageData();

    function resetCursor() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.style.cursor = "auto";
        canvas.onmousedown = null;
        canvas.onmouseup = null;
    }

    function setCursor() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (activeTool === "pan") {
            canvas.style.cursor = "grab";
            canvas.onmousedown = () => {
                canvas.style.cursor = "grabbing";
            };
            canvas.onmouseup = () => {
                canvas.style.cursor = "grab";
            };
            return;
        }
        if (activeTool === "eyedropper") {
            canvas.style.cursor = "crosshair";
            return;
        }
    }

    useEffect(() => {
        if (!image.imageBitmap) return;
        setActiveTool(activeTool || "pan");
        setCursor();
    }, [image]);

    useEffect(() => {
        if (!image.imageBitmap) return;
        resetCursor();
        setCursor();
    }, [activeTool]);

    if (!image.imageBitmap) {
        return (
            <Paper
                elevation={3}
                sx={{
                    padding: 1,
                    width: "100%",
                    borderRadius: "12px",
                }}
            >
                <Typography variant="h6">Загрузите изображение</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper
                elevation={3}
                sx={{
                    padding: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                    borderRadius: "12px",
                }}
            >
                <PanTool />
                <EyedropperTool />
                <CurveTool />
            </Paper>
            
            <CurveInfo />
        </Box>
    );
}

export default Toolbar;
