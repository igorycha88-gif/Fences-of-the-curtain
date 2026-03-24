const { workService } = require('./src/services/admin/workService');

async function testGetWorksForCalculator() {
  console.log('[TEST] Testing getWorksForCalculator...');

  try {
    const profnastilWorks = await workService.getWorksForCalculator('PROFNASTIL');
    console.log('[TEST] PROFNASTIL works:', JSON.stringify(profnastilWorks, null, 2));

    const panel3dWorks = await workService.getWorksForCalculator('PANEL_3D');
    console.log('[TEST] PANEL_3D works:', JSON.stringify(panel3dWorks, null, 2));

    const picketWorks = await workService.getWorksForCalculator('PICKET');
    console.log('[TEST] PICKET works:', JSON.stringify(picketWorks, null, 2));
  } catch (error) {
    console.error('[TEST] Error:', error);
  }

  process.exit(0);
}

testGetWorksForCalculator();
