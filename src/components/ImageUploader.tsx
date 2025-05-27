import { ChangeEvent, useRef } from "react";
import Button from "@mui/material/Button";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import { Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { isGB7Format } from "../utils/GB7Parser";
import { parseGB7 } from "../utils/GB7Parser";
import { useImageData } from "../contexts/ImageDataContext";
import loadImageFromFile from "../utils/loadImageFromFile";

function ImageUploader(props: { buttonType: "contained" | "outlined" }) {
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

    const { setImage } = useImageData();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };
    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0) {
            // Пользователь отменил выбор файла
            return;
        }

        const file = files[0];

        if (await isGB7Format(file)) {
            const gb7Data = await parseGB7(file);
            setImage({
                width: gb7Data.width,
                height: gb7Data.height,
                source: file,
                colorDepth: gb7Data.colorDepth,
                format: "GB7",
                imageData: gb7Data.imageData,
                imageBitmap: gb7Data.imageBitmap,
            });
        } else {
            const imageData = await loadImageFromFile(file);
            setImage(imageData);
        }
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
