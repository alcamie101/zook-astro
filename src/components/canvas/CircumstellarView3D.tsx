import React from 'react';
import { StarSystem } from '../../types/astrophysics';
import { CircumstellarView3DR3F } from './r3f/CircumstellarView3DR3F';

export interface CircumstellarView3DProps {
  selectedStar: StarSystem | null;
  selectedPlanetIndex: number;
  onSelectPlanet: (index: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

/**
 * CircumstellarView3D - React Three Fiber (R3F) Implementation
 * High-performance declarative 3D viewport for host stars, planetary orbits,
 * procedural planet shaders, habitable zone rings, and camera tracking.
 */
export const CircumstellarView3D: React.FC<CircumstellarView3DProps> = (props) => {
  return <CircumstellarView3DR3F {...props} />;
};
