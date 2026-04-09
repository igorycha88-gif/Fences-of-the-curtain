import { describe, it, expect } from '@jest/globals';
import { generateEstimateWord, WordEstimateData } from '@/services/word/estimateWordGenerator';

const createSingleEstimateData = (): WordEstimateData => ({
  orderId: 'cltest12345678',
  clientName: 'Иванов Иван Иванович',
  createdAt: '2026-04-09T12:00:00.000Z',
  measurementAddress: 'г. Москва, ул. Ленина, д. 10',
  estimates: [
    {
      fenceTypeName: 'Профнастил',
      length: 50,
      height: 2,
      lagRows: 2,
      coatingLabel: 'Полимерное одностороннее',
      hasGate: true,
      gateTypeLabel: 'Откатные',
      gateLength: 4000,
      hasWicket: true,
      wicketWidth: 1000,
      materials: [
        { name: 'Профлист С-8 0.5мм', unit: 'м²', quantity: 100, pricePerUnit: 450, totalPrice: 45000 },
        { name: 'Столб 60x60 3м', unit: 'шт', quantity: 26, pricePerUnit: 1200, totalPrice: 31200 },
        { name: 'Лага 40x20 2м', unit: 'шт', quantity: 52, pricePerUnit: 350, totalPrice: 18200 },
      ],
      works: [
        { name: 'Установка забора', unit: 'м.п.', quantity: 50, pricePerUnit: 800, totalPrice: 40000 },
        { name: 'Установка ворот', unit: 'шт', quantity: 1, pricePerUnit: 15000, totalPrice: 15000 },
        { name: 'Установка калитки', unit: 'шт', quantity: 1, pricePerUnit: 5000, totalPrice: 5000 },
      ],
      materialsTotal: 94400,
      installationTotal: 60000,
      grandTotal: 154400,
    },
  ],
  totalMaterials: 94400,
  totalInstallation: 60000,
  grandTotal: 154400,
});

const createMultiEstimateData = (): WordEstimateData => ({
  orderId: 'cltest87654321',
  clientName: 'Петров Петр Петрович',
  createdAt: '2026-04-09T14:00:00.000Z',
  measurementAddress: null,
  estimates: [
    {
      fenceTypeName: 'Профнастил',
      length: 30,
      height: 2,
      lagRows: 2,
      coatingLabel: 'Оцинковка',
      hasGate: false,
      gateTypeLabel: null,
      gateLength: null,
      hasWicket: false,
      wicketWidth: null,
      materials: [
        { name: 'Профлист С-8 0.4мм', unit: 'м²', quantity: 60, pricePerUnit: 380, totalPrice: 22800 },
      ],
      works: [
        { name: 'Установка забора', unit: 'м.п.', quantity: 30, pricePerUnit: 700, totalPrice: 21000 },
      ],
      materialsTotal: 22800,
      installationTotal: 21000,
      grandTotal: 43800,
    },
    {
      fenceTypeName: 'Евроштакетник',
      length: 20,
      height: 1.5,
      lagRows: 2,
      coatingLabel: 'Полимерное двустороннее',
      hasGate: true,
      gateTypeLabel: 'Распашные',
      gateLength: 3500,
      hasWicket: false,
      wicketWidth: null,
      materials: [
        { name: 'Штакетник 100x20', unit: 'шт', quantity: 80, pricePerUnit: 250, totalPrice: 20000 },
      ],
      works: [
        { name: 'Установка забора', unit: 'м.п.', quantity: 20, pricePerUnit: 900, totalPrice: 18000 },
      ],
      materialsTotal: 20000,
      installationTotal: 18000,
      grandTotal: 38000,
    },
  ],
  totalMaterials: 42800,
  totalInstallation: 39000,
  grandTotal: 81800,
});

describe('estimateWordGenerator', () => {
  it('should generate a Buffer for single estimate', async () => {
    const data = createSingleEstimateData();
    const buffer = await generateEstimateWord(data);

    expect(buffer).toBeDefined();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate a Buffer for multi-estimate', async () => {
    const data = createMultiEstimateData();
    const buffer = await generateEstimateWord(data);

    expect(buffer).toBeDefined();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate valid ZIP-based docx (PK header)', async () => {
    const data = createSingleEstimateData();
    const buffer = await generateEstimateWord(data);

    const header = buffer.slice(0, 4).toString('hex');
    expect(header).toBe('504b0304');
  });

  it('should handle estimate without gate/wicket', async () => {
    const data: WordEstimateData = {
      orderId: 'cltest99999999',
      clientName: 'Сидоров',
      createdAt: '2026-04-09T10:00:00.000Z',
      measurementAddress: null,
      estimates: [
        {
          fenceTypeName: 'Сетка рабица',
          length: 100,
          height: 1.5,
          lagRows: 0,
          coatingLabel: 'Без покрытия',
          hasGate: false,
          gateTypeLabel: null,
          gateLength: null,
          hasWicket: false,
          wicketWidth: null,
          materials: [
            { name: 'Сетка рабица 1.5м', unit: 'м.п.', quantity: 100, pricePerUnit: 200, totalPrice: 20000 },
          ],
          works: [],
          materialsTotal: 20000,
          installationTotal: 0,
          grandTotal: 20000,
        },
      ],
      totalMaterials: 20000,
      totalInstallation: 0,
      grandTotal: 20000,
    };

    const buffer = await generateEstimateWord(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should handle estimate with no works', async () => {
    const data: WordEstimateData = {
      orderId: 'cltest00000001',
      clientName: 'Тестовый',
      createdAt: '2026-04-09T10:00:00.000Z',
      measurementAddress: 'г. Санкт-Петербург',
      estimates: [
        {
          fenceTypeName: '3D панель',
          length: 40,
          height: 1.53,
          lagRows: 2,
          coatingLabel: 'Полимерное одностороннее',
          hasGate: false,
          gateTypeLabel: null,
          gateLength: null,
          hasWicket: false,
          wicketWidth: null,
          materials: [
            { name: 'Панель 3D 2500x1530', unit: 'шт', quantity: 16, pricePerUnit: 1800, totalPrice: 28800 },
          ],
          works: [],
          materialsTotal: 28800,
          installationTotal: 0,
          grandTotal: 28800,
        },
      ],
      totalMaterials: 28800,
      totalInstallation: 0,
      grandTotal: 28800,
    };

    const buffer = await generateEstimateWord(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('should produce larger file for multi-estimate than single', async () => {
    const singleData = createSingleEstimateData();
    const multiData = createMultiEstimateData();

    const singleBuffer = await generateEstimateWord(singleData);
    const multiBuffer = await generateEstimateWord(multiData);

    expect(multiBuffer.length).toBeGreaterThan(singleBuffer.length);
  });
});
