import { useState } from 'react';
import { Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { saveAsGB7, saveAsPNG, saveAsJPEG } from '../utils/saveImage';
import { useLayers } from '../contexts/LayersContext';

type SaveFormat = 'png' | 'jpg' | 'gb7';

export default function SaveImageButton(props: {
    buttonType: "contained" | "outlined";
    buttonColor: "primary" | "contrast";
}) {
    const sx = {
        color:
            props.buttonColor === "contrast"
                ? (theme: { palette: { primary: { contrastText: any; }; }; }) => theme.palette.primary.contrastText
                : undefined,
        borderColor:
            props.buttonColor === "contrast"
                ? (theme: { palette: { primary: { contrastText: any; }; }; }) => theme.palette.primary.contrastText
                : undefined,
        "&:hover": {
            borderColor:
                props.buttonColor === "contrast"
                    ? (theme: { palette: { primary: { contrastText: any; }; }; }) => theme.palette.primary.contrastText
                    : undefined,
            backgroundColor:
                props.buttonColor === "contrast"
                    ? "rgba(255, 255, 255, 0.1)"
                    : undefined,
        },
    };

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<SaveFormat>('png');
    const [filename, setFilename] = useState('image');
    const [quality, setQuality] = useState<number>(92);
    
    const { layers, processLayers, getMaxWidthAndHeight } = useLayers();
    
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const handleFormatSelect = (format: SaveFormat) => {
        setSelectedFormat(format);
        handleClose();
        setDialogOpen(true);
    };
    
    const handleDialogClose = () => {
        setDialogOpen(false);
    };
    
    const handleSave = async () => {
        if (layers.length === 0) return;
        
        const { width, height } = getMaxWidthAndHeight();
        const { imageData } = await processLayers(width, height, 100);
        
        try {
            switch (selectedFormat) {
                case 'png':
                    await saveAsPNG(imageData, filename);
                    break;
                case 'jpg':
                    await saveAsJPEG(imageData, filename, quality / 100);
                    break;
                case 'gb7':
                    await saveAsGB7(imageData, filename);
                    break;
            }
        } catch (error) {
            console.error('Error saving image:', error);
        }
        
        handleDialogClose();
    };
    
    return (
        <>
            <Button  sx={sx}
                variant={props.buttonType} 
                onClick={handleClick}
                startIcon={<SaveIcon />}
            >
                Сохранить
            </Button>
            
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuItem onClick={() => handleFormatSelect('png')}>PNG</MenuItem>
                <MenuItem onClick={() => handleFormatSelect('jpg')}>JPEG</MenuItem>
                <MenuItem onClick={() => handleFormatSelect('gb7')}>GB7</MenuItem>
            </Menu>
            
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>Сохранить как {selectedFormat.toUpperCase()}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Имя файла"
                        fullWidth
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    
                    {selectedFormat === 'jpg' && (
                        <FormControl fullWidth>
                            <TextField
                                type="number"
                                label="Качество"
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                                inputProps={{ min: 1, max: 100 }}
                                helperText="От 1 до 100"
                            />
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Отмена</Button>
                    <Button onClick={handleSave} variant="contained">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 