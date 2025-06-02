import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiSlider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";
import ZoomIn from "@mui/icons-material/ZoomIn";
import { useCanvasElement } from "../contexts/CanvasElementContext";
import { useLayers } from "../contexts/LayersContext";
import { clamp } from "../utils/helpers";

const Input = styled(MuiInput)(({ theme }) => ({
    color: theme.palette.primary.contrastText,
    width: "50px",

    ":hover:not(.Mui-disabled, .Mui-error):before": {
        borderBottom: `2.5px solid ${theme.palette.primary.contrastText}`,
    },

    ":before": {
        borderBottom: `1px solid ${theme.palette.primary.contrastText}`,
    },
}));

const Slider = styled(MuiSlider)(({ theme }) => ({
    color: theme.palette.primary.contrastText,
    width: "300px",
    "& .MuiSlider-thumb": {
        "&:hover": {
            boxShadow: "0px 0px 0px 8px rgba(255, 255, 255, 0.16)",
        },
    },
}));

export default function ImageResizeSlider() {
    const { canvasRef, offsetX, offsetY } = useCanvasElement();
    const { layers, activeLayerId, scaleLayer } = useLayers();
    const activeLayer = layers.find(layer => layer.id === activeLayerId);
    const canvasWidth = canvasRef.current?.width || 0;
    const canvasHeight = canvasRef.current?.height || 0;
    const maxWidth = canvasWidth - 100; // 100px for padding
    const maxHeight = canvasHeight - 100; // 100px for padding
    const initialResizeDoneRef = React.useRef(false);
    const [value, setValue] = React.useState(100);

    React.useEffect(() => {
        if (activeLayer) {
            setValue(activeLayer.scale || 100);
        }
    }, [activeLayer]);

    React.useEffect(() => {
        console.log(offsetX.current, offsetY.current);
        if (!initialResizeDoneRef.current && activeLayer && canvasWidth > 0) {
            const originalWidth = activeLayer.baseImageData?.width || 0;
            const originalHeight = activeLayer.baseImageData?.height || 0;
            if (originalWidth > 0 && originalHeight > 0) {
                console.log(123)
                offsetX.current = 0;
                offsetY.current = 0;
                const scaleWidth = (maxWidth / originalWidth) * 100;
                const scaleHeight = (maxHeight / originalHeight) * 100;
                const newScale = Math.min(scaleWidth, scaleHeight);
                setValue(Math.floor(clamp(newScale, 12, 300)));
                if (activeLayer.id) {
                    scaleLayer(activeLayer.id, Math.floor(clamp(newScale, 12, 300)));
                }
                initialResizeDoneRef.current = true;
            }
        }
    }, [activeLayer, canvasWidth]);

    const handleSliderChange = (
        _event: Event,
        newValue: number | number[],
        _activeThumb: number
    ) => {
        const scale = typeof newValue === "number" ? newValue : newValue[0];
        setValue(scale);
        if (activeLayer?.id) {
            scaleLayer(activeLayer.id, scale);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const scale = event.target.value === "" ? 0 : Number(event.target.value);
        setValue(scale);
        if (activeLayer?.id) {
            scaleLayer(activeLayer.id, scale);
        }
    };

    const handleBlur = () => {
        const scale = clamp(value, 12, 300);
        setValue(scale);
        if (activeLayer?.id) {
            scaleLayer(activeLayer.id, scale);
        }
    };

    if (!activeLayer) {
        return null;
    }

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 370,
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginLeft: "auto",
            }}
        >
            <ZoomIn />
            <Slider
                step={4}
                min={12}
                max={300}
                value={typeof value === "number" ? value : 0}
                onChange={handleSliderChange}
                aria-labelledby="input-slider"
            />
            <Input
                value={value}
                onChange={handleInputChange}
                onBlur={handleBlur}
                inputProps={{
                    step: 5,
                    min: 12,
                    max: 300,
                    type: "number",
                    "aria-labelledby": "input-slider",
                }}
            />
        </Box>
    );
}
