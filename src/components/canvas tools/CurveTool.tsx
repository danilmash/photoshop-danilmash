import { IconButton, Tooltip, alpha } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useTools } from "../../contexts/ToolsContext";

export default function CurveTool() {
    const { activeTool, setActiveTool } = useTools();

    return (
        <Tooltip
            title="Инструмент кривые: позволяет настроить кривые цветокоррекции"
            placement="bottom"
        >
            <IconButton
                onClick={() => setActiveTool("curve")}
                sx={{
                    borderRadius: "12px",
                    backgroundColor: (theme) => {
                        if (activeTool === "curve") {
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
                <ShowChartIcon
                    sx={{
                        width: "30px",
                        height: "30px",
                    }}
                />
            </IconButton>
        </Tooltip>
    );
} 