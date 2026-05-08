import { loadSantanderBikeData, fetchSantanderBikeStations } from "./santander-api";

/**
 * Script de prueba para verificar la integración con la API de Santander
 * Ejecutar con: npx ts-node lib/data/test-santander-api.ts
 */
async function testSantanderAPI() {
  console.log("🚀 Probando API de Santander...");
  
  try {
    // 1. Probar fetch de estaciones
    console.log("📍 Obteniendo estaciones de bicicletas...");
    const stations = await fetchSantanderBikeStations();
    console.log(`✅ Se obtuvieron ${stations.length} estaciones`);
    
    // 2. Probar transformación de datos
    console.log("🔄 Transformando datos al formato de la app...");
    const transformedData = await loadSantanderBikeData();
    console.log(`✅ Se transformaron ${transformedData.items.length} estaciones`);
    
    // 3. Mostrar ejemplos
    if (transformedData.items.length > 0) {
      console.log("📊 Ejemplo de estaciones transformadas:");
      transformedData.items.slice(0, 3).forEach((station, index) => {
        console.log(`  ${index + 1}. ${station.name}`);
        console.log(`     📍 Coordenadas: [${station.lng}, ${station.lat}]`);
        console.log(`     🚲 Bicis disponibles: ${station.availableBikes}`);
        console.log(`     🅿️ Docks disponibles: ${station.availableDocks}`);
        console.log(`     🆔 ID: ${station.id}`);
        console.log("");
      });
    }
    
    // 4. Verificar metadatos
    console.log("📋 Metadatos:");
    console.log(`   Región: ${transformedData.meta.region}`);
    console.log(`   Fuente: ${transformedData.meta.source}`);
    console.log(`   Actualizado: ${transformedData.meta.updatedAt}`);
    
    console.log("✅ Prueba completada exitosamente!");
    
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
    process.exit(1);
  }
}

// Ejecutar prueba si este archivo se corre directamente
if (require.main === module) {
  testSantanderAPI();
}

export { testSantanderAPI };
