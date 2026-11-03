import { describe, it, expect, jest } from '@jest/globals';
import JSZip from 'jszip';
import { generateEstimateWord, WordEstimateData } from '@/services/word/estimateWordGenerator';
import { LEGAL_REQUISITES, BUSINESS_INFO } from '@/lib/seo/constants';
import logger from '@/lib/logger';

const extractDocumentXml = async (buffer: Buffer): Promise<string> => {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('word/document.xml not found in docx');
  }
  return docFile.async('string');
};

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

describe('estimateWordGenerator requisites', () => {
  it('should render contractor short name in header instead of ООО', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createSingleEstimateData()));

    expect(xml).toContain(LEGAL_REQUISITES.shortName);
    expect(xml).not.toContain('ООО');
  });

  it('should include full requisites block after signatures (single estimate)', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createSingleEstimateData()));

    expect(xml).toContain('Реквизиты подрядчика');
    expect(xml).toContain(LEGAL_REQUISITES.fullName);
    expect(xml).toContain(`ИНН: ${LEGAL_REQUISITES.inn}`);
    expect(xml).toContain(`ОГРНИП: ${LEGAL_REQUISITES.ogrnip}`);
    expect(xml).toContain(`Тел.: ${BUSINESS_INFO.telephoneDisplay}`);
    expect(xml).toContain(`E-mail: ${BUSINESS_INFO.email}`);

    const signaturesPos = xml.indexOf('Подрядчик:');
    const requisitesPos = xml.indexOf('Реквизиты подрядчика');
    expect(signaturesPos).toBeGreaterThan(-1);
    expect(requisitesPos).toBeGreaterThan(signaturesPos);
  });

  it('should include requisites block for multi-estimate too', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createMultiEstimateData()));

    expect(xml).toContain(LEGAL_REQUISITES.shortName);
    expect(xml).toContain(`ИНН: ${LEGAL_REQUISITES.inn}`);
    expect(xml).toContain(`ОГРНИП: ${LEGAL_REQUISITES.ogrnip}`);
  });

  it('should not include bank details and legal address (short requisites set)', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createSingleEstimateData()));

    expect(xml).not.toContain(LEGAL_REQUISITES.bank.bik);
    expect(xml).not.toContain(LEGAL_REQUISITES.bank.checkingAccount);
    expect(xml).not.toContain(LEGAL_REQUISITES.bank.correspondentAccount);
    expect(xml).not.toContain(LEGAL_REQUISITES.bank.name);
    expect(xml).not.toContain(LEGAL_REQUISITES.legalAddress);
  });

  it('should log generation start and finish', async () => {
    const infoSpy = jest.spyOn(logger, 'info');

    await generateEstimateWord(createSingleEstimateData());

    expect(infoSpy).toHaveBeenCalledWith(
      'Word estimate generation started',
      expect.objectContaining({ module: 'estimateWordGenerator', orderId: 'cltest12345678' })
    );
    expect(infoSpy).toHaveBeenCalledWith(
      'Word estimate generation finished',
      expect.objectContaining({ module: 'estimateWordGenerator', orderId: 'cltest12345678' })
    );

    infoSpy.mockRestore();
  });
});

