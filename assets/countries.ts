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
  { code: "AFG", english: "Afghanistan", spanish: "Afganistán" },
  { code: "ALG", english: "Algeria", spanish: "Argelia" },
  { code: "ARG", english: "Argentina", spanish: "Argentina" },
  { code: "AUS", english: "Australia", spanish: "Australia" },
  { code: "AUT", english: "Austria", spanish: "Austria" },
  { code: "BAN", english: "Bangladesh", spanish: "Bangladés" },
  { code: "BEL", english: "Belgium", spanish: "Bélgica" },
  { code: "BHR", english: "Bahrain", spanish: "Baréin" },
  { code: "BHU", english: "Bhutan", spanish: "Bután" },
  { code: "BIH", english: "Bosnia and Herzegovina", spanish: "Bosnia y Herzegovina" },
  { code: "BOC", english: "Bocas del Toro", spanish: "Bocas del Toro" },
  { code: "BRA", english: "Brazil", spanish: "Brasil" },
  { code: "BRU", english: "Brunei", spanish: "Brunéi" },
  { code: "CAM", english: "Cambodia", spanish: "Camboya" },
  { code: "CAN", english: "Canada", spanish: "Canadá" },
  { code: "CHI", english: "Chiriquí", spanish: "Chiriquí" },
  { code: "CHN", english: "China", spanish: "China" },
  { code: "CIV", english: "Ivory Coast", spanish: "Costa de Marfil" },
  { code: "CLE", english: "Coclé", spanish: "Coclé" },
  { code: "CLN", english: "Colón", spanish: "Colón" },
  { code: "COD", english: "DR Congo", spanish: "República Democrática del Congo" },
  { code: "COL", english: "Colombia", spanish: "Colombia" },
  { code: "CPV", english: "Cape Verde", spanish: "Cabo Verde" },
  { code: "CRC", english: "Costa Rica", spanish: "Costa Rica" },
  { code: "CRO", english: "Croatia", spanish: "Croacia" },
  { code: "CUW", english: "Curaçao", spanish: "Curazao" },
  { code: "CZE", english: "Czech Republic", spanish: "República Checa" },
  { code: "DAR", english: "Darién", spanish: "Darién" },
  { code: "ECU", english: "Ecuador", spanish: "Ecuador" },
  { code: "EGY", english: "Egypt", spanish: "Egipto" },
  { code: "ENG", english: "England", spanish: "Inglaterra" },
  { code: "ESP", english: "Spain", spanish: "España" },
  { code: "FRA", english: "France", spanish: "Francia" },
  { code: "GER", english: "Germany", spanish: "Alemania" },
  { code: "GHA", english: "Ghana", spanish: "Ghana" },
  { code: "HAI", english: "Haiti", spanish: "Haití" },
  { code: "HER", english: "Herrera", spanish: "Herrera" },
  { code: "HKG", english: "Hong Kong", spanish: "Hong Kong" },
  { code: "IDN", english: "Indonesia", spanish: "Indonesia" },
  { code: "IND", english: "India", spanish: "India" },
  { code: "IRN", english: "Iran", spanish: "Irán" },
  { code: "IRQ", english: "Iraq", spanish: "Irak" },
  { code: "JOR", english: "Jordan", spanish: "Jordania" },
  { code: "JPN", english: "Japan", spanish: "Japón" },
  { code: "KAZ", english: "Kazakhstan", spanish: "Kazajistán" },
  { code: "KGZ", english: "Kyrgyzstan", spanish: "Kirguistán" },
  { code: "KOR", english: "South Korea", spanish: "Corea del Sur" },
  { code: "KSA", english: "Saudi Arabia", spanish: "Arabia Saudita" },
  { code: "KUW", english: "Kuwait", spanish: "Kuwait" },
  { code: "LAO", english: "Laos", spanish: "Laos" },
  { code: "LBN", english: "Lebanon", spanish: "Líbano" },
  { code: "LSA", english: "Los Santos", spanish: "Los Santos" },
  { code: "MAR", english: "Morocco", spanish: "Marruecos" },
  { code: "MAS", english: "Malaysia", spanish: "Malasia" },
  { code: "MDV", english: "Maldives", spanish: "Maldivas" },
  { code: "MEX", english: "Mexico", spanish: "México" },
  { code: "MNG", english: "Mongolia", spanish: "Mongolia" },
  { code: "MYA", english: "Myanmar", spanish: "Myanmar" },
  { code: "NED", english: "Netherlands", spanish: "Países Bajos" },
  { code: "NEP", english: "Nepal", spanish: "Nepal" },
  { code: "NOR", english: "Norway", spanish: "Noruega" },
  { code: "NZL", english: "New Zealand", spanish: "Nueva Zelanda" },
  { code: "OMA", english: "Oman", spanish: "Omán" },
  { code: "PAK", english: "Pakistan", spanish: "Pakistán" },
  { code: "PAM", english: "Panama Province", spanish: "Provincia de Panamá" },
  { code: "PAN", english: "Panama", spanish: "Panamá" },
  { code: "PAO", english: "West Panama", spanish: "Panamá Oeste" },
  { code: "PAR", english: "Paraguay", spanish: "Paraguay" },
  { code: "PHI", english: "Philippines", spanish: "Filipinas" },
  { code: "PLE", english: "Palestine", spanish: "Palestina" },
  { code: "POR", english: "Portugal", spanish: "Portugal" },
  { code: "PRK", english: "North Korea", spanish: "Corea del Norte" },
  { code: "QAT", english: "Qatar", spanish: "Catar" },
  { code: "RSA", english: "South Africa", spanish: "Sudáfrica" },
  { code: "SCO", english: "Scotland", spanish: "Escocia" },
  { code: "SEN", english: "Senegal", spanish: "Senegal" },
  { code: "SGP", english: "Singapore", spanish: "Singapur" },
  { code: "SRI", english: "Sri Lanka", spanish: "Sri Lanka" },
  { code: "SUI", english: "Switzerland", spanish: "Suiza" },
  { code: "SWE", english: "Sweden", spanish: "Suecia" },
  { code: "SYR", english: "Syria", spanish: "Siria" },
  { code: "THA", english: "Thailand", spanish: "Tailandia" },
  { code: "TJK", english: "Tajikistan", spanish: "Tayikistán" },
  { code: "TKM", english: "Turkmenistan", spanish: "Turkmenistán" },
  { code: "TLS", english: "East Timor", spanish: "Timor Oriental" },
  { code: "TUN", english: "Tunisia", spanish: "Túnez" },
  { code: "TUR", english: "Türkiye", spanish: "Turquía" },
  { code: "UAE", english: "United Arab Emirates", spanish: "Emiratos Árabes Unidos" },
  { code: "URU", english: "Uruguay", spanish: "Uruguay" },
  { code: "USA", english: "United States", spanish: "Estados Unidos" },
  { code: "UZB", english: "Uzbekistan", spanish: "Uzbekistán" },
  { code: "VIE", english: "Vietnam", spanish: "Vietnam" },
  { code: "VRG", english: "Veraguas", spanish: "Veraguas" },
  { code: "YEM", english: "Yemen", spanish: "Yemen" },
];
