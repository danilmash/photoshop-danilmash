import { ChangeEvent, useRef } from "react";
import Button from "@mui/material/Button";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import { Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { isGB7Format } from "../utils/GB7Parser";
import { parseGB7 } from "../utils/GB7Parser";
import loadImageFromFile from "../utils/loadImageFromFile";
import { useLayers } from "../contexts/LayersContext";
import { KERNELS } from '../utils/kernels';

function ImageUploader(props: { buttonType: "contained" | "outlined", onLoad: () => void }) {
    const StyledButton = styled(Button)(({ theme }) => ({
        color:
            props.buttonType === "outlined"
                ? theme.palette.primary.contrastText
                : undefined,
        borderColor:
            props.buttonType === "outlined"
                ? theme.palette.primary.contrastText
                : undefined,
        "&:hover": {
            borderColor:
                props.buttonType === "outlined"
                    ? theme.palette.primary.contrastText
                    : undefined,
            backgroundColor:
                props.buttonType === "outlined"
                    ? "rgba(255, 255, 255, 0.1)"
                    : undefined,
        },
    }));
    const supportedFormats = ["PNG", "JPEG", "JPG", "GB7"];
    const tooltipText = `Поддерживаемые форматы: ${supportedFormats.join(
        ", "
    )}`;

    const { addLayer } = useLayers();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Функция для проверки наличия альфа-канала в ImageData
    const checkForAlpha = (imageData: ImageData): boolean => {
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] !== 255) {
                return true;
            }
        }
        return false;
    };

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (await isGB7Format(file)) {
            const gb7Data = await parseGB7(file);
            if (!gb7Data) {
                alert("Ошибка при загрузке GB7 файла");
                return;
            }
            const { imageBitmap, imageData } = gb7Data;
            const hasAlpha = checkForAlpha(imageData);

            addLayer({
                id: Date.now().toString(),
                name: file.name,
                visible: true,
                opacity: 1,
                blendMode: "source-over",
                imageBitmap,
                imageData,
                baseImageData: imageData,
                width: gb7Data.width,
                height: gb7Data.height,
                scale: 100,
                infoPanel: {
                    colorDepth: gb7Data.colorDepth,
                    format: "GB7",
                    source: file,
                    width: gb7Data.width,
                    height: gb7Data.height,
                },
                curvePoints: {
                    point1: { x: 0, y: 0 },
                    point2: { x: 255, y: 255 },
                },
                kernelValues: KERNELS.identity,
                alphaVisible: true,
                hasAlpha: hasAlpha
            });
        } else {
            const loadedImage = await loadImageFromFile(file);
            if (!loadedImage || !loadedImage.imageData) {
                alert("Ошибка при загрузке изображения");
                return;
            }

            const hasAlpha = checkForAlpha(loadedImage.imageData);

            addLayer({
                id: Date.now().toString(),
                name: file.name,
                visible: true,
                opacity: 1,
                blendMode: "source-over",
                imageBitmap: loadedImage.imageBitmap,
                imageData: loadedImage.imageData,
                baseImageData: loadedImage.imageData,
                width: loadedImage.width,
                height: loadedImage.height,
                scale: 100,
                infoPanel: {
                    colorDepth: loadedImage.colorDepth,
                    format: loadedImage.format,
                    source: file,
                    width: loadedImage.width,
                    height: loadedImage.height,
                },
                curvePoints: {
                    point1: { x: 0, y: 0 },
                    point2: { x: 255, y: 255 },
                },
                kernelValues: KERNELS.identity,
                alphaVisible: true,
                hasAlpha: hasAlpha
            });
        }
        props.onLoad();
    }

    return (
        <>
            <input
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg, .gb7"
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            <StyledButton
                variant={props.buttonType}
                onClick={handleButtonClick}
            >
                Загрузить изображение
                <Tooltip title={tooltipText}>
                    <InfoOutlineIcon
                        style={{
                            marginLeft: "5px",
                            color:
                                props.buttonType === "outlined"
                                    ? "white"
                                    : undefined,
                        }}
                    />
                </Tooltip>
            </StyledButton>
        </>
    );
}

export default ImageUploader;
