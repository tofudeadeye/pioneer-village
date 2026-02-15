import weatherManager from './managers/weather';
import { BiomeType } from '../shared/biome';

// Grid visualization state
let showGridOverlay: boolean = false;
let gridVisualizationHeight: number = 300.0; // Z height for drawing

/**
 * Biome type to color mapping (RGB)
 */
const biomeColors: Record<BiomeType, [number, number, number]> = {
  [BiomeType.GRIZZLIES]: [255, 255, 255],    // White (snowy)
  [BiomeType.TALL_TREES]: [34, 139, 34],     // Forest green
  [BiomeType.BIG_VALLEY]: [144, 238, 144],   // Light green
  [BiomeType.HEARTLANDS]: [255, 215, 0],     // Gold
  [BiomeType.GREAT_PLAINS]: [210, 180, 140], // Tan
  [BiomeType.BAYOU]: [85, 107, 47],          // Dark olive
  [BiomeType.LEMOYNE]: [154, 205, 50],       // Yellow-green
  [BiomeType.NEW_AUSTIN]: [244, 164, 96],    // Sandy brown
  [BiomeType.RIO_BRAVO]: [210, 105, 30],     // Chocolate brown
  [BiomeType.ROANOKE]: [107, 142, 35],       // Olive green
  [BiomeType.CUMBERLAND]: [46, 139, 87],     // Sea green
  [BiomeType.SCARLETT]: [152, 251, 152],     // Pale green
};

/**
 * Toggle grid overlay command
 */
RegisterCommand('togglegrid', () => {
  showGridOverlay = !showGridOverlay;
  
  emit('chat:addMessage', {
    args: ['Grid Debug', `Grid overlay ${showGridOverlay ? 'enabled' : 'disabled'}`]
  });
}, false);

/**
 * Set grid visualization height
 */
RegisterCommand('gridheight', (source: number, args: string[]) => {
  const height = parseFloat(args[0]);
  
  if (!isNaN(height)) {
    gridVisualizationHeight = height;
    emit('chat:addMessage', {
      args: ['Grid Debug', `Grid height set to ${height.toFixed(1)}`]
    });
  } else {
    emit('chat:addMessage', {
      args: ['Grid Debug', 'Usage: /gridheight <height>']
    });
  }
}, false);

/**
 * Draw a cell border
 */
function drawCellBorder(
  corners: {
    nw: { x: number; y: number };
    ne: { x: number; y: number };
    se: { x: number; y: number };
    sw: { x: number; y: number };
  },
  z: number,
  r: number,
  g: number,
  b: number,
  alpha: number = 200
): void {
  // Top edge (NW to NE)
  DrawLine(corners.nw.x, corners.nw.y, z, corners.ne.x, corners.ne.y, z, r, g, b, alpha);
  // Right edge (NE to SE)
  DrawLine(corners.ne.x, corners.ne.y, z, corners.se.x, corners.se.y, z, r, g, b, alpha);
  // Bottom edge (SE to SW)
  DrawLine(corners.se.x, corners.se.y, z, corners.sw.x, corners.sw.y, z, r, g, b, alpha);
  // Left edge (SW to NW)
  DrawLine(corners.sw.x, corners.sw.y, z, corners.nw.x, corners.nw.y, z, r, g, b, alpha);
}

/**
 * Draw grid overlay thread
 */
setTick(() => {
  if (!showGridOverlay) return;

  const grid = weatherManager.getWeatherGrid();
  const allCells = grid.getAllCellBounds();
  const playerPed = PlayerPedId();
  const playerCoords = GetEntityCoords(playerPed, false);
  const [playerX, playerY, playerZ] = playerCoords;
  
  // Get player's current grid cell
  const playerGridPos = grid.worldToGrid(playerX, playerY);
  
  allCells.forEach(cell => {
    const corners = grid.getCellCorners(cell.gridX, cell.gridY);
    if (!corners) return;

    const z = gridVisualizationHeight;
    const [r, g, b] = biomeColors[cell.biome] || [255, 255, 255];

    // Highlight player's current cell
    const isPlayerCell = cell.gridX === playerGridPos.x && cell.gridY === playerGridPos.y;
    const alpha = isPlayerCell ? 255 : 150;
    
    // Draw thicker border for player's cell
    if (isPlayerCell) {
      drawCellBorder(corners, z + 1, 255, 0, 0, 255); // Red highlight
      drawCellBorder(corners, z - 1, 255, 0, 0, 255);
    } else {
      drawCellBorder(corners, z, r, g, b, alpha);
    }
  });
});
