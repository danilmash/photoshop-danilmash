import { styled } from "@mui/material/styles";
import { Box, Divider, Typography } from "@mui/material";
import ImageResizeSlider from "./ImageResizeSlider";
import ImageResizeModal from "./ImageResizeModal";
import { useLayers } from "../contexts/LayersContext";
import { useEffect, useState } from "react";
const InfoPanelStyle = styled(Box)(({ theme }) => ({
    padding: "8px 16px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    height: "48px",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
}));

function InfoPanel() {
    const { activeLayerId, layers } = useLayers();
    const [infoPanelData, setInfoPanelData] = useState(
        layers.find((layer) => layer.id === activeLayerId)?.infoPanel
    );

    useEffect(() => {
        setInfoPanelData(
            layers.find((layer) => layer.id === activeLayerId)?.infoPanel
        );
    }, [activeLayerId, layers]);

    if (!infoPanelData) {
        return (
            <InfoPanelStyle>
                <Typography variant="body1">
                    Выберите слой для отображения информации
                </Typography>
            </InfoPanelStyle>
        );
    }

    return (
        <InfoPanelStyle>
            <Typography variant="body1">
                Размеры: {infoPanelData.width} × {infoPanelData.height} пикселей
            </Typography>
            <Divider orientation="vertical" flexItem></Divider>
            <Typography variant="body1">
                Глубина цвета: {infoPanelData.colorDepth} бит{" "}
            </Typography>
            <Divider orientation="vertical" flexItem></Divider>
            <Typography variant="body1">
                Формат: {infoPanelData.format}
            </Typography>

            <Box sx={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
                <ImageResizeModal
                    buttonColor="contrast"
                    buttonType="outlined"
                />
                <Divider orientation="vertical" flexItem></Divider>
                <ImageResizeSlider />
            </Box>
        </InfoPanelStyle>
    );
}

export default InfoPanel;
