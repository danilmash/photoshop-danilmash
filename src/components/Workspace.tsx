import { Box } from "@mui/material";
import { useRef, useState } from "react";
import Canvas from "./Canvas";
import React from "react";
import Toolbar from "./Toolbar";
import ColorInfoPanel from "./ColorInfoPanel";
import LayerPanel from "./LayerPanel";

function Workspace() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [leftWidth, setLeftWidth] = useState(
        Number(localStorage.getItem("left_panel_width")) || 300
    );
    const [rightWidth, setRightWidth] = useState(
        Number(localStorage.getItem("right_panel_width")) || 300
    );

    const isLeftResizing = useRef(false);
    const isRightResizing = useRef(false);

    const handleLeftMouseDown = (e: React.MouseEvent) => {
        isLeftResizing.current = true;
        window.addEventListener("mousemove", handleLeftMouseMove);
        window.addEventListener("mouseup", handleLeftMouseUp);
        e.preventDefault();
    };

    const handleRightMouseDown = (e: React.MouseEvent) => {
        isRightResizing.current = true;
        window.addEventListener("mousemove", handleRightMouseMove);
        window.addEventListener("mouseup", handleRightMouseUp);
        e.preventDefault();
    };

    const handleLeftMouseMove = (e: MouseEvent) => {
        if (!isLeftResizing.current || !containerRef.current) return;
        const containerLeft = containerRef.current.getBoundingClientRect().left;
        const newWidth = e.clientX - containerLeft;
        if (newWidth >= 200 && newWidth <= 600) {
            localStorage.setItem("left_panel_width", newWidth.toString());
            setLeftWidth(newWidth);
        }
    };

    const handleRightMouseMove = (e: MouseEvent) => {
        if (!isRightResizing.current || !containerRef.current) return;
        const containerRight = containerRef.current.getBoundingClientRect().right;
        const newWidth = containerRight - e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
            localStorage.setItem("right_panel_width", newWidth.toString());
            setRightWidth(newWidth);
        }
    };

    const handleLeftMouseUp = () => {
        isLeftResizing.current = false;
        window.removeEventListener("mousemove", handleLeftMouseMove);
        window.removeEventListener("mouseup", handleLeftMouseUp);
    };

    const handleRightMouseUp = () => {
        isRightResizing.current = false;
        window.removeEventListener("mousemove", handleRightMouseMove);
        window.removeEventListener("mouseup", handleRightMouseUp);
    };

    return (
        <Box
            ref={containerRef}
            sx={{ height: "100%", display: "flex", position: "relative" }}
        >
            {/* Левая панель */}
            <Box
                sx={{
                    width: `${leftWidth}px`,
                    backgroundColor: "#f0f0f0",
                    height: "100%",
                    overflow: "auto",
                    padding: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <Toolbar />
                <ColorInfoPanel />
            </Box>

            {/* Левая ручка ресайза */}
            <Box
                onMouseDown={handleLeftMouseDown}
                sx={{
                    width: "5px",
                    cursor: "col-resize",
                    backgroundColor: "#ccc",
                    zIndex: 10,
                }}
            />

            {/* Центральная панель с канвасом */}
            <Box
                sx={{
                    height: "100%",
                    width: `calc(100% - ${leftWidth + rightWidth + 10}px)`, // 10px для двух ручек ресайза
                }}
            >
                <Canvas />
            </Box>

            {/* Правая ручка ресайза */}
            <Box
                onMouseDown={handleRightMouseDown}
                sx={{
                    width: "5px",
                    cursor: "col-resize",
                    backgroundColor: "#ccc",
                    zIndex: 10,
                }}
            />

            {/* Правая панель со слоями */}
            <Box
                sx={{
                    width: `${rightWidth}px`,
                    height: "100%",
                }}
            >
                <LayerPanel />
            </Box>
        </Box>
    );
}

export default Workspace;
