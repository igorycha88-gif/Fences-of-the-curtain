const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeIP(ip) {
  if (!ip || ip === 'unknown') return null;
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  if (ip.startsWith('127.') || ip === '::1') return null;
  return ip;
}

async function getCityFromAPI(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    if (data.status === 'success' && data.city) {
      return data.country === 'Russia' ? data.city : `${data.city}, ${data.country}`;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching city for ${ip}:`, error.message);
    return null;
  }
}

async function main() {
  const estimates = await prisma.$queryRaw`
    SELECT id, "ipAddress" FROM "FenceEstimate" 
    WHERE "ipAddress" IS NOT NULL 
    AND "ipAddress" != '' 
    AND "ipAddress" != 'unknown'
    AND city IS NULL
  `;
  
  console.log(`Found ${estimates.length} estimates without city`);
  
  const ipToCity = new Map();
  let updated = 0;
  
  for (const estimate of estimates) {
    const normalizedIP = normalizeIP(estimate.ipAddress);
    if (!normalizedIP) continue;
    
    let city = ipToCity.get(normalizedIP);
    if (city === undefined) {
      city = await getCityFromAPI(normalizedIP);
      ipToCity.set(normalizedIP, city);
      console.log(`IP ${normalizedIP} -> ${city || 'null'}`);
      await new Promise(r => setTimeout(r, 300));
    }
    
    if (city) {
      await prisma.$executeRaw`
        UPDATE "FenceEstimate" SET city = ${city} WHERE id = ${estimate.id}
      `;
      updated++;
    }
  }
  
  console.log(`Updated ${updated} estimates with city data`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
