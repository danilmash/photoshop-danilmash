import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

// Создаем тему с светлым режимом
const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#123321",
        },
        secondary: {
            main: "#123566",
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <h1>Photoshop danilmash</h1>
        </ThemeProvider>
    );
}

export default App;
