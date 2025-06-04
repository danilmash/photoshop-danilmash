import { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { 
    Box, 
    Typography, 
    IconButton, 
    Slider, 
    Select, 
    MenuItem,
    Tooltip,
    Paper,
    Switch,
    Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LayersIcon from '@mui/icons-material/Layers';
import { useLayers } from '../contexts/LayersContext';
import AddLayerModal from './AddLayerModal';

const LayerPanelContainer = styled(Box)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    borderLeft: `1px solid ${theme.palette.divider}`,
}));

const LayerHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const LayerList = styled(Box)(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(1),
}));

const LayerItem = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
}));

const LayerPreview = styled(Box)({
    width: '50px',
    height: '50px',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& img': {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
    },
});

const LayerControls = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const blendModes: { value: GlobalCompositeOperation; label: string; description: string }[] = [
    { value: 'source-over', label: 'Normal', description: 'Обычное наложение без эффектов' },
    { value: 'multiply', label: 'Multiply', description: 'Темнит изображение, умножая значения пикселей' },
    { value: 'screen', label: 'Screen', description: 'Делает изображение светлее, инвертируя и умножая' },
    { value: 'overlay', label: 'Overlay', description: 'Сочетает multiply и screen в зависимости от яркости пикселей' },
];

interface LayerPreviewProps {
    imageBitmap: ImageBitmap | null;
    name: string;
}

function LayerPreviewComponent({ imageBitmap, name }: LayerPreviewProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (imageBitmap) {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(imageBitmap, 0, 0, 50, 50);
                setPreviewUrl(canvas.toDataURL());
            }
        } else {
            setPreviewUrl(null);
        }
    }, [imageBitmap]);

    if (!previewUrl) return null;

    return (
        <img
            src={previewUrl}
            alt={name}
        />
    );
}

