interface Salary {
    min: number;
    max: number;
}

interface RiskEvent {
    type: 'accident' | 'fired' | 'fine' | 'extreme' | 'tool_damage' | 'low_performance';
    message: string;
    finePercent: number;
    cooldownExtra: number;
}

interface Job {
    probability: number;
    name: string;
    salary: Salary;
    cooldown?: number;
    message?: (msg: string) => string;
    risks?: RiskEvent[];
}

interface Tier {
    min: number;
    max: number;
    minXp: number;
    maxXp: number;
}

interface JobResult {
    name: string;
    salary: number;
    tier: string;
    probability: number;
    cooldown: number;
    message?: (msg: string) => string;
    risk?: {
        event: RiskEvent;
        fine: number;
    };
}

const Tiers: Record<string, Tier> = {
    common: { min: 0.15, max: 0.30, minXp: 0, maxXp: 1000 },
    uncommon: { min: 0.31, max: 0.50, minXp: 1001, maxXp: 2000 },
    rare: { min: 0.51, max: 0.70, minXp: 2001, maxXp: 3000 },
    epic: { min: 0.71, max: 0.90, minXp: 3001, maxXp: 4000 },
    legendary: { min: 0.91, max: 1.15, minXp: 4001, maxXp: 5000 },
    mythical: { min: 1.16, max: 1.50, minXp: 5001, maxXp: 6000 },
    legend: { min: 1.51, max: 1.70, minXp: 6001, maxXp: 7000 },
    exotic: { min: 1.60, max: 2.50, minXp: 7001, maxXp: 25000 },
};

const TierCooldowns: Record<string, number> = {
    common: 20,
    uncommon: 25,
    rare: 30,
    epic: 35,
    legendary: 40,
    mythical: 45,
    legend: 50,
    exotic: 60,
};

