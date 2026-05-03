import { prisma } from '@/lib/prisma';

export interface ReferenceConfig {
  type: string;
  name: string;
  modelName: string;
  icon?: string;
}

class ReferenceRegistry {
  private references = new Map<string, ReferenceConfig>();

  register(config: ReferenceConfig): void {
    if (this.references.has(config.type)) {
      console.warn(`[ReferenceRegistry] Reference type "${config.type}" already registered, overwriting`);
    }
    this.references.set(config.type, config);
  }

  get(type: string): ReferenceConfig | undefined {
    return this.references.get(type);
  }

  getAll(): ReferenceConfig[] {
    return Array.from(this.references.values());
  }

  async getItems(type: string): Promise<Array<{ id: string; name: string }>> {
    const config = this.get(type);
    if (!config) {
      throw new Error(`Unknown reference type: ${type}`);
    }

    switch (type) {
      case 'POST':
        return prisma.postType.findMany({ 
          where: { active: true }, 
          select: { id: true, name: true }, 
          orderBy: { name: 'asc' } 
        });
      case 'LAG':
        return prisma.lagType.findMany({ 
          where: { active: true }, 
          select: { id: true, name: true }, 
          orderBy: { name: 'asc' } 
        });
      case 'PROFNASTIL':
        return prisma.profnastilType.findMany({ 
          where: { active: true }, 
          select: { id: true, name: true }, 
          orderBy: { name: 'asc' } 
        });
      case 'PICKET':
        return prisma.picketType.findMany({ 
          where: { active: true }, 
          select: { id: true, name: true }, 
          orderBy: { name: 'asc' } 
        });
      case 'GATE':
        return prisma.gateType.findMany({ 
          where: { active: true }, 
          select: { id: true, name: true }, 
          orderBy: { name: 'asc' } 
        });
      case 'WICKET':
        return prisma.wicketType.findMany({
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
      case 'PANEL_3D':
        return prisma.panel3D.findMany({
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
      case 'MESH':
        return prisma.meshType.findMany({
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
      case 'AUTOMATION':
        return prisma.automationType.findMany({
          where: { active: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
      default:
        throw new Error(`Unknown reference type: ${type}`);
    }
  }

  async validate(type: string, id: string): Promise<boolean> {
    const config = this.get(type);
    if (!config) {
      return false;
    }

    try {
      switch (type) {
        case 'POST':
          const post = await prisma.postType.findUnique({ where: { id } });
          return post !== null;
        case 'LAG':
          const lag = await prisma.lagType.findUnique({ where: { id } });
          return lag !== null;
        case 'PROFNASTIL':
          const prof = await prisma.profnastilType.findUnique({ where: { id } });
          return prof !== null;
        case 'PICKET':
          const picket = await prisma.picketType.findUnique({ where: { id } });
          return picket !== null;
        case 'GATE':
          const gate = await prisma.gateType.findUnique({ where: { id } });
          return gate !== null;
        case 'WICKET':
          const wicket = await prisma.wicketType.findUnique({ where: { id } });
          return wicket !== null;
        case 'PANEL_3D':
          const panel3d = await prisma.panel3D.findUnique({ where: { id } });
          return panel3d !== null;
        case 'MESH':
          const mesh = await prisma.meshType.findUnique({ where: { id } });
          return mesh !== null;
        case 'AUTOMATION':
          const automation = await prisma.automationType.findUnique({ where: { id } });
          return automation !== null;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  async getItemName(type: string, id: string): Promise<string> {
    const config = this.get(type);
    if (!config) {
      return 'Неизвестно';
    }

    try {
      switch (type) {
        case 'POST':
          const post = await prisma.postType.findUnique({ where: { id }, select: { name: true } });
          return post?.name || 'Неизвестно';
        case 'LAG':
          const lag = await prisma.lagType.findUnique({ where: { id }, select: { name: true } });
          return lag?.name || 'Неизвестно';
        case 'PROFNASTIL':
          const prof = await prisma.profnastilType.findUnique({ where: { id }, select: { name: true } });
          return prof?.name || 'Неизвестно';
        case 'PICKET':
          const picket = await prisma.picketType.findUnique({ where: { id }, select: { name: true } });
          return picket?.name || 'Неизвестно';
        case 'GATE':
          const gate = await prisma.gateType.findUnique({ where: { id }, select: { name: true } });
          return gate?.name || 'Неизвестно';
        case 'WICKET':
          const wicket = await prisma.wicketType.findUnique({ where: { id }, select: { name: true } });
          return wicket?.name || 'Неизвестно';
        case 'PANEL_3D':
          const panel3d = await prisma.panel3D.findUnique({ where: { id }, select: { name: true } });
          return panel3d?.name || 'Неизвестно';
        case 'MESH':
          const mesh = await prisma.meshType.findUnique({ where: { id }, select: { name: true } });
          return mesh?.name || 'Неизвестно';
        case 'AUTOMATION':
          const automation = await prisma.automationType.findUnique({ where: { id }, select: { name: true } });
          return automation?.name || 'Неизвестно';
        default:
          return 'Неизвестно';
      }
    } catch {
      return 'Неизвестно';
    }
  }
}

export const referenceRegistry = new ReferenceRegistry();

referenceRegistry.register({
  type: 'POST',
  name: 'Столбы',
  modelName: 'PostType',
});

referenceRegistry.register({
  type: 'LAG',
  name: 'Лаги',
  modelName: 'LagType',
});

referenceRegistry.register({
  type: 'PROFNASTIL',
  name: 'Профнастил',
  modelName: 'ProfnastilType',
});

referenceRegistry.register({
  type: 'PICKET',
  name: 'Евроштакетник',
  modelName: 'PicketType',
});

referenceRegistry.register({
  type: 'GATE',
  name: 'Ворота',
  modelName: 'GateType',
});

referenceRegistry.register({
  type: 'WICKET',
  name: 'Калитки',
  modelName: 'WicketType',
});

referenceRegistry.register({
  type: 'PANEL_3D',
  name: '3D-панели',
  modelName: 'Panel3D',
});

referenceRegistry.register({
  type: 'MESH',
  name: 'Сетка-рабица',
  modelName: 'MeshType',
});

referenceRegistry.register({
  type: 'AUTOMATION',
  name: 'Автоматика',
  modelName: 'AutomationType',
});
