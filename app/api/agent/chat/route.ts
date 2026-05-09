import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body?.message || "").toString().toLowerCase();
    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${proto}://${host}`;

    // 1. Fleet Analysis
    if (/flota|diesel|eco|veh[ií]culo|autob[uú]s/.test(message)) {
      try {
        const res = await fetch(`${baseUrl}/api/santander/fleet`);
        if (res.ok) {
          const data = await res.json();
          const vehicles = data.resources || [];
          let totalCapacity = 0;
          const fuelTypes: Record<string, number> = {};
          
          vehicles.forEach((v: any) => {
            const seats = parseInt(v["ayto:PlazasSentadas"]) || 0;
            const standing = parseInt(v["ayto:PlazasDePie"]) || 0;
            totalCapacity += seats + standing;
            const fuel = (v["ayto:Combustible"] || "DESCONOCIDO").toString().toUpperCase();
            fuelTypes[fuel] = (fuelTypes[fuel] || 0) + 1;
          });

          const totalVehicles = vehicles.length;
          const diesel = fuelTypes["DIESEL"] || 0;
          const hybrid = fuelTypes["HIBRIDO"] || fuelTypes["HÍBRIDO"] || 0;
          const electric = fuelTypes["ELECTRICO"] || fuelTypes["ELÉCTRICO"] || 0;
          const dieselPct = totalVehicles ? ((diesel / totalVehicles) * 100).toFixed(1) : "0.0";
          const ecoPct = totalVehicles ? (((hybrid + electric) / totalVehicles) * 100).toFixed(1) : "0.0";

          return NextResponse.json({ 
            reply: `Actualmente Santander cuenta con ${totalVehicles} autobuses. Un ${ecoPct}% de la flota es ECO (Híbridos/Eléctricos) y un ${dieselPct}% es Diesel. La capacidad total es de aprox. ${totalCapacity.toLocaleString()} pasajeros.` 
          });
        }
      } catch (err) {
        return NextResponse.json({ reply: "No pude acceder a los datos de la flota en este momento." });
      }
    }

    // 2. Bus Stops
    if (/parada|donde hay|parar/.test(message)) {
      try {
        const res = await fetch(`${baseUrl}/api/santander/bus-stops`);
        if (res.ok) {
          const data = await res.json();
          const count = data.resources?.length || 0;
          return NextResponse.json({ 
            reply: `He encontrado ${count} paradas de autobús en Santander. Puedes verlas todas activando la capa de 'Autobuses' en el mapa.` 
          });
        }
      } catch (err) {
        return NextResponse.json({ reply: "Lo siento, no pude obtener información sobre las paradas." });
      }
    }

    // 3. Bikes (Placeholder or mock check)
    if (/bici|bicicleta|estaci[oó]n de bici/.test(message)) {
      return NextResponse.json({ 
        reply: "El servicio de TUSBI cuenta con múltiples estaciones por toda la ciudad. Te recomiendo activar la capa de 'Bicicletas' para ver la disponibilidad en tiempo real de cada estación." 
      });
    }

    // 4. Greetings & Help
    if (/hola|buenos d[ií]as|buenas/.test(message)) {
      return NextResponse.json({ 
        reply: "¡Hola! Soy tu asistente de Smart Data. Puedo informarte sobre la flota de autobuses, paradas, o darte consejos de movilidad sostenible. ¿En qué puedo ayudarte?" 
      });
    }

    if (/ayuda|que haces|quien eres/.test(message)) {
      return NextResponse.json({ 
        reply: "Soy un agente inteligente diseñado para ayudarte a navegar Santander. Pregúntame sobre la flota ('¿Cómo es la flota?'), paradas ('¿Cuántas paradas hay?') o movilidad eco." 
      });
    }

    if (/gracias|perfecto|ok/.test(message)) {
      return NextResponse.json({ reply: "¡De nada! Siempre a tu disposición para moverte mejor por Santander. 🚲🚌" });
    }

    // Default
    return NextResponse.json({ 
      reply: "No estoy seguro de haber entendido bien. Prueba preguntando por la 'flota', 'paradas' o 'bicicletas'. ¡También puedes usar el botón de voz para hablar conmigo!" 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "Hubo un pequeño error técnico. ¿Podrías repetirlo?" }, { status: 500 });
  }
}
