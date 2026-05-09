import fs from 'fs';
import path from 'path';

function computeStats(resources) {
  let totalCapacity = 0;
  const fuelTypes = {};
  resources.forEach((v) => {
    const seats = parseInt(v['ayto:PlazasSentadas']) || 0;
    const standing = parseInt(v['ayto:PlazasDePie']) || 0;
    totalCapacity += seats + standing;
    const fuel = (v['ayto:Combustible'] || 'DESCONOCIDO').toString().toUpperCase();
    fuelTypes[fuel] = (fuelTypes[fuel] || 0) + 1;
  });
  const totalVehicles = resources.length;
  const diesel = fuelTypes['DIESEL'] || 0;
  const hybrid = fuelTypes['HIBRIDO'] || fuelTypes['HÍBRIDO'] || 0;
  const electric = fuelTypes['ELECTRICO'] || fuelTypes['ELÉCTRICO'] || 0;
  return {
    totalVehicles,
    totalCapacity,
    fuelTypes,
    dieselPercentage: totalVehicles > 0 ? (diesel / totalVehicles) * 100 : 0,
    ecoPercentage: totalVehicles > 0 ? ((hybrid + electric) / totalVehicles) * 100 : 0,
  };
}

const mockPath = path.resolve(new URL(import.meta.url).pathname, '../../data/fleet.mock.json');
const raw = fs.readFileSync(mockPath, 'utf-8');
const data = JSON.parse(raw);
const stats = computeStats(data.resources || []);

console.log('Computed stats from mock:');
console.log(JSON.stringify(stats, null, 2));

// Basic assertions matching expected mock
const expected = {
  totalVehicles: 3,
  totalCapacity: (30+20) + (28+22) + (25+15),
  // diesel: 1 of 3 -> 33.333..., but mock has DIESEL and HÍBRIDO and ELÉCTRICO => diesel 1/3
};

let pass = true;
if (stats.totalVehicles !== expected.totalVehicles) {
  console.error(`FAIL: expected totalVehicles ${expected.totalVehicles}, got ${stats.totalVehicles}`);
  pass = false;
}
if (stats.totalCapacity !== expected.totalCapacity) {
  console.error(`FAIL: expected totalCapacity ${expected.totalCapacity}, got ${stats.totalCapacity}`);
  pass = false;
}

if (!pass) {
  process.exit(2);
}

console.log('Basic tests passed.');
process.exit(0);
