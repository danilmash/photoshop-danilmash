import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiSlider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";
import ZoomIn from "@mui/icons-material/ZoomIn";
import { useImageData } from "../contexts/ImageDataContext";
import { useCanvasElement } from "../contexts/CanvasElementContext";
import { bilinearInterpolation } from "../utils/interpolation";
import { clamp } from "../utils/helpers";
const Input = styled(MuiInput)(({ theme }) => ({
    color: theme.palette.primary.contrastText,
    width: "50px",

    ":hover:not(.Mui-disabled, .Mui-error):before": {
        borderBottom: `2.5px solid ${theme.palette.primary.contrastText}`,
    },

    ":before": {
        borderBottom: `1px solid ${theme.palette.primary.contrastText}`,
    },
}));

const Slider = styled(MuiSlider)(({ theme }) => ({
    color: theme.palette.primary.contrastText,
    width: "300px",
    "& .MuiSlider-thumb": {
        "&:hover": {
            boxShadow: "0px 0px 0px 8px rgba(255, 255, 255, 0.16)",
        },
    },
}));

export default function ImageResizeSlider() {
    const { canvasRef, offsetX } = useCanvasElement();
    const { image, setImage, baseImage } = useImageData();
    const imageWidth = baseImage.width;
    const imageHeight = baseImage.height;
    const canvasWidth = canvasRef.current?.width || 0;
    const canvasHeight = canvasRef.current?.height || 0;
    const maxWidth = canvasWidth - 100; // 100px for padding
    const maxHeight = canvasHeight - 100; // 100px for padding

    React.useEffect(() => {
        offsetX.current = 0;
        const scaleWidth = (maxWidth / imageWidth) * 100;
        const scaleHeight = (maxHeight / imageHeight) * 100;
        const scale = Math.min(scaleWidth, scaleHeight);
        setValue(Math.floor(clamp(scale, 12, 300)));
    }, [imageWidth, canvasWidth, baseImage]);

    const [value, setValue] = React.useState(100);

    React.useEffect(() => {
        const resizeImage = async () => {
            if (
                canvasRef.current &&
                image.imageBitmap &&
                baseImage.imageData?.data
            ) {
                const newWidth = Math.floor((imageWidth * value) / 100);
                const newHeight = Math.floor((imageHeight * value) / 100);
                const pixelArray = baseImage.imageData.data;

                const newPixelArray = await bilinearInterpolation(
                    {
                        data: pixelArray,
                        width: imageWidth,
                        height: imageHeight,
                    },
                    newWidth,
                    newHeight
                );
                const newImageData = new ImageData(
                    newPixelArray.data,
                    newPixelArray.width,
                    newPixelArray.height
                );
                setImage({
                    ...image,
                    imageBitmap: await createImageBitmap(newImageData),
                    imageData: newImageData,
                    width: newImageData.width,
                    height: newImageData.height,
                });
            }
        };

        if (baseImage.imageData) {
            resizeImage();
        }
    }, [value, baseImage]);

    const handleSliderChange = (
        _event: Event,
        newValue: number | number[],
        _activeThumb: number
    ) => {
        setValue(typeof newValue === "number" ? newValue : newValue[0]);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value === "" ? 0 : Number(event.target.value));
    };

    const handleBlur = () => {
        setValue(clamp(value, 12, 300));
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 370,
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginLeft: "auto",
            }}
        >
            <ZoomIn />
            <Slider
                step={4}
                min={12}
                max={300}
                value={typeof value === "number" ? value : 0}
                onChange={handleSliderChange}
                aria-labelledby="input-slider"
            />
            <Input
                value={value}
                onChange={handleInputChange}
                onBlur={handleBlur}
                inputProps={{
                    step: 5,
                    min: 12,
                    max: 300,
                    type: "number",
                    "aria-labelledby": "input-slider",
                }}
            />
        </Box>
    );
}
