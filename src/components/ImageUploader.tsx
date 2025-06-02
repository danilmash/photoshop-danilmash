import { ChangeEvent, useRef } from "react";
import Button from "@mui/material/Button";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import { Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { isGB7Format } from "../utils/GB7Parser";
import { parseGB7 } from "../utils/GB7Parser";
import loadImageFromFile from "../utils/loadImageFromFile";
import { useLayers } from "../contexts/LayersContext";

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

    const {  addLayer } = useLayers();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleButtonClick = () => {
        fileInputRef.current?.click();
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
            addLayer({
                id: Date.now().toString(),
                name: file.name,
                visible: true,
                opacity: 1,
                blendMode: "source-over",
                imageBitmap,
                imageData,
                baseImageData: imageData,
                baseImageBitmap: imageBitmap,
                originalImageData: imageData,
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
                }
            });
        } else {
            const CanvasImageData = await loadImageFromFile(file);
            if (!CanvasImageData) {
                alert("Ошибка при загрузке изображения");
                return;
            }
            const { imageBitmap, imageData } = CanvasImageData;
            addLayer({
                id: Date.now().toString(),
                name: file.name,
                visible: true,
                opacity: 1,
                blendMode: "multiply",
                imageBitmap,
                imageData,
                baseImageData: imageData,
                baseImageBitmap: imageBitmap,
                originalImageData: imageData,
                width: CanvasImageData.width,
                height: CanvasImageData.height,
                scale: 100,
                infoPanel: {
                    colorDepth: CanvasImageData.colorDepth,
                    format: CanvasImageData.format,
                    source: file,
                    width: CanvasImageData.width,
                    height: CanvasImageData.height,
                },
                curvePoints: {
                    point1: { x: 0, y: 0 },
                    point2: { x: 255, y: 255 },
                }
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
