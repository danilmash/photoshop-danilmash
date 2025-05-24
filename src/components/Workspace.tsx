import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

function Workspace() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [minPercent, setMinPercent] = useState(10); // fallback
    const [maxPercent, setMaxPercent] = useState(20); // fallback

    // Рассчитать процент от пикселей
    useEffect(() => {
        const minPx = 350;
        const maxPx = 600;
        console.log(123);
        const windowresize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const minPercent = (minPx / width) * 100;
                setMinPercent(minPercent);
            }
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const maxPercent = (maxPx / width) * 100;
                setMaxPercent(maxPercent);
            }
        };
        windowresize();
        window.addEventListener("resize", windowresize);

        return () => {
            window.removeEventListener("resize", windowresize);
        };
    }, [window.innerWidth]);

    return (
        <Box ref={containerRef} sx={{ height: "100%" }}>
            <PanelGroup direction="horizontal" style={{ height: "100%" }}>
                <Panel
                    defaultSize={50}
                    minSize={minPercent}
                    maxSize={maxPercent}
                >
                    <Box
                        sx={{
                            backgroundColor: "#f0f0f0",
                            height: "100%",
                            padding: 2,
                        }}
                    >
                        Left Panel
                    </Box>
                </Panel>
                <PanelResizeHandle />
                <Panel defaultSize={50} minSize={20} maxSize={90}>
                    <Box
                        sx={{
                            backgroundColor: "#e0e0e0",
                            height: "100%",
                            padding: 2,
                        }}
                    >
                        Right Panel
                    </Box>
                </Panel>
            </PanelGroup>
        </Box>
    );
}

export default Workspace;
