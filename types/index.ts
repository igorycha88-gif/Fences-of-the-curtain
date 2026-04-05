export interface FenceCalculatorInput {
  fenceType: 'PROFNASTIL' | 'SHAKHETNIK' | 'MESH' | 'PANELS_3D';
  length: number;
  height: number;
  postType: string;
  lagType: string;
  lagRows: 2 | 3;
  hasGate: boolean;
  gateType?: 'SWING' | 'SLIDING';
  gateWidth?: number;
  hasWicket: boolean;
  wicketWidth?: number;
  coating: 'GALVANIZED' | 'POLYMER_SINGLE' | 'POLYMER_DOUBLE';
  color?: string;
  region?: string;
}

export interface FenceCalculatorResult {
  materials: MaterialItem[];
  works: WorkItem[];
  materialsTotal: number;
  worksTotal: number;
  grandTotal: number;
}

export interface CanopyCalculatorInput {
  canopyType: 'single-slope' | 'double-slope' | 'arch';
  purpose: 'car-1' | 'car-2' | 'car-3' | 'gazebo' | 'terrace' | 'storage';
  length: number;
  width: number;
  height: number;
  frameMaterial: string;
  roofMaterial: string;
  installationType: 'ground' | 'wall' | 'base';
  hasWaterSystem: boolean;
}

export interface CanopyCalculatorResult {
  materials: MaterialItem[];
  works: WorkItem[];
  materialsTotal: number;
  worksTotal: number;
  grandTotal: number;
}

export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface WorkItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface OrderInput {
  clientName: string;
  phone: string;
  email?: string;
  serviceType: 'fence' | 'canopy';
  parameters: FenceCalculatorInput | CanopyCalculatorInput;
  calculatedCost: number;
}

export interface ContactFormInput {
  name: string;
  phone: string;
  email?: string;
  message: string;
}