const TierRisks: Record<string, RiskEvent[]> = {
    common: [
        { type: 'accident', message: '🚑 Te cayó un tubo del MOP en la cabeza. Terminaste en el cuarto de urgencia del Santo Tomás.', finePercent: 0.15, cooldownExtra: 10 },
        { type: 'fired', message: '❌ El dueño te botó porque te encontró dormido dentro del carrito de hojaldres.', finePercent: 1.0, cooldownExtra: 30 },
        { type: 'fine', message: '🚔 Un policía te puso multa por vender patí en zona prohibida. Te quitaron la mercancía.', finePercent: 0.25, cooldownExtra: 15 },
        { type: 'tool_damage', message: '🛠️ Se te reventó la hielera del duro frío. Se te derritió todo el inventario.', finePercent: 0.2, cooldownExtra: 20 },
        { type: 'low_performance', message: '💤 El supervisor dice que eres más lento que una tortuga con resaca. Te rebajaron el sueldo.', finePercent: 0.1, cooldownExtra: 10 },
    ],
    uncommon: [
        { type: 'accident', message: '🚑 Te torciste el tobillo esquivando un hueco en la Cinta Costera y caíste en un charco.', finePercent: 0.15, cooldownExtra: 10 },
        { type: 'fired', message: '❌ Te botaron por comerte la mercancía del chino. "Mucho inventario, poco cliente", dijo.', finePercent: 1.0, cooldownExtra: 35 },
        { type: 'fine', message: '🚔 La alcaldía te decomisó el puesto porque "no tenías permiso". La ley es la ley.', finePercent: 0.3, cooldownExtra: 20 },
        { type: 'tool_damage', message: '🛠️ Se te dañó la bicicleta. Los frenos ya no existían, pero ahora tampoco las llantas.', finePercent: 0.15, cooldownExtra: 20 },
        { type: 'low_performance', message: '💤 Perdiste clientes porque no tienes WhatsApp Business. La competencia te comió.', finePercent: 0.1, cooldownExtra: 15 },
    ],
    rare: [
        { type: 'accident', message: '🚑 Te electrocutaste arreglando una estufa de fonda. El susto te duró todo el día.', finePercent: 0.2, cooldownExtra: 15 },
        { type: 'fired', message: '❌ Te echaron del grupo de WhatsApp por mandar mucha cadena falsa. El admin te borró.', finePercent: 1.0, cooldownExtra: 40 },
        { type: 'fine', message: '🚔 La DIJ te cayó por vender chance clandestino. Te llevaron a declarar.', finePercent: 0.35, cooldownExtra: 25 },
        { type: 'tool_damage', message: '🛠️ Se te dañó la consola del bus diablo rojo. Ahora la música es solo salsa vieja.', finePercent: 0.2, cooldownExtra: 20 },
        { type: 'extreme', message: '💀 Un pana te robó el celular mientras grababas un TikTok viral. Adiós seguidores.', finePercent: 0.5, cooldownExtra: 45 },
    ],
    epic: [
        { type: 'accident', message: '🚑 Te dislocaste el hombro frentiando muy duro en una discoteca de El Cangrejo.', finePercent: 0.2, cooldownExtra: 15 },
        { type: 'fired', message: '❌ Cambiaron la administración del PH y el nuevo security te botó por "malas vibras".', finePercent: 1.0, cooldownExtra: 45 },
        { type: 'fine', message: '🚔 Te cayó una multa por chifear sin licencia. El Colegio de Abogados te bota el caso.', finePercent: 0.35, cooldownExtra: 25 },
        { type: 'tool_damage', message: '🛠️ Se te dañó el equipo de sonido del tamborito urbano. Se oye puro chin-chin.', finePercent: 0.2, cooldownExtra: 25 },
        { type: 'extreme', message: '💀 Un bus diablo rojo te salpicó lodo entero mientras presentabas el show. Cámaras de TVN te grabaron.', finePercent: 0.4, cooldownExtra: 40 },
    ],
    legendary: [
        { type: 'accident', message: '🚑 Te lastimaste la espalda recogiendo conos en el carnaval. Pesan más que tu autoestima.', finePercent: 0.2, cooldownExtra: 20 },
        { type: 'fired', message: '❌ El chino te botó porque tus abanicos no enfriaban ni verga. "Puro adorno", te dijo.', finePercent: 1.0, cooldownExtra: 50 },
        { type: 'fine', message: '🚔 Te pusieron una multa por reparación ilegal de abanicos. Ejercicio ilegal de la ingeniería.', finePercent: 0.35, cooldownExtra: 30 },
        { type: 'tool_damage', message: '🛠️ Se te acabó el tie-wrap. No puedes arreglar más nada. Es el fin de tu imperio técnico.', finePercent: 0.25, cooldownExtra: 30 },
        { type: 'extreme', message: '💀 Llegó un técnico de verdad y te descubrió todas tus mentiras. Te funaron en redes.', finePercent: 0.6, cooldownExtra: 60 },
    ],
    mythical: [
        { type: 'accident', message: '🚑 Te intoxicaste con sopa china caducada mientras curabas una goma. Paro estomacal.', finePercent: 0.25, cooldownExtra: 20 },
        { type: 'fired', message: '❌ Te descubrieron que eras botella del gobierno y te sacaron del puesto. Escándalo nacional.', finePercent: 1.0, cooldownExtra: 60 },
        { type: 'fine', message: '🚔 Hiciste un juega vivo que salió mal. Perdiste plata, reputación y hasta el WhatsApp.', finePercent: 0.4, cooldownExtra: 35 },
        { type: 'tool_damage', message: '🛠️ Se te rompió el alambre. Sin alambre no hay invento. Estás frito.', finePercent: 0.25, cooldownExtra: 30 },
        { type: 'extreme', message: '💀 Una bewy tóxica te demandó por daños emocionales. El juez te cayó a punta de ley.', finePercent: 0.7, cooldownExtra: 60 },
    ],
    legend: [
        { type: 'accident', message: '🚑 Te caíste del bus diablo rojo mientras lo lavabas. Caída legendaria.', finePercent: 0.25, cooldownExtra: 25 },
        { type: 'fired', message: '❌ El push te cerró y te quedaste sin trabajo. Ahora toca emprender con hojaldres.', finePercent: 1.0, cooldownExtra: 60 },
        { type: 'fine', message: '🚔 El municipio te quitó las zapatillas blancas por parking indebido en la cinta.', finePercent: 0.4, cooldownExtra: 35 },
        { type: 'tool_damage', message: '🛠️ Se te dañó la piragua en medio de una inundación. Tuviste que nadar.', finePercent: 0.25, cooldownExtra: 35 },
        { type: 'extreme', message: '💀 Un borracho en la cantina te robó tu mejor discurso filosófico y lo vendió como suyo.', finePercent: 0.6, cooldownExtra: 60 },
    ],
    exotic: [
        { type: 'accident', message: '🚑 Te dio una indigestión de tanto probar saus a las 3 AM. El hígado dijo basta.', finePercent: 0.3, cooldownExtra: 30 },
        { type: 'fired', message: '❌ Te echaron del país por influencer de fondas sin declarar impuestos. La DIJ te esperaba.', finePercent: 1.0, cooldownExtra: 90 },
        { type: 'fine', message: '🚔 La ATTT te quitó la coaster por manejo suicida. "Pilas mae", te dijo el agente.', finePercent: 0.5, cooldownExtra: 45 },
        { type: 'tool_damage', message: '🛠️ Se te acabaron las excusas para llegar tarde. Te descubrieron. Ya no te creen na.', finePercent: 0.3, cooldownExtra: 40 },
        { type: 'extreme', message: '💀 El dueño del parking de chupitos te vapuleó por vender sin permiso. Te fuiste en ambulancia.', finePercent: 0.8, cooldownExtra: 90 },
    ],
};

