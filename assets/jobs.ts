// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Salary {
    min: number;
    max: number;
}

interface Job {
    probability: number;
    name: string;
    salary: Salary;
    message?: (msg: string) => string;
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
    message?: (msg: string) => string;
}

// ─── Tiers ───────────────────────────────────────────────────────────────────

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

// ─── Jobs ─────────────────────────────────────────────────────────────────────

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
    { probability: 0.70, name: 'Decorador 🏳‍🌈', salary: { min: 4000, max: 6000 } },
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
    { probability: 1.65, name: 'Piloto', salary: { min: 1000066, max: 14000 } },
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

];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Devuelve el tier correspondiente a la cantidad de XP dada.
 */
function getTierByXp(xp: number): { name: string; tier: Tier } {
    for (const [name, tier] of Object.entries(Tiers)) {
        if (xp >= tier.minXp && xp <= tier.maxXp) {
            return { name, tier };
        }
    }
    // Si supera el máximo, retorna exotic
    return { name: 'exotic', tier: Tiers.exotic };
}

/**
 * Filtra los trabajos que caen dentro del rango de probabilidad del tier.
 * Si no hay trabajos en ese tier exacto, amplía la búsqueda hacia abajo.
 */
function getJobsForTier(tier: Tier): Job[] {
    const jobs = Jobs.filter(
        (job) => job.probability >= tier.min && job.probability <= tier.max
    );

    if (jobs.length > 0) return jobs;

    // Fallback: retorna todos los trabajos con probabilidad <= tier.max
    return Jobs.filter((job) => job.probability <= tier.max);
}

/**
 * Genera un salario aleatorio entre el mínimo y máximo del trabajo.
 */
function randomSalary(salary: Salary): number {
    return Math.floor(Math.random() * (salary.max - salary.min + 1)) + salary.min;
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Recibe una cantidad de XP y retorna un trabajo aleatorio acorde al tier.
 *
 * @param xp - Cantidad de experiencia del jugador (0 – 25000+)
 * @returns JobResult con el trabajo sorteado, salario generado y tier
 */
function getRandomJob(xp: number): JobResult {
    if (xp < 0) throw new Error('La XP no puede ser negativa.');

    const { name: tierName, tier } = getTierByXp(xp);
    const eligibleJobs = getJobsForTier(tier);

    // Sorteo ponderado: mayor probabilidad = más chances
    const totalWeight = eligibleJobs.reduce((sum, job) => sum + job.probability, 0);
    let roll = Math.random() * totalWeight;

    let selectedJob: Job = eligibleJobs[0];
    for (const job of eligibleJobs) {
        roll -= job.probability;
        if (roll <= 0) {
            selectedJob = job;
            break;
        }
    }

    return {
        name: selectedJob.name,
        salary: randomSalary(selectedJob.salary) * 2,
        tier: tierName,
        probability: selectedJob.probability,
        message: selectedJob.message,
    };
}

export function getJob(xp: number) {
    const job = getRandomJob(xp);
    return job;
}
export type { Job, JobResult, Tier };

