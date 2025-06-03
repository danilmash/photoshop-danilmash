import { createContext, useContext, useState } from "react";

export type ToolType = "pan" | "eyedropper" | "curve" | "kernel" | undefined;

interface ToolsContextType {
    activeTool: ToolType;
    setActiveTool: (tool: ToolType) => void;
    primaryColor: { r: number; g: number; b: number };
    secondaryColor: { r: number; g: number; b: number };
    setPrimaryColor: (color: { r: number; g: number; b: number }) => void;
    setSecondaryColor: (color: { r: number; g: number; b: number }) => void;
    primaryColorCoordinates: { x: number; y: number };
    setPrimaryColorCoordinates: (coordinates: { x: number; y: number }) => void;
    secondaryColorCoordinates: { x: number; y: number };
    setSecondaryColorCoordinates: (coordinates: {
        x: number;
        y: number;
    }) => void;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

const ToolsProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [activeTool, setActiveTool] = useState<ToolType>(undefined);
    const [primaryColor, setPrimaryColor] = useState<{
        r: number;
        g: number;
        b: number;
    }>({ r: 0, g: 0, b: 0 });
    const [secondaryColor, setSecondaryColor] = useState<{
        r: number;
        g: number;
        b: number;
    }>({ r: 255, g: 255, b: 255 });
    const [primaryColorCoordinates, setPrimaryColorCoordinates] = useState<{
        x: number;
        y: number;
    }>({
        x: 0,
        y: 0,
    });
    const [secondaryColorCoordinates, setSecondaryColorCoordinates] = useState<{
        x: number;
        y: number;
    }>({
        x: 0,
        y: 0,
    });

    return (
        <ToolsContext.Provider
            value={{
                activeTool,
                setActiveTool,
                primaryColor,
                setPrimaryColor,
                secondaryColor,
                setSecondaryColor,
                primaryColorCoordinates,
                setPrimaryColorCoordinates,
                secondaryColorCoordinates,
                setSecondaryColorCoordinates,
            }}
        >
            {children}
        </ToolsContext.Provider>
    );
};

const useTools = (): ToolsContextType => {
    const context = useContext(ToolsContext);
    if (!context) {
        throw new Error("useTools должен использоваться внутри ToolsProvider");
    }
    return context;
};

export { ToolsProvider, useTools };
