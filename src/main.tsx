import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ImageDataProvider } from "./contexts/ImageDataContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ImageDataProvider>
            <App />
        </ImageDataProvider>
    </StrictMode>
);
