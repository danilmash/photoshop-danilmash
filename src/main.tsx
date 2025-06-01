import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ImageDataProvider } from "./contexts/ImageDataContext.tsx";
import { CanvasElementProvider } from "./contexts/CanvasElementContext.tsx";
import { ToolsProvider } from "./contexts/ToolsContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ImageDataProvider>
            <CanvasElementProvider>
                <ToolsProvider>
                    <App />
                </ToolsProvider>
            </CanvasElementProvider>
        </ImageDataProvider>
    </StrictMode>
);
