export interface Country {
  code: string;
  english: string;
  spanish: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function firstN(s: string, n: number): string[] {
  const norm = normalize(s);
  const parts = norm.split(/\s+/);
  const result: string[] = [];
  for (const part of parts) {
    if (part.length >= n) {
      result.push(part.slice(0, n));
    }
  }
  return [...new Set(result)];
}

function wordVariants(name: string): string[] {
  const norm = normalize(name);
  const parts = norm.split(/\s+/);
  const result = new Set<string>();
  for (const p of parts) {
    if (p.length > 0) result.add(p);
    if (p.length >= 2) result.add(p.slice(0, 2));
    if (p.length >= 3) result.add(p.slice(0, 3));
  }
  return [...result];
}

export function findCountry(input: string): Country | null {
  const norm = normalize(input);
  let match: Country | null = null;

  for (const c of COUNTRIES) {
    const candidates = new Set([
      normalize(c.code),
      normalize(c.english),
      normalize(c.spanish),
      ...firstN(c.code, 2),
      ...firstN(c.code, 3),
      ...firstN(c.english, 2),
      ...firstN(c.english, 3),
      ...firstN(c.spanish, 2),
      ...firstN(c.spanish, 3),
      ...wordVariants(c.english),
      ...wordVariants(c.spanish),
    ]);

    if (candidates.has(norm)) {
      if (match) return null;
      match = c;
    }
  }

  return match;
}

export function getCountryAliases(country: Country): string[] {
  const set = new Set<string>();

  const codeL = country.code.toLowerCase();
  set.add(codeL);
  firstN(country.code, 2).forEach((a) => set.add(a));
  firstN(country.code, 3).forEach((a) => set.add(a));

  const engNorm = normalize(country.english);
  set.add(engNorm);
  set.add(country.english.toLowerCase());
  firstN(country.english, 2).forEach((a) => set.add(a));
  firstN(country.english, 3).forEach((a) => set.add(a));
  wordVariants(country.english).forEach((a) => set.add(a));

  const spaNorm = normalize(country.spanish);
  set.add(spaNorm);
  set.add(country.spanish.toLowerCase());
  firstN(country.spanish, 2).forEach((a) => set.add(a));
  firstN(country.spanish, 3).forEach((a) => set.add(a));
  wordVariants(country.spanish).forEach((a) => set.add(a));

  return [...set];
}

export const COUNTRIES: Country[] = [
  { code: "ALG", english: "Algeria", spanish: "Argelia" },
  { code: "ARG", english: "Argentina", spanish: "Argentina" },
  { code: "AUS", english: "Australia", spanish: "Australia" },
  { code: "AUT", english: "Austria", spanish: "Austria" },
  { code: "BEL", english: "Belgium", spanish: "Bélgica" },
  { code: "BIH", english: "Bosnia and Herzegovina", spanish: "Bosnia y Herzegovina" },
  { code: "BRA", english: "Brazil", spanish: "Brasil" },
  { code: "CAN", english: "Canada", spanish: "Canadá" },
  { code: "CPV", english: "Cape Verde", spanish: "Cabo Verde" },
  { code: "COL", english: "Colombia", spanish: "Colombia" },
  { code: "COD", english: "DR Congo", spanish: "República Democrática del Congo" },
  { code: "CIV", english: "Ivory Coast", spanish: "Costa de Marfil" },
  { code: "CRC", english: "Costa Rica", spanish: "Costa Rica" },
  { code: "CRO", english: "Croatia", spanish: "Croacia" },
  { code: "CUW", english: "Curaçao", spanish: "Curazao" },
  { code: "CZE", english: "Czech Republic", spanish: "República Checa" },
  { code: "EGY", english: "Egypt", spanish: "Egipto" },
  { code: "ECU", english: "Ecuador", spanish: "Ecuador" },
  { code: "ENG", english: "England", spanish: "Inglaterra" },
  { code: "FRA", english: "France", spanish: "Francia" },
  { code: "GER", english: "Germany", spanish: "Alemania" },
  { code: "GHA", english: "Ghana", spanish: "Ghana" },
  { code: "HAI", english: "Haiti", spanish: "Haití" },
  { code: "IRQ", english: "Iraq", spanish: "Irak" },
  { code: "IRN", english: "Iran", spanish: "Irán" },
  { code: "JPN", english: "Japan", spanish: "Japón" },
  { code: "JOR", english: "Jordan", spanish: "Jordania" },
  { code: "KOR", english: "South Korea", spanish: "Corea del Sur" },
  { code: "MAR", english: "Morocco", spanish: "Marruecos" },
  { code: "MEX", english: "Mexico", spanish: "México" },
  { code: "NED", english: "Netherlands", spanish: "Países Bajos" },
  { code: "NOR", english: "Norway", spanish: "Noruega" },
  { code: "NZL", english: "New Zealand", spanish: "Nueva Zelanda" },
  { code: "PAN", english: "Panama", spanish: "Panamá" },
  { code: "PAR", english: "Paraguay", spanish: "Paraguay" },
  { code: "POR", english: "Portugal", spanish: "Portugal" },
  { code: "QAT", english: "Qatar", spanish: "Catar" },
  { code: "KSA", english: "Saudi Arabia", spanish: "Arabia Saudita" },
  { code: "SCO", english: "Scotland", spanish: "Escocia" },
  { code: "SEN", english: "Senegal", spanish: "Senegal" },
  { code: "RSA", english: "South Africa", spanish: "Sudáfrica" },
  { code: "ESP", english: "Spain", spanish: "España" },
  { code: "SWE", english: "Sweden", spanish: "Suecia" },
  { code: "SUI", english: "Switzerland", spanish: "Suiza" },
  { code: "TUN", english: "Tunisia", spanish: "Túnez" },
  { code: "TUR", english: "Türkiye", spanish: "Turquía" },
  { code: "USA", english: "United States", spanish: "Estados Unidos" },
  { code: "URU", english: "Uruguay", spanish: "Uruguay" },
  { code: "UZB", english: "Uzbekistan", spanish: "Uzbekistán" },
];
