import { styled } from "@mui/material/styles";
import { Box, Divider, Typography } from "@mui/material";
import { ImageProperties } from "../types/interfaces";
const InfoPanelStyle = styled(Box)(({ theme }) => ({
    padding: "4px 16px",
    display: "flex",
    gap: "8px",
    alignItems: "center",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
}));

function InfoPanel(props: { imageProperties: ImageProperties }) {
    const { width, height, colorDepth, format } = props.imageProperties;

    return (
        <InfoPanelStyle>
            <Typography variant="body2">
                Размеры: {width} × {height} пикселей
            </Typography>
            <Divider orientation="vertical" flexItem></Divider>
            <Typography variant="body2">
                Глубина цвета: {colorDepth} бит{" "}
            </Typography>
            <Divider orientation="vertical" flexItem></Divider>
            <Typography variant="body2">Формат: {format}</Typography>
        </InfoPanelStyle>
    );
}

export default InfoPanel;
