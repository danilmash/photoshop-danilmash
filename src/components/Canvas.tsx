import { Box } from "@mui/material";
import { useCanvasElement } from "../contexts/CanvasElementContext";

function Canvas() {
    const { canvasRef } = useCanvasElement();

    return (
        <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
        </Box>
    );
}

export default Canvas;
