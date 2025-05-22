import { ChangeEvent, useRef } from "react";
import Button from "@mui/material/Button";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import { Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

function ImageUploader(props: { buttonType: "contained" | "outlined" }) {
    const supportedFormats = ["PNG", "JPEG", "JPG", "GB7"];
    const tooltipText = `Поддерживаемые форматы: ${supportedFormats.join(
        ", "
    )}`;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            // Пользователь отменил выбор файла
            return;
        }
    };

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
