import { ThemeProvider } from "@emotion/react";
import { Box, createTheme, styled } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import InfoPanel from "./components/InfoPanel";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
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
                <Header />
                <Box sx={{ flexGrow: 1 }}>
                    <Workspace />
                </Box>
                <InfoPanel></InfoPanel>
            </AppContainer>
        </ThemeProvider>
    );
}

export default App;
