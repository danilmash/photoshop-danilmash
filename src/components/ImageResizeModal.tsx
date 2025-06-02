import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    styled,
    TextField,
    Checkbox,
    InputLabel,
    FormControlLabel,
    FormControl,
    Tooltip,
} from "@mui/material";
import {
    nearestNeighborInterpolation,
    bilinearInterpolation,
} from "../utils/interpolation";

import { useImageData } from "../contexts/ImageDataContext";
import { useLayers } from "../contexts/LayersContext";
import type { SelectChangeEvent } from "@mui/material";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import ClearIcon from "@mui/icons-material/Clear";
import { clamp } from "../utils/helpers";
import { PixelArray } from "../types/interfaces";

function ImageResizeModal(props: {
    buttonType: "contained" | "outlined";
    buttonColor: "primary" | "contrast";
}) {
    const bilinearInterpolationTooltipText =
        "Билинейная интерполяция использует взвешенное среднее значение ближайших пикселей для создания нового пикселя. Это обеспечивает более плавное изображение, но может привести к размытию.";
    const nearestInterpolationTooltipText =
        'Интерполяция ближайшего соседа выбирает ближайший пиксель без учета других. Это обеспечивает резкость, но может привести к "ступенчатости" на краях.';

    const [tooltipText, setTooltipText] = useState(
        bilinearInterpolationTooltipText
    );
    const StyledButton = styled(Button)(({ theme }) => ({
        color:
            props.buttonColor === "contrast"
                ? theme.palette.primary.contrastText
                : undefined,
        borderColor:
            props.buttonColor === "contrast"
                ? theme.palette.primary.contrastText
                : undefined,
        "&:hover": {
            borderColor:
                props.buttonColor === "contrast"
                    ? theme.palette.primary.contrastText
                    : undefined,
            backgroundColor:
                props.buttonColor === "contrast"
                    ? "rgba(255, 255, 255, 0.1)"
                    : undefined,
        },
    }));

    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const { image, baseImage } = useImageData();
    const { layers, activeLayerId, updateLayer } = useLayers();
    const activeLayer = layers.find(layer => layer.id === activeLayerId);

    const [width, setWidth] = useState(image.width);
    const [height, setHeight] = useState(image.height);
    const [format, setFormat] = useState<"percents" | "pixels">("pixels");
    const [interpolation, setInterpolation] = useState<"bilinear" | "nearest">(
        "bilinear"
    );
    const [saveProportions, setSaveProportions] = useState(true);

    function handleFormatChange(
        event: SelectChangeEvent<"percents" | "pixels">
    ) {
        const newFormat = event.target.value as "percents" | "pixels";
        setFormat(newFormat);
    }

    function handleInterpolationChange(
        event: SelectChangeEvent<"bilinear" | "nearest">
    ) {
        const newInterpolation = event.target.value as "bilinear" | "nearest";
        setInterpolation(newInterpolation);
        if (newInterpolation === "bilinear") {
            setTooltipText(bilinearInterpolationTooltipText);
        } else {
            setTooltipText(nearestInterpolationTooltipText);
        }
    }

    function handleWidthChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        const newWidth = clamp(Number(value), 1, baseImage.width * 3);
        if (value === "") {
            setWidth(width);
        } else {
            setWidth(Number(newWidth));
        }
    }

    function handleHeightChange(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        const newHeight = clamp(Number(value), 1, baseImage.height * 3);
        if (value === "") {
            setHeight(height);
        } else {
            setHeight(Number(newHeight));
        }
    }

    function handleSaveProportionsChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        setSaveProportions(event.target.checked);
    }

    useEffect(() => {
        if (activeLayer) {
            if (format === "percents") {
                setWidth(activeLayer.scale || 100);
                setHeight(activeLayer.scale || 100);
            } else {
                setWidth(activeLayer.width || image.width);
                setHeight(activeLayer.height || image.height);
            }
        }
    }, [activeLayer, format, image]);

    useEffect(() => {
        if (activeLayer) {
            if (format === "percents") {
                // Если переключаемся на проценты, используем scale активного слоя
                setWidth(activeLayer.scale || 100);
                setHeight(activeLayer.scale || 100);
            } else {
                // Если переключаемся на пиксели, используем текущие размеры активного слоя
                setWidth(activeLayer.width || image.width);
                setHeight(activeLayer.height || image.height);
            }
        }
    }, [format]);

    useEffect(() => {
        if (saveProportions) {
            if (format === "percents") {
                setHeight(width);
            } else {
                const aspectRatio = baseImage.width / baseImage.height;
                setHeight(Math.floor(width / aspectRatio));
            }
        }
    }, [saveProportions, width, height]);

    async function applyResize() {
        if (!activeLayer?.id) return;

        let targetWidth: number;
        let targetHeight: number;
        
        if (format === "percents") {
            // Если в процентах, вычисляем целевые размеры от базового размера слоя
            const baseWidth = activeLayer.baseImageData?.width || baseImage.width;
            const baseHeight = activeLayer.baseImageData?.height || baseImage.height;
            targetWidth = Math.floor((baseWidth * width) / 100);
            targetHeight = Math.floor((baseHeight * height) / 100);
        } else {
            // Если в пикселях, используем введенные значения напрямую
            targetWidth = width;
            targetHeight = height;
        }

        // Используем baseImageData активного слоя для интерполяции
        if (activeLayer.baseImageData) {
            let pixelArray: PixelArray;
            if (interpolation === "bilinear") {
                pixelArray = await bilinearInterpolation(
                    activeLayer.baseImageData,
                    targetWidth,
                    targetHeight
                );
            } else {
                pixelArray = await nearestNeighborInterpolation(
                    activeLayer.baseImageData,
                    targetWidth,
                    targetHeight
                );
            }

            const newImageData = new ImageData(
                pixelArray.data,
                pixelArray.width,
                pixelArray.height
            );

            const newImageBitmap = await createImageBitmap(newImageData);

            // Обновляем активный слой с новыми размерами и масштабом
            const newScale = format === "percents" ? width : Math.round((targetWidth / (activeLayer.baseImageData.width)) * 100);
            
            // Обновляем слой через LayersContext
            updateLayer(activeLayer.id, {
                imageData: newImageData,
                imageBitmap: newImageBitmap,
                width: targetWidth,
                height: targetHeight,
                scale: newScale
            });
        }

        handleClose();
    }

    return (
        <>
            <StyledButton variant={props.buttonType} onClick={handleOpen}>
                Изменить размер 
            </StyledButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Изменить размер изображения</DialogTitle>

                <DialogContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                            mt: 1,
                        }}
                    >
                        <FormControl sx={{ flexGrow: 1 }}>
                            <InputLabel id="image-format-select-label">
                                Формат
                            </InputLabel>
                            <Select
                                labelId="image-format-select-label"
                                label="Формат"
                                color="primary"
                                value={format}
                                onChange={handleFormatChange}
                            >
                                <MenuItem value="pixels">Пиксели</MenuItem>
                                <MenuItem value="percents">Проценты</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            sx={{ mr: 0 }}
                            control={
                                <Checkbox
                                    onChange={handleSaveProportionsChange}
                                    checked={saveProportions}
                                ></Checkbox>
                            }
                            label="Сохранять базовые пропорции"
                        ></FormControlLabel>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: 2,
                            mt: 1,
                        }}
                    >
                        <TextField
                            label="Ширина"
                            type="number"
                            value={width}
                            onChange={handleWidthChange}
                        />
                        <ClearIcon sx={{ alignSelf: "center" }} />
                        <TextField
                            label="Высота"
                            type="number"
                            value={height}
                            onChange={handleHeightChange}
                        />
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 1,
                        }}
                    >
                        <FormControl sx={{ width: "200px" }}>
                            <InputLabel id="interpolation-select-label">
                                Интерполяция
                            </InputLabel>
                            <Select
                                labelId="interpolation-select-label"
                                label="Интерполяция"
                                color="primary"
                                value={interpolation}
                                onChange={handleInterpolationChange}
                            >
                                <MenuItem value="bilinear">Билинейная</MenuItem>
                                <MenuItem value="nearest">
                                    Ближайший сосед
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <Tooltip title={tooltipText}>
                            <InfoOutlineIcon />
                        </Tooltip>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            ml: "auto",
                            mt: 1,
                        }}
                    >
                        <Button
                            size="large"
                            variant="contained"
                            color="primary"
                            onClick={applyResize}
                        >
                            Применить
                        </Button>
                        <Button
                            size="large"
                            variant="outlined"
                            color="primary"
                            onClick={handleClose}
                            sx={{ marginLeft: 2 }}
                        >
                            Отмена
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ImageResizeModal;