function LayerPanel() {
    const { 
        layers, 
        activeLayerId, 
        setActiveLayerId,
        updateLayer,
        removeLayer,
        setLayers
    } = useLayers();

    const handleOpacityChange = (layerId: string) => (_: Event, value: number | number[]) => {
        requestAnimationFrame(() => {
            updateLayer(layerId, { opacity: (value as number) / 100 });
        });
    };

    const handleVisibilityToggle = (layerId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        const layer = layers.find(l => l.id === layerId);
        if (layer) {
            updateLayer(layerId, { visible: !layer.visible });
        }
    };

    const handleBlendModeChange = (layerId: string) => (event: any) => {
        updateLayer(layerId, { blendMode: event.target.value as GlobalCompositeOperation });
    };

    const moveLayer = (index: number, direction: 'up' | 'down') => (e: React.MouseEvent) => {
        e.stopPropagation();
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < layers.length) {
            const newLayers = [...layers];
            [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
            setLayers(newLayers);
        }
    };

    const handleRemoveLayer = (layerId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        removeLayer(layerId);
    };

    const handleAlphaVisibilityToggle = (layerId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        const layer = layers.find(l => l.id === layerId);
        if (layer) {
            // Просто переключаем видимость альфа-канала без изменения данных
            updateLayer(layerId, { 
                alphaVisible: !layer.alphaVisible
            });
        }
    };

    const handleRemoveAlpha = (layerId: string) => async (e: React.MouseEvent) => {
        e.stopPropagation();
        const layer = layers.find(l => l.id === layerId);
        if (layer && layer.imageData && layer.hasAlpha) {
            // Создаем копию изображения
            const tempImageData = new ImageData(
                new Uint8ClampedArray(layer.imageData.data),
                layer.imageData.width,
                layer.imageData.height
            );

            // Просто делаем все пиксели непрозрачными, сохраняя их цвета
            for (let i = 3; i < tempImageData.data.length; i += 4) {
                tempImageData.data[i] = 255;
            }

            // Создаем новый ImageBitmap из обновленных данных
            const tempCanvas = new OffscreenCanvas(layer.width, layer.height);
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                ctx.putImageData(tempImageData, 0, 0);
                const newImageBitmap = await createImageBitmap(tempCanvas);

                // Обновляем слой, делая все пиксели непрозрачными и удаляя альфа-канал
                updateLayer(layerId, { 
                    imageData: tempImageData,
                    baseImageData: tempImageData,
                    imageBitmap: newImageBitmap,
                    hasAlpha: false,
                    alphaVisible: false
                });
            }
        }
    };

    return (
        <LayerPanelContainer>
            <LayerHeader>
                <Typography variant="h6">Слои</Typography>
                <AddLayerModal />
            </LayerHeader>
            
            <LayerList>
                {layers.map((layer, index) => (
                    <LayerItem 
                        key={layer.id}
                        onClick={() => setActiveLayerId(layer.id)}
                        elevation={layer.id === activeLayerId ? 3 : 1}
                        sx={{
                            border: theme => 
                                layer.id === activeLayerId 
                                    ? `2px solid ${theme.palette.primary.main}` 
                                    : 'none'
                        }}
                    >
                        <Box display="flex" gap={1} alignItems="center">
                            <LayerPreview>
                                <LayerPreviewComponent 
                                    imageBitmap={layer.imageBitmap}
                                    name={layer.name}
                                />
                            </LayerPreview>
                            
                            <Box flex={1}>
                                <Typography variant="subtitle2">
                                    {layer.name || `Слой ${index + 1}`}
                                </Typography>
                                
                                <LayerControls>
                                    <IconButton 
                                        size="small"
                                        onClick={handleVisibilityToggle(layer.id)}
                                    >
                                        {layer.visible ? 
                                            <VisibilityIcon /> : 
                                            <VisibilityOffIcon />
                                        }
                                    </IconButton>
                                    
                                    <IconButton 
                                        size="small"
                                        onClick={handleRemoveLayer(layer.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                    
                                    {index > 0 && (
                                        <IconButton 
                                            size="small"
                                            onClick={moveLayer(index, 'up')}
                                        >
                                            <ArrowUpwardIcon />
                                        </IconButton>
                                    )}
                                    
                                    {index < layers.length - 1 && (
                                        <IconButton 
                                            size="small"
                                            onClick={moveLayer(index, 'down')}
                                        >
                                            <ArrowDownwardIcon />
                                        </IconButton>
                                    )}
                                </LayerControls>
                            </Box>
                        </Box>

                        <Box px={1}>
                            <Typography variant="caption">Непрозрачность</Typography>
                            <Slider
                                size="small"
                                value={layer.opacity * 100}
                                onChange={handleOpacityChange(layer.id)}
                                aria-label="Непрозрачность"
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Box px={1}>
                            <Tooltip title="Выберите режим наложения слоя">
                                <Select
                                    size="small"
                                    fullWidth
                                    value={layer.blendMode}
                                    onChange={handleBlendModeChange(layer.id)}
                                >
                                    {blendModes.map(mode => (
                                        <MenuItem key={mode.value} value={mode.value}>
                                            <Tooltip 
                                                title={mode.description}
                                                placement="right"
                                            >
                                                <span>{mode.label}</span>
                                            </Tooltip>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Tooltip>
                        </Box>

                        <Divider sx={{ my: 1 }} />
                        
                        <Box px={1}>
                            <Typography variant="caption" display="block" gutterBottom>
                                Альфа-канал
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Tooltip title={layer.hasAlpha ? "Показать/скрыть альфа-канал" : "Слой не имеет альфа-канала"}>
                                    <span>
                                        <Switch
                                            size="small"
                                            checked={layer.alphaVisible}
                                            onChange={(e) => handleAlphaVisibilityToggle(layer.id)(e as any)}
                                            disabled={!layer.hasAlpha}
                                        />
                                    </span>
                                </Tooltip>
                                <Tooltip title={layer.hasAlpha ? "Удалить альфа-канал" : "Слой не имеет альфа-канала"}>
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={handleRemoveAlpha(layer.id)}
                                            disabled={!layer.hasAlpha}
                                        >
                                            <LayersIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        </Box>
                    </LayerItem>
                ))}
            </LayerList>
        </LayerPanelContainer>
    );
}

export default LayerPanel; 