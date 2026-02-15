/**
 * Grid Visualization Component for RedM Client
 * Add this to your client.ts file for visual debugging
 */

import { WeatherType, BiomeType } from '../shared/biome';
import { BiomeWeatherGrid } from '../shared/grid';
import { Log, awaitUI } from '@lib/client/comms/ui';

// Grid visualization state
let showGridOverlay: boolean = false;
let showCellInfo: boolean = true;
let showBiomeColors: boolean = false;
let gridVisualizationHeight: number = 300.0; // Z height for drawing

// Create a local grid instance for visualization
// This should sync with server data in production
const visualGrid = new BiomeWeatherGrid(8, 8);

/**
 * Weather type to color mapping (RGB)
 */
// const weatherColors: Record<WeatherType, [number, number, number]> = {
// //   [WeatherType.CLEAR]: [255, 255, 0],        // Yellow
//   [WeatherType.CLOUDS]: [200, 200, 200],     // Light gray
//   [WeatherType.OVERCAST]: [128, 128, 128],   // Gray
//   [WeatherType.RAIN]: [0, 100, 255],         // Blue
//   [WeatherType.THUNDER]: [138, 43, 226],     // Purple
//   [WeatherType.SNOW]: [255, 255, 255],       // White
//   [WeatherType.BLIZZARD]: [200, 220, 255],   // Ice blue
//   [WeatherType.FOG]: [150, 150, 150],        // Foggy gray
//   [WeatherType.DRIZZLE]: [100, 150, 255],    // Light blue
//   [WeatherType.SUNNY]: [255, 200, 100],   // Orange
//   [WeatherType.SNOWLIGHT]: [240, 240, 255],  // Very light blue
//   [WeatherType.HIGHPRESSURE]: [255, 200, 0]  // Orange-yellow
// };

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
 * Toggle cell info display
 */
RegisterCommand('togglecellinfo', () => {
  showCellInfo = !showCellInfo;
  
  emit('chat:addMessage', {
    args: ['Grid Debug', `Cell info ${showCellInfo ? 'enabled' : 'disabled'}`]
  });
}, false);

/**
 * Toggle between weather and biome colors
 */
