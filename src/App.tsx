import { ThemeProvider } from "@emotion/react";
import { Box, createTheme, styled } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import InfoPanel from "./components/InfoPanel";

const AppContainer = styled(Box)(() => ({
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
}));

const theme = createTheme({
    typography: {
        fontFamily: "Roboto",
    },
    palette: {
        mode: "light",
        primary: {
            main: "#123321",
            contrastText: "#fff",
        },
        secondary: {
            main: "#123566",
        },
    },
    components: {
        MuiDivider: {
            styleOverrides: {
                root: {
                    backgroundColor: "#ffffff6d",
                },
            },
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AppContainer>
                <CssBaseline />

                <InfoPanel
                    imageProperties={{
                        width: 1920,
                        height: 1080,
                        colorDepth: 24,
                        format: "JPEG",
                    }}
                ></InfoPanel>
            </AppContainer>
        </ThemeProvider>
    );
}

export default App;
