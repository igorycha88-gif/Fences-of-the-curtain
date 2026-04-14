import { calculateTrussGeometry } from '@/services/truss/trussGeometry';
import { TrussGeometryResult, TrussMember } from '@/services/truss/types';

describe('trussGeometry', () => {
  describe('cutAngles', () => {
    it('adds cutAngles to every member for SINGLE_SLOPE', () => {
      const result = calculateTrussGeometry('SINGLE_SLOPE', 6000, 3000, 2500);
      for (const member of result.members) {
        expect(member.cutAngles).toBeDefined();
        expect(member.cutAngles!.bottomCutAngle).toBeGreaterThan(0);
        expect(member.cutAngles!.topCutAngle).toBeGreaterThan(0);
      }
    });

    it('adds cutAngles to every member for DOUBLE_SLOPE', () => {
      const result = calculateTrussGeometry('DOUBLE_SLOPE', 6000, 3000);
      for (const member of result.members) {
        expect(member.cutAngles).toBeDefined();
      }
    });

    it('adds cutAngles to every member for ARCH', () => {
      const result = calculateTrussGeometry('ARCH', 6000, 3000);
      for (const member of result.members) {
        expect(member.cutAngles).toBeDefined();
      }
    });

    it('adds cutAngles to every member for SINGLE_SLOPE_CURVED', () => {
      const result = calculateTrussGeometry('SINGLE_SLOPE_CURVED', 6000, 3000, 2500);
      for (const member of result.members) {
        expect(member.cutAngles).toBeDefined();
      }
    });

    it('vertical posts have bottomCutAngle = 90 for SINGLE_SLOPE', () => {
      const result = calculateTrussGeometry('SINGLE_SLOPE', 6000, 3000, 2500);
      const verticals = result.members.filter(m => m.type === 'vertical');
      for (const v of verticals) {
        expect(v.cutAngles!.bottomCutAngle).toBe(90);
      }
    });

    it('vertical posts have bottomCutAngle = 90 for ARCH', () => {
      const result = calculateTrussGeometry('ARCH', 6000, 3000);
      const verticals = result.members.filter(m => m.type === 'vertical');
      for (const v of verticals) {
        expect(v.cutAngles!.bottomCutAngle).toBe(90);
      }
    });

    it('arch topCutAngle varies for vertical posts', () => {
      const result = calculateTrussGeometry('ARCH', 6000, 2000);
      const verticals = result.members.filter(m => m.type === 'vertical');
      const topAngles = verticals.map(v => v.cutAngles!.topCutAngle);
      const allSame = topAngles.every(a => a === topAngles[0]);
      expect(allSame).toBe(false);
    });
  });

  describe('diagonal handling', () => {
    it('removes diagonals with angle < 5 degrees to chord', () => {
      const result = calculateTrussGeometry('ARCH', 6000, 3000);
      const diags = result.members.filter(m => m.type === 'diagonal');
      for (const d of diags) {
        if (d.diagonalAngles) {
          expect(d.diagonalAngles.angleToTopChord).toBeGreaterThanOrEqual(5);
          expect(d.diagonalAngles.angleToBottomChord).toBeGreaterThanOrEqual(5);
        }
      }
    });

    it('no parallel diagonals for SINGLE_SLOPE', () => {
      const result = calculateTrussGeometry('SINGLE_SLOPE', 6000, 3000, 2500);
      const diags = result.members.filter(m => m.type === 'diagonal');
      for (const d of diags) {
        if (d.diagonalAngles) {
          expect(d.diagonalAngles.angleToTopChord).toBeGreaterThanOrEqual(5);
        }
      }
    });
  });

  describe('symmetry for DOUBLE_SLOPE', () => {
    it('has symmetric diagonals for DOUBLE_SLOPE', () => {
      const result = calculateTrussGeometry('DOUBLE_SLOPE', 6000, 3000);
      const diags = result.members.filter(m => m.type === 'diagonal');
      expect(diags.length).toBeGreaterThan(0);

      const leftDiags = diags.filter(d => {
        const startNode = result.nodes.find(n => n.id === d.startNodeId)!;
        const endNode = result.nodes.find(n => n.id === d.endNodeId)!;
        const avgX = (startNode.x + endNode.x) / 2;
        return avgX < result.span / 2;
      });
      const rightDiags = diags.filter(d => {
        const startNode = result.nodes.find(n => n.id === d.startNodeId)!;
        const endNode = result.nodes.find(n => n.id === d.endNodeId)!;
        const avgX = (startNode.x + endNode.x) / 2;
        return avgX > result.span / 2;
      });

      expect(leftDiags.length).toBe(rightDiags.length);
    });
  });

  describe('symmetry for ARCH', () => {
    it('has symmetric diagonals for ARCH', () => {
      const result = calculateTrussGeometry('ARCH', 6000, 3000);
      const diags = result.members.filter(m => m.type === 'diagonal');

      const leftDiags = diags.filter(d => {
        const startNode = result.nodes.find(n => n.id === d.startNodeId)!;
        const endNode = result.nodes.find(n => n.id === d.endNodeId)!;
        const avgX = (startNode.x + endNode.x) / 2;
        return avgX < result.span / 2;
      });
      const rightDiags = diags.filter(d => {
        const startNode = result.nodes.find(n => n.id === d.startNodeId)!;
        const endNode = result.nodes.find(n => n.id === d.endNodeId)!;
        const avgX = (startNode.x + endNode.x) / 2;
        return avgX > result.span / 2;
      });

      expect(leftDiags.length).toBe(rightDiags.length);
    });
  });

  describe('archProfileBendLength', () => {
    it('calculates archProfileBendLength for ARCH', () => {
      const result = calculateTrussGeometry('ARCH', 6000, 3000);
      expect(result.archProfileBendLength).toBeDefined();
      expect(result.archProfileBendLength).toBeGreaterThan(6000);
    });

    it('calculates archProfileBendLength for SINGLE_SLOPE_CURVED', () => {
      const result = calculateTrussGeometry('SINGLE_SLOPE_CURVED', 6000, 3000, 2500);
      expect(result.archProfileBendLength).toBeDefined();
      expect(result.archProfileBendLength).toBeGreaterThan(6000);
    });

    it('does not set archProfileBendLength for SINGLE_SLOPE', () => {
      const result = calculateTrussGeometry('SINGLE_SLOPE', 6000, 3000, 2500);
      expect(result.archProfileBendLength).toBeUndefined();
    });

    it('archProfileBendLength for ARCH is reasonable', () => {
      const result = calculateTrussGeometry('ARCH', 6000, 3000);
      if (result.archProfileBendLength) {
        expect(result.archProfileBendLength).toBeLessThan(10000);
      }
    });
  });

  describe('basic geometry integrity', () => {
    it('produces members for all types', () => {
      const types: Array<{ type: 'SINGLE_SLOPE' | 'DOUBLE_SLOPE' | 'ARCH' | 'SINGLE_SLOPE_CURVED'; args: number[] }> = [
        { type: 'SINGLE_SLOPE', args: [6000, 3000, 2500] },
        { type: 'DOUBLE_SLOPE', args: [6000, 3000] },
        { type: 'ARCH', args: [6000, 3000] },
        { type: 'SINGLE_SLOPE_CURVED', args: [6000, 3000, 2500] },
      ];
      for (const { type, args } of types) {
        const result = calculateTrussGeometry(type, args[0], args[1], args[2]);
        expect(result.members.length).toBeGreaterThan(0);
        expect(result.nodes.length).toBeGreaterThan(0);
        expect(result.span).toBe(args[0]);
        expect(result.ridgeHeight).toBe(args[1]);
      }
    });
  });
});
