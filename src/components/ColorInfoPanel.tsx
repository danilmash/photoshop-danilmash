import {
    Box,
    Divider,
    MenuItem,
    Paper,
    Select,
    styled,
    Typography,
} from "@mui/material";
import { useTools } from "../contexts/ToolsContext";
import {
    rgbToXYZ,
    rgbToLab,
    rgbToOklch,
    colorSpaceInfo,
    calculateContrast,
    isContrastSufficient,
    calculateAPCAContrast,
} from "../utils/colorSpaces";
import { Tooltip } from "@mui/material";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import { useEffect, useState } from "react";

const StyledTypography = styled(Typography)(() => ({
    display: "flex",
    alignItems: "center",
    gap: 2,
}));

function ColorSwatch({ r, g, b }: { r: number; g: number; b: number }) {
    return (
        <Paper
            elevation={1}
            sx={{
                width: "40px",
                height: "40px",
                backgroundColor: `rgb(${r}, ${g}, ${b})`,
                borderRadius: "12px",
            }}
        ></Paper>
    );
}

function ColorInfoPanel() {
    const {
        activeTool,
        primaryColor,
        secondaryColor,
        primaryColorCoordinates,
        secondaryColorCoordinates,
    } = useTools();

    const [contrastAlgorithm, setContrastAlgorithm] = useState<
        "WCAG2" | "APCA"
    >("WCAG2");

    const [contrastRatio, setContrastRatio] = useState(0);
    const [isContrastGood, setIsContrastGood] = useState(false);
    const [apcaContrastRatio, setAPCAContrastRatio] = useState(0);

    const [primaryColorInfo, setPrimaryColorInfo] = useState({
        coords: {
            x: 0,
            y: 0,
        },
        xyz: { x: 0, y: 0, z: 0 },
        lab: { L: 0, a: 0, b: 0 },
        oklch: { L: 0, C: 0, h: 0 },
    });
    const [secondaryColorInfo, setSecondaryColorInfo] = useState({
        coords: {
            x: 0,
            y: 0,
        },
        xyz: { x: 0, y: 0, z: 0 },
        lab: { L: 0, a: 0, b: 0 },
        oklch: { L: 0, C: 0, h: 0 },
    });

    useEffect(() => {
        setPrimaryColorInfo({
            coords: primaryColorCoordinates,
            xyz: rgbToXYZ(primaryColor.r, primaryColor.g, primaryColor.b),
            lab: rgbToLab(primaryColor.r, primaryColor.g, primaryColor.b),
            oklch: rgbToOklch(primaryColor.r, primaryColor.g, primaryColor.b),
        });
        setSecondaryColorInfo({
            coords: secondaryColorCoordinates,
            xyz: rgbToXYZ(secondaryColor.r, secondaryColor.g, secondaryColor.b),
            lab: rgbToLab(secondaryColor.r, secondaryColor.g, secondaryColor.b),
            oklch: rgbToOklch(
                secondaryColor.r,
                secondaryColor.g,
                secondaryColor.b
            ),
        });
        setAPCAContrastRatio(
            calculateAPCAContrast(
                {
                    r: primaryColorInfo.oklch.L,
                    g: primaryColorInfo.oklch.C,
                    b: primaryColorInfo.oklch.h,
                },
                {
                    r: secondaryColorInfo.oklch.L,
                    g: secondaryColorInfo.oklch.C,
                    b: secondaryColorInfo.oklch.h,
                }
            )
        );
        setIsContrastGood(
            isContrastSufficient(
                {
                    r: primaryColor.r,
                    g: primaryColor.g,
                    b: primaryColor.b,
                },
                {
                    r: secondaryColor.r,
                    g: secondaryColor.g,
                    b: secondaryColor.b,
                }
            )
        );
        setContrastRatio(
            calculateContrast(
                {
                    r: primaryColor.r,
                    g: primaryColor.g,
                    b: primaryColor.b,
                },
                {
                    r: secondaryColor.r,
                    g: secondaryColor.g,
                    b: secondaryColor.b,
                }
            )
        );
    }, [
        primaryColor,
        secondaryColor,
        primaryColorCoordinates,
        secondaryColorCoordinates,
    ]);

    if (activeTool !== "eyedropper") return null;

    return (
        <Paper
            elevation={3}
            sx={{
                padding: 1,
                width: "100%",
                borderRadius: "12px",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    flexWrap: "wrap",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "start",
                        flexDirection: "column",
                        flexGrow: 1,
                        width: "100%",
                        maxWidth: "200px",
                        minWidth: "150px",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ColorSwatch
                            r={primaryColor.r}
                            g={primaryColor.g}
                            b={primaryColor.b}
                        />
                        <Typography variant="body1">Основной цвет</Typography>
                    </Box>
                    <StyledTypography>
                        Координаты: {primaryColorCoordinates.x},{" "}
                        {primaryColorCoordinates.y}
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.rgb.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        RGB : {Math.round(primaryColor.r)},{" "}
                        {Math.round(primaryColor.g)},{" "}
                        {Math.round(primaryColor.b)}
                    </StyledTypography>

                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.xyz.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        XYZ: {Math.round(primaryColorInfo.xyz.x)},{" "}
                        {Math.round(primaryColorInfo.xyz.y)},{" "}
                        {Math.round(primaryColorInfo.xyz.z)}
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.lab.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        Lab: {Math.round(primaryColorInfo.lab.L)},{" "}
                        {Math.round(primaryColorInfo.lab.a)},{" "}
                        {Math.round(primaryColorInfo.lab.b)}
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.oklch.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        Oklch: {Math.round(primaryColorInfo.oklch.L)},{" "}
                        {Math.round(primaryColorInfo.oklch.C)},{" "}
                        {Math.round(primaryColorInfo.oklch.h)}
                    </StyledTypography>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "start",
                        flexDirection: "column",
                        flexGrow: 1,
                        width: "100%",
                        maxWidth: "200px",
                        minWidth: "150px",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ColorSwatch
                            r={secondaryColor.r}
                            g={secondaryColor.g}
                            b={secondaryColor.b}
                        />
                        <Typography variant="body1">Вторичный цвет</Typography>
                    </Box>
                    <StyledTypography>
                        Координаты: {secondaryColorCoordinates.x},{" "}
                        {secondaryColorCoordinates.y}
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.rgb.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        RGB: {Math.round(secondaryColor.r)},{" "}
                        {Math.round(secondaryColor.g)},{" "}
                        {Math.round(secondaryColor.b)}
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.xyz.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        XYZ: {Math.round(secondaryColorInfo.xyz.x)},{" "}
                        {Math.round(secondaryColorInfo.xyz.y)},{" "}
                        {Math.round(secondaryColorInfo.xyz.z)}
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.lab.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        Lab: {Math.round(secondaryColorInfo.lab.L)},{" "}
                        {Math.round(secondaryColorInfo.lab.a)},{" "}
                        {Math.round(secondaryColorInfo.lab.b)}
                    </StyledTypography>
                    <StyledTypography variant="body1">
                        <Tooltip title={colorSpaceInfo.oklch.description}>
                            <InfoOutlineIcon />
                        </Tooltip>
                        Oklch: {Math.round(secondaryColorInfo.oklch.L)},{" "}
                        {Math.round(secondaryColorInfo.oklch.C)},{" "}
                        {Math.round(secondaryColorInfo.oklch.h)}
                    </StyledTypography>
                </Box>
                <Divider flexItem sx={{ width: "100%" }}></Divider>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                        flexWrap: "wrap",
                    }}
                >
                    <Select
                        value={contrastAlgorithm}
                        onChange={(e) =>
                            setContrastAlgorithm(
                                e.target.value as "WCAG2" | "APCA"
                            )
                        }
                    >
                        <MenuItem value="WCAG2">WCAG 2</MenuItem>
                        <MenuItem value="APCA">APCA</MenuItem>
                    </Select>
                    {contrastAlgorithm === "WCAG2" ? (
                        <>
                            {isContrastGood ? (
                                <ColorSwatch r={0} g={255} b={0} />
                            ) : (
                                <ColorSwatch r={255} g={0} b={0} />
                            )}
                            <Typography variant="body1">
                                Контраст:{" "}
                                {Math.round(contrastRatio * 10) / 10 + "/1"}
                            </Typography>
                            {isContrastGood ? (
                                <Typography variant="body1" color="success">
                                    Хороший
                                </Typography>
                            ) : (
                                <Typography variant="body1" color="error">
                                    Плохой
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Typography variant="body1">
                            Контраст: {Math.round(apcaContrastRatio)}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

export default ColorInfoPanel;
