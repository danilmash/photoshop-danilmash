import { styled } from "@mui/material/styles";
import { Box, Divider, Typography } from "@mui/material";
import { useImageData } from "../contexts/ImageDataContext";
import ImageResizeSlider from "./ImageResizeSlider";

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
    const { image } = useImageData();
    const { width, height, colorDepth, format } = image;
    if (!width || !height || !colorDepth || !format) {
        return (
            <InfoPanelStyle>
                <Typography variant="body1">
                    Нет данных об изображении
                </Typography>
            </InfoPanelStyle>
        );
    }

    return (
        <InfoPanelStyle>
            <Typography variant="body1">
                Размеры: {width} × {height} пикселей
            </Typography>
            <Divider orientation="vertical" flexItem></Divider>
            <Typography variant="body1">
                Глубина цвета: {colorDepth} бит{" "}
            </Typography>
            <Divider orientation="vertical" flexItem></Divider>
            <Typography variant="body1">Формат: {format}</Typography>

            <Box sx={{ marginLeft: "auto" }}>
                <ImageResizeSlider />
            </Box>
        </InfoPanelStyle>
    );
}

export default InfoPanel;
