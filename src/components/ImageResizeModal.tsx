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

    const { image, baseImage, setImage } = useImageData();

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
        if (format === "percents") {
            const percentWidth = Math.round(
                (image.width / baseImage.width) * 100
            );
            const percentHeight = Math.round(
                (image.height / baseImage.height) * 100
            );
            setWidth(percentWidth);
            setHeight(percentHeight);
        } else {
            setWidth(image.width);
            setHeight(image.height);
        }
    }, [image]);

    useEffect(() => {
        console.log(123);
        if (format === "percents") {
            const percentWidth = Math.round((width / baseImage.width) * 100);
            const percentHeight = Math.round((height / baseImage.height) * 100);
            setWidth(percentWidth);
            setHeight(percentHeight);
        } else {
            setWidth(Math.floor(width * (baseImage.width / 100)));
            setHeight(Math.floor(height * (baseImage.height / 100)));
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
        let targetWidth: number;
        let targetHeight: number;
        if (format === "percents") {
            targetWidth = Math.floor((baseImage.width * width) / 100);
            targetHeight = Math.floor((baseImage.height * height) / 100);
        } else {
            targetWidth = width;
            targetHeight = height;
        }
        if (baseImage.imageData) {
            let pixelArray: PixelArray;
            if (interpolation === "bilinear") {
                pixelArray = await bilinearInterpolation(
                    baseImage.imageData,
                    targetWidth,
                    targetHeight
                );
            } else {
                pixelArray = await nearestNeighborInterpolation(
                    baseImage.imageData,
                    targetWidth,
                    targetHeight
                );
            }
            const newImageData = new ImageData(
                pixelArray.data,
                pixelArray.width,
                pixelArray.height
            );
            // Update the image data in the context
            setImage({
                ...baseImage,
                imageData: newImageData,
                imageBitmap: await createImageBitmap(newImageData),
                width: newImageData.width,
                height: newImageData.height,
            });
        }
        handleClose();
    }

    return (
        <>
            <StyledButton variant={props.buttonType} onClick={handleOpen}>
                Открыть модалку
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