describe('estimateWordGenerator fence params', () => {
  const createPicketEstimateData = (): WordEstimateData => ({
    orderId: 'clpicket000001',
    clientName: 'Пикетов Пикет',
    createdAt: '2026-11-03T10:00:00.000Z',
    measurementAddress: null,
    estimates: [
      {
        fenceTypeName: 'Евроштакетник',
        length: 50,
        height: 2,
        lagRows: 2,
        coatingLabel: 'Полимерное одностороннее',
        picketMountingType: 'CHESS',
        picketStep: 5,
        picketProfileType: 'П-образный',
        picketCoatingName: null,
        meshCoating: null,
        meshCellSize: null,
        meshWireThickness: null,
        automationName: null,
        hasGate: false,
        gateTypeLabel: null,
        gateLength: null,
        hasWicket: false,
        wicketWidth: null,
        materials: [
          { name: 'Штакетник П-образный', unit: 'шт', quantity: 400, pricePerUnit: 120, totalPrice: 48000 },
        ],
        works: [
          { name: 'Установка забора', unit: 'м.п.', quantity: 50, pricePerUnit: 700, totalPrice: 35000 },
        ],
        materialsTotal: 48000,
        installationTotal: 35000,
        grandTotal: 83000,
      },
    ],
    totalMaterials: 48000,
    totalInstallation: 35000,
    grandTotal: 83000,
  });

  const createMeshEstimateData = (): WordEstimateData => ({
    orderId: 'clmesh00000001',
    clientName: 'Мешков Мешок',
    createdAt: '2026-11-03T11:00:00.000Z',
    measurementAddress: null,
    estimates: [
      {
        fenceTypeName: 'Сетка-рабица',
        length: 100,
        height: 1.5,
        lagRows: 0,
        coatingLabel: '',
        picketMountingType: null,
        picketStep: null,
        picketProfileType: null,
        picketCoatingName: null,
        meshCoating: 'Оцинковка',
        meshCellSize: 50,
        meshWireThickness: 2.5,
        automationName: null,
        hasGate: false,
        gateTypeLabel: null,
        gateLength: null,
        hasWicket: false,
        wicketWidth: null,
        materials: [
          { name: 'Сетка-рабица 50x2.5', unit: 'м.п.', quantity: 100, pricePerUnit: 210, totalPrice: 21000 },
        ],
        works: [
          { name: 'Установка забора', unit: 'м.п.', quantity: 100, pricePerUnit: 350, totalPrice: 35000 },
        ],
        materialsTotal: 21000,
        installationTotal: 35000,
        grandTotal: 56000,
      },
    ],
    totalMaterials: 21000,
    totalInstallation: 35000,
    grandTotal: 56000,
  });

  const createAutomationEstimateData = (): WordEstimateData => ({
    orderId: 'clauto00000001',
    clientName: 'Автоматов Автомат',
    createdAt: '2026-11-03T12:00:00.000Z',
    measurementAddress: null,
    estimates: [
      {
        fenceTypeName: 'Профнастил',
        length: 60,
        height: 2,
        lagRows: 2,
        coatingLabel: 'Полимерное одностороннее',
        picketMountingType: null,
        picketStep: null,
        picketProfileType: null,
        picketCoatingName: null,
        meshCoating: null,
        meshCellSize: null,
        meshWireThickness: null,
        automationName: 'Привод Doorhan SLIDE 350',
        hasGate: true,
        gateTypeLabel: 'Откатные',
        gateLength: 4000,
        hasWicket: false,
        wicketWidth: null,
        materials: [
          { name: 'Профлист С-8', unit: 'м²', quantity: 120, pricePerUnit: 450, totalPrice: 54000 },
        ],
        works: [
          { name: 'Установка забора', unit: 'м.п.', quantity: 60, pricePerUnit: 800, totalPrice: 48000 },
        ],
        materialsTotal: 54000,
        installationTotal: 48000,
        grandTotal: 102000,
      },
    ],
    totalMaterials: 54000,
    totalInstallation: 48000,
    grandTotal: 102000,
  });

  it('should render picket chess mounting type, step and profile', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createPicketEstimateData()));

    expect(xml).toContain('Монтаж: В шахматном порядке');
    expect(xml).toContain('Шаг: 5 см');
    expect(xml).toContain('Профиль: П-образный');
  });

  it('should render single-side picket mounting type label', async () => {
    const data = createPicketEstimateData();
    data.estimates[0].picketMountingType = 'SINGLE';

    const xml = await extractDocumentXml(await generateEstimateWord(data));

    expect(xml).toContain('Монтаж: Односторонний');
    expect(xml).toContain('Шаг: 5 см');
  });

  it('should render mesh coating, cell size and wire thickness instead of lags', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createMeshEstimateData()));

    expect(xml).toContain('Покрытие сетки: Оцинковка');
    expect(xml).toContain('Ячейка: 50 мм');
    expect(xml).toContain('Пруток: 2.5 мм');

    const lagsIndex = xml.indexOf('Лаги:');
    expect(lagsIndex).toBe(-1);
  });

  it('should render automation name for gate', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createAutomationEstimateData()));

    expect(xml).toContain('Автоматика: Привод Doorhan SLIDE 350');
  });

  it('should not render picket/mesh params for profnastil estimate (regression)', async () => {
    const xml = await extractDocumentXml(await generateEstimateWord(createAutomationEstimateData()));

    expect(xml).not.toContain('Монтаж: ');
    expect(xml).not.toContain('Шаг: ');
    expect(xml).not.toContain('Ячейка: ');
    expect(xml).not.toContain('Пруток: ');
    expect(xml).toContain('Лаги: 2');
    expect(xml).toContain('Покрытие: Полимерное одностороннее');
  });
});
