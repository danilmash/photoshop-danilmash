import { Box } from "@mui/material";
import { useRef, useState } from "react";
import Canvas from "./Canvas";
import React from "react";
import Toolbar from "./Toolbar";
import ColorInfoPanel from "./ColorInfoPanel";
function Workspace() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [leftWidth, setLeftWidth] = useState(
        Number(localStorage.getItem("left_panel_width")) || 300
    ); // начальная ширина

    const isResizing = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        isResizing.current = true;
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current || !containerRef.current) return;
        const containerLeft = containerRef.current.getBoundingClientRect().left;
        const newWidth = e.clientX - containerLeft;
        // Ограничения по ширине
        if (newWidth >= 200 && newWidth <= 600) {
            localStorage.setItem("left_panel_width", newWidth.toString());
            setLeftWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
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

            {/* Ручка ресайза */}
            <Box
                onMouseDown={handleMouseDown}
                sx={{
                    width: "5px",
                    cursor: "col-resize",
                    backgroundColor: "#ccc",
                    zIndex: 10,
                }}
            />

            {/* Правая панель (остальная часть) */}
            <Box
                sx={{
                    height: "100%",
                    width: `calc(100% - ${leftWidth + 5}px)`, // 5px для ручки ресайза
                }}
            >
                <Canvas />
            </Box>
        </Box>
    );
}

export default Workspace;
