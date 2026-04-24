import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockJsPDF = {
  setFontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  setFillColor: jest.fn().mockReturnThis(),
  rect: jest.fn().mockReturnThis(),
  setTextColor: jest.fn().mockReturnThis(),
  output: jest.fn().mockReturnValue(new Blob(['pdf'], { type: 'application/pdf' })),
};

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockJsPDF),
}));

describe('pdf/generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('generatePDF — fence type', () => {
    it('should generate PDF for fence estimate', async () => {
      const { generatePDF } = await import('@/services/pdf/generator');

      const result = await generatePDF({
        type: 'fence',
        parameters: {
          length: 30,
          height: 2,
          fenceType: 'Профнастил',
          lagRows: 2,
        },
        result: {
          materials: [
            { name: 'Профнастил', quantity: 60, unit: 'м²', pricePerUnit: 450, total: 27000 },
          ],
          works: [
            { name: 'Монтаж', quantity: 30, unit: 'м.п.', pricePerUnit: 800, total: 24000 },
          ],
          materialsTotal: 27000,
          worksTotal: 24000,
          grandTotal: 51000,
        },
      });

      expect(result).toBeInstanceOf(Blob);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Расчет забора', 20, 20);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Длина: 30 м', expect.any(Number), expect.any(Number));
      expect(mockJsPDF.text).toHaveBeenCalledWith('Высота: 2 м', expect.any(Number), expect.any(Number));
      expect(mockJsPDF.text).toHaveBeenCalledWith('Тип забора: Профнастил', expect.any(Number), expect.any(Number));
      expect(mockJsPDF.text).toHaveBeenCalledWith('Количество лаг: 2', expect.any(Number), expect.any(Number));
    });
  });

  describe('generatePDF — canopy type', () => {
    it('should generate PDF for canopy estimate', async () => {
      const { generatePDF } = await import('@/services/pdf/generator');

      await generatePDF({
        type: 'canopy',
        parameters: {
          length: 6,
          width: 3,
          height: 2.5,
          canopyType: 'Односкатный',
        },
        result: {
          materials: [
            { name: 'Поликарбонат', quantity: 18, unit: 'м²', pricePerUnit: 800, total: 14400 },
          ],
          works: [
            { name: 'Монтаж навеса', quantity: 18, unit: 'м²', pricePerUnit: 1500, total: 27000 },
          ],
          materialsTotal: 14400,
          worksTotal: 27000,
          grandTotal: 41400,
        },
      });

      expect(mockJsPDF.text).toHaveBeenCalledWith('Расчет навеса', 20, 20);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Ширина: 3 м', expect.any(Number), expect.any(Number));
      expect(mockJsPDF.text).toHaveBeenCalledWith('Тип навеса: Односкатный', expect.any(Number), expect.any(Number));
    });
  });

  describe('generatePDF — totals', () => {
    it('should render grand total with background rect', async () => {
      const { generatePDF } = await import('@/services/pdf/generator');

      await generatePDF({
        type: 'fence',
        parameters: {
          length: 10,
          height: 2,
          fenceType: 'Test',
          lagRows: 2,
        },
        result: {
          materials: [],
          works: [],
          materialsTotal: 1000,
          worksTotal: 500,
          grandTotal: 1500,
        },
      });

      expect(mockJsPDF.setFillColor).toHaveBeenCalled();
      expect(mockJsPDF.rect).toHaveBeenCalled();
      expect(mockJsPDF.output).toHaveBeenCalled();
    });
  });
});