const Jobs: Job[] = [
    // Common (0.15 – 0.30)
    { probability: 0.15, name: 'Repartidor de Pedidos Ya', salary: { min: 500, max: 1000 } },
    { probability: 0.18, name: 'Vendedor de Tigo', salary: { min: 800, max: 1500 } },
    { probability: 0.20, name: 'Cajero del Rey', salary: { min: 800, max: 1500 } },
    { probability: 0.20, name: 'Vendedor Ambulante', salary: { min: 500, max: 1000 } },
    { probability: 0.20, name: 'Cajero del Costo', salary: { min: 500, max: 1000 } },
    { probability: 0.20, name: 'Taxista', salary: { min: 800, max: 1500 } },
    { probability: 0.28, name: 'Malabarista de Semáforo', salary: { min: 500, max: 800 } },
    { probability: 0.30, name: 'Trabajador del MOP', salary: { min: 1200, max: 2000 } },
    { probability: 0.30, name: 'Cuidacoches', salary: { min: 1200, max: 2000 } },
    { probability: 0.30, name: 'Mototaxista', salary: { min: 1200, max: 2000 } },
    { probability: 0.30, name: 'Limpiaparabrisas', salary: { min: 500, max: 800 } },
    { probability: 0.30, name: 'Payaso', salary: { min: 800, max: 1000 } },
    { probability: 0.30, name: 'Mago', salary: { min: 800, max: 1000 } },
    { probability: 0.30, name: 'Luchador', salary: { min: 1000, max: 2000 } },
    { probability: 0.30, name: 'Billetero', salary: { min: 800, max: 1000 } },

    // Uncommon (0.31 – 0.50)
    { probability: 0.32, name: 'Barbero', salary: { min: 1000, max: 2000 } },
    { probability: 0.35, name: 'Pavo de Bus', salary: { min: 1000, max: 1500 } },
    { probability: 0.38, name: 'Tiktoker', salary: { min: 1500, max: 3000 } },
    { probability: 0.45, name: 'Chef', salary: { min: 1500, max: 3000 } },
    { probability: 0.45, name: 'Modelo de OnlyFans', salary: { min: 1500, max: 3000 } },
    { probability: 0.48, name: 'Profesor de Primaria', salary: { min: 3000, max: 5000 } },
    { probability: 0.50, name: 'Stripper', salary: { min: 4000, max: 6000 } },
    { probability: 0.50, name: 'Emprendedor', salary: { min: 4000, max: 6000 } },
    { probability: 0.50, name: 'Aseador', salary: { min: 4000, max: 6000 } },
    { probability: 0.50, name: 'Vendedor de Carne en Palito', salary: { min: 4000, max: 6000 } },
    { probability: 0.50, name: 'Roba Pollo', salary: { min: 4000, max: 6000 } },
    { probability: 0.50, name: 'Pescador', salary: { min: 1000, max: 2000 } },
    { probability: 0.50, name: 'Futbolista', salary: { min: 1000, max: 2000 } },
    { probability: 0.50, name: 'Cajero del Mcdonalds', salary: { min: 1000, max: 2000 } },
    { probability: 0.50, name: 'Mesero del Mcdonalds', salary: { min: 1000, max: 2000 } },

    // Rare (0.51 – 0.70)
    { probability: 0.55, name: 'Streamer', salary: { min: 2000, max: 5000 } },
    { probability: 0.60, name: 'Político', salary: { min: 6000, max: 8000 } },
    { probability: 0.62, name: 'Cocinero', salary: { min: 5000, max: 8000 } },
    { probability: 0.70, name: 'Cantante', salary: { min: 5000, max: 8000 } },
    { probability: 0.70, name: 'Vendedor de autos', salary: { min: 5000, max: 8000 } },
    { probability: 0.70, name: 'Decorador 🏳️‍🌈', salary: { min: 4000, max: 6000 } },
    { probability: 0.70, name: 'Carpintero', salary: { min: 4000, max: 6000 } },
    { probability: 0.70, name: 'Botella en la alcaldía', salary: { min: 500, max: 1000 } },
    { probability: 0.70, name: 'Abogado', salary: { min: 5000, max: 10000 } },
    { probability: 0.70, name: 'Ginecólogo', salary: { min: 5000, max: 10000 } },
    { probability: 0.70, name: 'Mecánico', salary: { min: 5000, max: 10000 } },

    // Epic (0.71 – 0.90)
    { probability: 0.75, name: 'DJ', salary: { min: 6000, max: 8000 } },
    { probability: 0.80, name: 'Mecánico', salary: { min: 8000, max: 10000 } },
    { probability: 0.85, name: 'Abogado', salary: { min: 5000, max: 10000 } },
    { probability: 0.90, name: 'Ladrón', salary: { min: 7000, max: 10000 } },
    { probability: 0.90, name: 'Enfermero', salary: { min: 7000, max: 10000 } },
    { probability: 0.90, name: 'Barbero', salary: { min: 7000, max: 10000 } },
    { probability: 0.90, name: 'Vendedor de Harina', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Panadero', salary: { min: 4000, max: 6000 } },
    { probability: 0.90, name: 'Vendedor de globos', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Youtuber', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Sister Hong', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Adivino', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Asaltante', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Ladrón de carros', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Asesino', salary: { min: 1000, max: 2000 } },
    { probability: 0.90, name: 'Robo en la terminal', salary: { min: 1000, max: 2000 } },

    // Legendary (0.91 – 1.15)
    { probability: 0.93, name: 'Profesor de Primaria', salary: { min: 3000, max: 5000 } },
    { probability: 0.94, name: 'Profesor de Secundaria', salary: { min: 4000, max: 6000 } },
    { probability: 0.95, name: 'Odontólogo', salary: { min: 7000, max: 12000 } },
    { probability: 0.95, name: 'Técnico de PC', salary: { min: 7000, max: 12000 } },
    { probability: 0.95, name: 'Chofer de Metro Bus', salary: { min: 7000, max: 12000 } },
    { probability: 1.00, name: 'Hackeador', salary: { min: 7000, max: 12000 } },
    { probability: 1.00, name: 'Profesor de Universidad', salary: { min: 5000, max: 10000 } },
    { probability: 1.10, name: 'Científico Loco', salary: { min: 7500, max: 12000 } },
    { probability: 1.10, name: 'Limpiador en el Seguro Social', salary: { min: 7500, max: 12000 } },

    // Mythical (1.16 – 1.50)
    { probability: 1.20, name: 'Ingeniero', salary: { min: 10000, max: 20000 } },
    { probability: 1.50, name: 'Doctor', salary: { min: 7000, max: 12000 } },
    { probability: 1.50, name: 'Sicario', salary: { min: 5000, max: 8000 } },
    { probability: 1.50, name: 'Arquitecto', salary: { min: 6000, max: 10000 } },
    { probability: 1.50, name: 'Sinaproc', salary: { min: 6000, max: 10000 } },
    { probability: 1.50, name: 'Trabajador de Acodeco', salary: { min: 6000, max: 10000 } },
    { probability: 1.50, name: 'Trabajador de Mi Bus', salary: { min: 6000, max: 10000 } },
    { probability: 1.50, name: 'Trabajador de la Autoridad del Canal de Panamá', salary: { min: 6000, max: 10000 } },

    // Legend (1.51 – 1.70)
    { probability: 1.60, name: 'Abogado Corporativo', salary: { min: 8000, max: 20000 } },
    { probability: 1.60, name: 'Policía', salary: { min: 6000, max: 10000 } },
    { probability: 1.60, name: 'Policía de la DIJ', salary: { min: 6000, max: 10000 } },
    { probability: 1.60, name: 'Policía de la DIJ', salary: { min: 6000, max: 10000 } },
    { probability: 1.65, name: 'Piloto', salary: { min: 10000, max: 14000 } },
    { probability: 1.68, name: 'Gobernador', salary: { min: 10000, max: 15000 } },
    { probability: 1.70, name: 'Narco', salary: { min: 15000, max: 25000 } },
    { probability: 1.70, name: 'Alcalde Mayer', salary: { min: 15000, max: 25000 } },
    { probability: 1.70, name: 'Contratista', salary: { min: 15000, max: 25000 } },
    { probability: 1.70, name: 'Boxeador Profesional', salary: { min: 2000, max: 25000 } },
    { probability: 1.70, name: 'Empresario Inmobiliario', salary: { min: 10000, max: 15000 } },
    { probability: 1.70, name: 'Reportero de TVN', salary: { min: 10000, max: 12000 } },
    { probability: 1.70, name: 'Reportero de Telemetro', salary: { min: 10000, max: 12000 } },
    { probability: 1.70, name: 'Reportero de Nex', salary: { min: 10000, max: 12000 } },
    { probability: 1.70, name: 'Reportero de SERTV', salary: { min: 10000, max: 12000 } },
    { probability: 1.70, name: 'Reportero de RPC', salary: { min: 10000, max: 12000 } },
    { probability: 1.70, name: 'Reportero de TVMax', salary: { min: 10000, max: 15000 } },

    // Exotic (1.71+)
    { probability: 1.71, name: 'Cirujano Plástico', salary: { min: 7000, max: 12000 } },
    { probability: 1.80, name: 'Uber', salary: { min: 5000, max: 10000 }, message: (msg) => `has transportado a ${msg}` },
    { probability: 1.80, name: 'Agente de Venta de Seguros', salary: { min: 5000, max: 10000 } },
    { probability: 1.80, name: 'Agente de Bienes Raíces', salary: { min: 5000, max: 10000 } },
    { probability: 2.10, name: 'Agente de Compra y Ventas en China', salary: { min: 5000, max: 10000 } },
    { probability: 1.90, name: 'CEO', salary: { min: 15000, max: 25000 } },
    { probability: 2.00, name: 'Diputado', salary: { min: 5000, max: 10000 } },
    { probability: 2.00, name: 'Falsificador de Billetes', salary: { min: 10000, max: 30000 } },
    { probability: 2.50, name: 'Presidente', salary: { min: 10000, max: 14000 } },
    { probability: 2.50, name: 'Traficante de Armas', salary: { min: 10000, max: 30000 } },
    { probability: 2.00, name: 'Dueño de Franquicia', salary: { min: 8000, max: 25000 } },

    // ─── Nuevos trabajos del Pueblo ─────────────────────────────────────────

    // Common
    { probability: 0.15, name: 'Vendedor de agua tibia en carnaval', salary: { min: 300, max: 600 } },
    { probability: 0.18, name: 'Cuidador de hamacas en Veraguas', salary: { min: 400, max: 700 } },
    { probability: 0.20, name: 'Vendedor de duro frío derretido', salary: { min: 300, max: 500 } },
    { probability: 0.22, name: 'Vendedor de patí en semáforo', salary: { min: 500, max: 800 } },
    { probability: 0.25, name: 'Repartidor de hojaldres en tranque', salary: { min: 400, max: 700 } },
    { probability: 0.25, name: 'Vendedor de raspao en tranque', salary: { min: 400, max: 700 } },
    { probability: 0.28, name: 'Cazador de promociones del Rey', salary: { min: 500, max: 900 } },
    { probability: 0.28, name: 'Delivery de saus a las 3 AM', salary: { min: 600, max: 1000 }, risks: [{ type: 'extreme', message: '💀 Te encontraste con un bewy cuchillo en la 12 de Octubre. Corriste más que Bolt.', finePercent: 0.7, cooldownExtra: 60 }] },
    { probability: 0.30, name: 'Vendedor de waffle en push', salary: { min: 500, max: 1000 } },
    { probability: 0.30, name: 'Cobrador del "yappy ahí pues"', salary: { min: 600, max: 1000 } },

    // Uncommon
    { probability: 0.32, name: 'Pavo de metrobus pirata', salary: { min: 1000, max: 1800 } },
    { probability: 0.35, name: 'Chotin delivery', salary: { min: 1200, max: 2000 } },
    { probability: 0.38, name: 'Delivery en bicicleta sin frenos', salary: { min: 1000, max: 2000 }, risks: [{ type: 'accident', message: '🚑 Te estrellaste contra un poste porque tu bici no tenía frenos. Otra vez.', finePercent: 0.3, cooldownExtra: 25 }] },
    { probability: 0.40, name: 'Organizador de parking en la cinta', salary: { min: 1500, max: 2500 } },
    { probability: 0.42, name: 'Tiktoker del Metro', salary: { min: 500, max: 1500 } },
    { probability: 0.45, name: 'Motivador de gym de enero', salary: { min: 800, max: 1500 } },
    { probability: 0.48, name: 'Paseador de bewys', salary: { min: 2000, max: 3500 } },
    { probability: 0.50, name: 'Cazador de bewys en el West', salary: { min: 2500, max: 4000 } },
    { probability: 0.50, name: 'Fotógrafo de carnavales con Android roto', salary: { min: 1500, max: 2500 } },
    { probability: 0.50, name: 'Entrenador Pokémon de San Miguelito', salary: { min: 2000, max: 3000 } },

    // Rare
    { probability: 0.55, name: 'Terrorista del audio de WhatsApp', salary: { min: 3000, max: 5000 } },
    { probability: 0.58, name: 'Lava tanques del IDAAN', salary: { min: 3000, max: 6000 } },
    { probability: 0.60, name: 'Manager de parking ajeno', salary: { min: 4000, max: 7000 } },
    { probability: 0.62, name: 'Tester de picantes del Doraditos', salary: { min: 3000, max: 5000 }, risks: [{ type: 'accident', message: '🚑 Te picó tanto el Doraditos que terminaste en el Santo Tomás con lavado estomacal.', finePercent: 0.4, cooldownExtra: 30 }] },
    { probability: 0.65, name: 'DJ de bus diablo rojo', salary: { min: 4000, max: 6000 } },
    { probability: 0.65, name: 'Creador de cadenas falsas de WhatsApp', salary: { min: 2000, max: 4000 } },
    { probability: 0.68, name: 'Inspector de filas del Xtra', salary: { min: 3000, max: 5000 } },
    { probability: 0.68, name: 'Mecánico de estufas de fonda', salary: { min: 4000, max: 6000 } },
    { probability: 0.70, name: 'Barbero de portal', salary: { min: 3500, max: 5500 } },
    { probability: 0.70, name: 'Cuidador de pintaos en carnaval', salary: { min: 2500, max: 4000 } },

    // Epic
    { probability: 0.75, name: 'Bien cuidao VIP del PH', salary: { min: 6000, max: 10000 }, message: (msg) => `le has cuidado el PH a ${msg} por $` },
    { probability: 0.78, name: 'Frentiao profesional', salary: { min: 5000, max: 9000 } },
    { probability: 0.80, name: 'Chifeador profesional', salary: { min: 5000, max: 8000 } },
    { probability: 0.82, name: 'Terror del grupo de WhatsApp', salary: { min: 4000, max: 7000 } },
    { probability: 0.85, name: 'Presentador de tamborito urbano', salary: { min: 6000, max: 9000 } },
    { probability: 0.85, name: 'Supervisor de parrillada improvisada', salary: { min: 5000, max: 8000 } },
    { probability: 0.88, name: 'Guía turístico de Samaria', salary: { min: 4000, max: 7000 } },
    { probability: 0.90, name: 'Catador oficial de saus', salary: { min: 5000, max: 8000 } },
    { probability: 0.90, name: 'Vendedor de chance clandestino', salary: { min: 6000, max: 10000 } },
    { probability: 0.90, name: 'Inspector de patacones', salary: { min: 5000, max: 8000 } },

    // Legendary
    { probability: 0.93, name: 'Peleador de parking de discoteca', salary: { min: 6000, max: 10000 } },
    { probability: 0.95, name: 'Recoge conos de carnaval', salary: { min: 5000, max: 9000 } },
    { probability: 0.98, name: 'Mecánico de abanicos de chino', salary: { min: 7000, max: 11000 }, message: (msg) => `le arreglaste el abanico a ${msg} por $` },
    { probability: 1.00, name: 'Técnico de bocinas tronadas', salary: { min: 6000, max: 10000 } },
    { probability: 1.05, name: 'Mecánico de abanico con tie-wrap', salary: { min: 7000, max: 10000 } },
    { probability: 1.10, name: 'Curandero de goma con sopa china', salary: { min: 6000, max: 12000 } },
    { probability: 1.10, name: 'Ingeniero en cinta adhesiva', salary: { min: 7000, max: 12000 } },
    { probability: 1.15, name: 'Experto en resolver con alambre', salary: { min: 7000, max: 12000 } },

    // Mythical
    { probability: 1.20, name: 'Botella premium del gobierno', salary: { min: 10000, max: 20000 } },
    { probability: 1.25, name: 'Experto en juega vivo', salary: { min: 8000, max: 15000 } },
    { probability: 1.30, name: 'Escolta de quinceañeras', salary: { min: 10000, max: 18000 } },
    { probability: 1.35, name: 'Domador de bewys tóxicas', salary: { min: 9000, max: 15000 } },
    { probability: 1.40, name: 'Paquetero de push clandestino', salary: { min: 10000, max: 20000 } },
    { probability: 1.45, name: 'Operador táctico de carretilla en Merca Panamá', salary: { min: 8000, max: 15000 } },
    { probability: 1.50, name: 'Arquitecto de ranchos playeros', salary: { min: 9000, max: 16000 } },
    { probability: 1.50, name: 'Cazador de yappis atrasados', salary: { min: 10000, max: 18000 } },

    // Legend
    { probability: 1.55, name: 'Security de push', salary: { min: 8000, max: 15000 } },
    { probability: 1.58, name: 'Busero de Forza Horizon Panamá', salary: { min: 10000, max: 18000 } },
    { probability: 1.60, name: 'Lavador de buses diablo rojo', salary: { min: 12000, max: 20000 } },
    { probability: 1.62, name: 'Limpiador de zapatillas blancas pa\' parking', salary: { min: 10000, max: 20000 } },
    { probability: 1.65, name: 'Animador de push de patio', salary: { min: 12000, max: 18000 } },
    { probability: 1.68, name: 'Capitán de piragua en inundación', salary: { min: 10000, max: 20000 } },
    { probability: 1.70, name: 'Filósofo de cantina', salary: { min: 12000, max: 22000 } },
    { probability: 1.70, name: 'Tester de pintas calientes', salary: { min: 10000, max: 20000 } },

    // Exotic
    { probability: 1.75, name: 'Administrador de parking de chupitos', salary: { min: 15000, max: 25000 } },
    { probability: 1.80, name: 'Influencer de fondas', salary: { min: 12000, max: 22000 } },
    { probability: 1.85, name: 'Especialista en dormir en hamaca', salary: { min: 15000, max: 25000 } },
    { probability: 1.90, name: 'Piloto de coaster suicida', salary: { min: 15000, max: 28000 } },
    { probability: 2.00, name: 'Ingeniero en inventar excusas pa\' llegar tarde', salary: { min: 20000, max: 35000 } },
    { probability: 2.20, name: 'Frentiao profesional bancario', salary: { min: 15000, max: 30000 } },
];

function getTierByXp(xp: number): { name: string; tier: Tier } {
    for (const [name, tier] of Object.entries(Tiers)) {
        if (xp >= tier.minXp && xp <= tier.maxXp) {
            return { name, tier };
        }
    }
    return { name: 'exotic', tier: Tiers['exotic']! };
}

function getJobsForTier(tier: Tier): Job[] {
    const jobs = Jobs.filter(
        (job) => job.probability >= tier.min && job.probability <= tier.max
    );

    if (jobs.length > 0) return jobs;

    return Jobs.filter((job) => job.probability <= tier.max);
}

function randomSalary(salary: Salary): number {
    return Math.floor(Math.random() * (salary.max - salary.min + 1)) + salary.min;
}

function getRandomJob(xp: number): JobResult {
    if (xp < 0) throw new Error('La XP no puede ser negativa.');

    const { name: tierName, tier } = getTierByXp(xp);
    const eligibleJobs = getJobsForTier(tier);

    const totalWeight = eligibleJobs.reduce((sum, job) => sum + job.probability, 0);
    let roll = Math.random() * totalWeight;

    let selectedJob = eligibleJobs[0]!;
    for (const job of eligibleJobs) {
        roll -= job.probability;
        if (roll <= 0) {
            selectedJob = job;
            break;
        }
    }

    const baseSalary = randomSalary(selectedJob.salary) * 2;
    const baseCooldown = selectedJob.cooldown ?? TierCooldowns[tierName]!;

    let risk: JobResult['risk'] = undefined;
    if (Math.random() < 0.08) {
        const tierRisks = selectedJob.risks ?? TierRisks[tierName] ?? TierRisks['common']!;
        const riskEvent = tierRisks[Math.floor(Math.random() * tierRisks.length)]!;
        const fine = Math.min(
            Math.floor(baseSalary * riskEvent.finePercent),
            baseSalary
        );

        risk = { event: riskEvent, fine };
    }

    const result: JobResult = {
        name: selectedJob.name,
        salary: baseSalary,
        tier: tierName,
        probability: selectedJob.probability,
        cooldown: baseCooldown + (risk?.event.cooldownExtra ?? 0),
    };

    if (risk) result.risk = risk;
    if (selectedJob.message) result.message = selectedJob.message;

    return result;
}

export function getJob(xp: number) {
    return getRandomJob(xp);
}
export type { Job, JobResult, Tier };
