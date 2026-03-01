interface PostOfficeLocation {
  label: string;
  coords: { x: number; y: number; z: number };
}

const PostOffices: PostOfficeLocation[] = [
  { label: 'Valentine', coords: { x: -178.005, y: 628.197, z: 114.089 } },
  { label: 'Annesburg', coords: { x: 2938.942, y: 1287.05, z: 44.652 } },
  { label: 'Strawberry', coords: { x: -1766.097778, y: -380.338593, z: 157.730972 } },
  { label: 'Blackwater', coords: { x: -875.048462, y: -1327.106567, z: 43.968349 } },
  { label: 'Armadillo', coords: { x: -3728.887695, y: -2601.34375, z: -12.937711 } },
  { label: 'Rhodes', coords: { x: 1226.739258, y: -1295.119385, z: 76.905342 } },
  { label: 'Saint Denis', coords: { x: 2748.734619, y: -1398.215698, z: 46.183098 } },
  { label: 'Wallace Station', coords: { x: -1299.940796, y: 400.828827, z: 95.452156 } },
  { label: 'Riggs Station', coords: { x: -1093.01709, y: -575.913635, z: 82.413719 } },
  { label: 'Emerald Station', coords: { x: 1521.897095, y: 441.203949, z: 90.67852 } },
  { label: 'Benedict Point', coords: { x: -5227.518555, y: -3469.036377, z: -20.569662 } },
];

export const findNearestPostOffice = (x: number, y: number): PostOfficeLocation => {
  let nearest = PostOffices[0];
  let minDist = Infinity;

  for (const po of PostOffices) {
    const dx = po.coords.x - x;
    const dy = po.coords.y - y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearest = po;
    }
  }

  return nearest;
};

export default PostOffices;
export type { PostOfficeLocation };
