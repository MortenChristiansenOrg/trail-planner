export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type BoundingBox = {
  northEast: Coordinates;
  southWest: Coordinates;
};