RegisterCommand('togglebiomecolors', () => {
  showBiomeColors = !showBiomeColors;
  
  emit('chat:addMessage', {
    args: ['Grid Debug', `Showing ${showBiomeColors ? 'biome' : 'weather'} colors`]
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

function txtAtWorldCoord(x: number, y: number, z: number, text: string, size: number, font: number, alpha: number = 255) {
    const [s, sx, sy] = GetScreenCoordFromWorldCoord(x, y, z)
    if ((sx > 0 && sx < 1) || (sy > 0 && sy < 1)) {
        const [s, sx, sy] = GetHudScreenPositionFromWorldPosition(x, y, z)
        drawText(text, sx, sy, size, true, 255, 255, 255, alpha, true, font)
    }
}

function drawText(str: string, x: number, y: number,size: number, shadow: boolean, r: number, g: number, b: number, a: number, centre: boolean, font: number) {
    const s = CreateVarString(10, "LITERAL_STRING", str)
    SetTextScale(1, size)
    SetTextColor(Math.floor(r), Math.floor(g), Math.floor(b), Math.floor(a))
    SetTextCentre(centre)
    if (shadow) {
        SetTextDropshadow(1, 0, 0, 0, 255)
    }
    SetTextFontForCurrentCommand(font)
    DisplayText(str, x, y)
}


// function TxtAtWorldCoord(x, y, z, txt, size, font, alpha)
//     alpha = alpha or 255
//     local s, sx, sy = GetScreenCoordFromWorldCoord(x, y ,z)
//     if (sx > 0 and sx < 1) or (sy > 0 and sy < 1) then
//         local s, sx, sy = GetHudScreenPositionFromWorldPosition(x, y, z)
//         DrawTxt(txt, sx, sy, size, true, 255, 255, 255, alpha, true, font) -- Font 2 has some symbol conversions ex. @ becomes the rockstar logo
//     end
// end

// function DrawTxt(str, x, y, size, enableShadow, r, g, b, a, centre, font)
//     local str = CreateVarString(10, "LITERAL_STRING", str)
//     SetTextScale(1, size)
//     SetTextColor(math.floor(r), math.floor(g), math.floor(b), math.floor(a))
//     SetTextCentre(centre)
//     if enableShadow then SetTextDropshadow(1, 0, 0, 0, 255) end
//     SetTextFontForCurrentCommand(font)
//     DisplayText(str, x, y)
// end

/**
 * Draw grid overlay thread
 */
setTick(() => {
  if (!showGridOverlay) return;
  
  const allCells = visualGrid.getAllCellBounds();
  const playerPed = PlayerPedId();
  const playerCoords = GetEntityCoords(playerPed, false);
  const [playerX, playerY, playerZ] = playerCoords;
  
  // Get player's current grid cell
  const playerGridPos = visualGrid.worldToGrid(playerX, playerY);
  
  allCells.forEach(cell => {
    const corners = visualGrid.getCellCorners(cell.gridX, cell.gridY);
    
    if (!corners) return;
    
    // Use configured height or player Z + offset
    const z = gridVisualizationHeight;
    
    // Determine color based on mode
    let color: [number, number, number];
    if (showBiomeColors) {
      color = biomeColors[cell.biome] || [255, 255, 255];
    } else {
    //   color = weatherColors[cell.weather] || [255, 255, 255];
        color = biomeColors[cell.biome] || [255, 255, 255];
    }
    
    const [r, g, b] = color;
    
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
    
    txtAtWorldCoord(cell.centerX, cell.centerY, z, cell.biome.toString(), 15, 9, 255)
  });
});

/**
 * Draw cell info for player's current cell
 */
setTick(() => {
  if (!showGridOverlay || !showCellInfo) return;
  
  const playerPed = PlayerPedId();
  const playerCoords = GetEntityCoords(playerPed, false);
  const [x, y] = playerCoords;
  
  // Get player's grid position
  const gridPos = visualGrid.worldToGrid(x, y);
  const cellBounds = visualGrid.getCellBounds(gridPos.x, gridPos.y);
  const cell = visualGrid.getCellAtPosition(x, y);
  
  if (!cellBounds) return;
  
  // Draw info panel background
  DrawRect(0.15, 0.15, 0.25, 0.12, 0, 0, 0, 180);
  
  // Set text properties
  SetTextScale(0.35, 0.35);
  SetTextColor(255, 255, 255, 255);
  SetTextCentre(false);
  SetTextDropshadow(1, 0, 0, 0, 255);
//   SetTextEdge(1, 0, 0, 0, 255);
  
//   // Grid position
//   BeginTextCommandDisplayText('STRING');
//   AddTextComponentSubstringPlayerName(`~b~Grid Position:~w~ (${gridPos.x}, ${gridPos.y})`);
//   EndTextCommandDisplayText(0.03, 0.095);
  
//   // Weather
//   const weatherColor = showBiomeColors ? '~w~' : '~y~';
//   BeginTextCommandDisplayText('STRING');
//   AddTextComponentSubstringPlayerName(`~b~Weather:~w~ ${weatherColor}${cell.weather}`);
//   EndTextCommandDisplayText(0.03, 0.12);
  
//   // Biome
//   const biomeColor = showBiomeColors ? '~y~' : '~w~';
//   BeginTextCommandDisplayText('STRING');
//   AddTextComponentSubstringPlayerName(`~b~Biome:~w~ ${biomeColor}${cell.biome}`);
//   EndTextCommandDisplayText(0.03, 0.145);
  
//   // Cell bounds
//   BeginTextCommandDisplayText('STRING');
//   AddTextComponentSubstringPlayerName(
//     `~b~Bounds:~w~ X[${cellBounds.minX.toFixed(0)}, ${cellBounds.maxX.toFixed(0)}] ` +
//     `Y[${cellBounds.minY.toFixed(0)}, ${cellBounds.maxY.toFixed(0)}]`
//   );
//   EndTextCommandDisplayText(0.03, 0.17);
  
//   // Cell size
//   const dims = visualGrid.getCellDimensions();
//   BeginTextCommandDisplayText('STRING');
//   AddTextComponentSubstringPlayerName(
//     `~b~Cell Size:~w~ ${dims.cellWidth.toFixed(0)}x${dims.cellHeight.toFixed(0)}`
//   );
//   EndTextCommandDisplayText(0.03, 0.195);
});

/**
 * Draw legend
 */
// setTick(() => {
//   if (!showGridOverlay) return;
  
//   // Draw legend background
//   const legendY = 0.4;
//   const legendHeight = showBiomeColors ? 0.35 : 0.25;
//   DrawRect(0.88, legendY, 0.2, legendHeight, 0, 0, 0, 180);
  
//   SetTextScale(0.3, 0.3);
//   SetTextColor(255, 255, 255, 255);
//   SetTextCentre(false);
  
//   // Title
//   BeginTextCommandDisplayText('STRING');
//   AddTextComponentSubstringPlayerName(
//     `~b~${showBiomeColors ? 'Biome' : 'Weather'} Legend`
//   );
//   EndTextCommandDisplayText(0.79, legendY - 0.15);
  
//   // Draw color samples
//   const colorMap = showBiomeColors ? biomeColors : weatherColors;
//   const entries = Object.entries(colorMap);
  
//   entries.slice(0, 10).forEach(([type, [r, g, b]], index) => {
//     const yOffset = legendY - 0.13 + (index * 0.025);
    
//     // Color box
//     DrawRect(0.805, yOffset, 0.015, 0.02, r, g, b, 200);
    
//     // Label
//     BeginTextCommandDisplayText('STRING');
//     const label = type.length > 12 ? type.substring(0, 12) : type;
//     AddTextComponentSubstringPlayerName(`~w~${label}`);
//     EndTextCommandDisplayText(0.815, yOffset - 0.008);
//   });
  
//   // Commands help
//   const helpY = 0.85;
//   DrawRect(0.88, helpY, 0.2, 0.12, 0, 0, 0, 180);
  
//   SetTextScale(0.25, 0.25);
//   BeginTextCommandDisplayText('STRING');
//   AddTextComponentSubstringPlayerName('~b~Commands:');
//   EndTextCommandDisplayText(0.79, helpY - 0.055);
  
//   const commands = [
//     '/togglegrid - Toggle overlay',
//     '/togglecellinfo - Toggle info',
//     '/togglebiomecolors - Switch colors',
//     '/gridheight <z> - Set height'
//   ];
  
//   commands.forEach((cmd, index) => {
//     BeginTextCommandDisplayText('STRING');
//     AddTextComponentSubstringPlayerName(`~w~${cmd}`);
//     EndTextCommandDisplayText(0.79, helpY - 0.035 + (index * 0.02));
//   });
// });

/**
 * Initialize visualization (call this in main client script)
 */
export function initializeGridVisualization(): void {
  // Generate initial weather pattern
  visualGrid.generateBiomeAwareWeather();
  
  console.log('Grid visualization initialized');
  console.log('Commands:');
  console.log('  /togglegrid - Toggle grid overlay');
  console.log('  /togglecellinfo - Toggle cell info panel');
  console.log('  /togglebiomecolors - Switch between weather/biome colors');
  console.log('  /gridheight <z> - Set visualization height');
}

/**
 * Update grid from server data
 */
export function updateVisualizationGrid(gridData: any[]): void {
  // Update local visualization grid with server data
  // This ensures the visual representation matches the server's weather state
  console.log(`Updated visualization grid with ${gridData.length} cells`);
}

// Auto-initialize
setTimeout(() => {
  initializeGridVisualization();
}, 1000);