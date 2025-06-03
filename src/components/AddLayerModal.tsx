import { useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Tab,
    Tabs,
    styled,
} from "@mui/material";
import { useLayers } from "../contexts/LayersContext";
import ImageUploader from "./ImageUploader";
import { ChromePicker } from "react-color";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`layer-tabpanel-${index}`}
            aria-labelledby={`layer-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `layer-tab-${index}`,
        "aria-controls": `layer-tabpanel-${index}`,
    };
}

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.contrastText,
    "&:hover": {
        borderColor: theme.palette.primary.contrastText,
    },
}));

function AddLayerModal() {
    const [open, setOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [color, setColor] = useState({ r: 255, g: 255, b: 255, a: 1 });
    const { addLayer, layers } = useLayers();

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number
    ) => {
        setTabValue(newValue);
    };

    const handleColorChange = (color: any) => {
        setColor(color.rgb);
    };

    const createColorLayer = async () => {
        // Создаем канвас для цветного слоя
        const canvas = new OffscreenCanvas(800, 600); // Базовый размер
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Заполняем канвас выбранным цветом
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Получаем ImageData и ImageBitmap
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const imageBitmap = canvas.transferToImageBitmap();

        // Добавляем новый слой
        addLayer({
            id: Date.now().toString(),
            name: `Цветной слой`,
            visible: true,
            opacity: 1,
            blendMode: "source-over",
            imageData: imageData,
            imageBitmap: imageBitmap,
            baseImageData: imageData,
            baseImageBitmap: imageBitmap,
            originalImageData: imageData,
            width: canvas.width,
            height: canvas.height,
            scale: 100,
            infoPanel: {
                colorDepth: 32,
                format: "RGB",
                source: null,
                width: canvas.width,
                height: canvas.height,
            },
            curvePoints: {
                point1: { x: 0, y: 0 },
                point2: { x: 255, y: 255 },
            },
            kernelValues: null
        });

        handleClose();
    };

    return (
        <>
            <StyledButton
                variant="contained"
                onClick={handleOpen}
                disabled={layers.length >= 2}
            >
                Добавить слой
            </StyledButton>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить новый слой</DialogTitle>
                <DialogContent>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="layer creation options"
                        >
                            <Tab label="Изображение" {...a11yProps(0)} />
                            <Tab label="Цветной слой" {...a11yProps(1)} />
                        </Tabs>
                    </Box>
                    <TabPanel value={tabValue} index={0}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <ImageUploader
                                buttonType="contained"
                                onLoad={handleClose}
                            />
                        </Box>
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <ChromePicker
                                color={color}
                                onChange={handleColorChange}
                                disableAlpha={false}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={createColorLayer}
                                sx={{ mt: 2 }}
                            >
                                Создать слой
                            </Button>
                        </Box>
                    </TabPanel>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AddLayerModal;
