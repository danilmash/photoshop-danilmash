import { IconButton, Tooltip } from "@mui/material";
import { Tune } from "@mui/icons-material";
import { useTools } from "../../contexts/ToolsContext";
import { alpha } from "@mui/material";

export default function KernelTool() {
    const { activeTool, setActiveTool } = useTools();

    return (
        <Tooltip title="Фильтр">
            <IconButton
                onClick={() => setActiveTool("kernel")}
                sx={{
                    borderRadius: "12px",
                    backgroundColor: (theme) => {
                        if (activeTool === "kernel") {
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
                
                <Tune  sx={{
                    width: "30px",
                    height: "30px",
                }}/>
            </IconButton>
        </Tooltip>
    );
} 