import type { MEP, VoteResult, Committee, CorporateBody, GroupVote } from '../types';

const POLISH_PARTIES = ['PiS', 'PO', 'Lewica', 'PSL', 'Konfederacja', 'Polska 2050'];
const GROUPS = ['EPP', 'S&D', 'RE', 'Greens/EFA', 'ECR', 'The Left', 'PfE', 'NI', 'ESN'];
const GROUP_FULL: Record<string, string> = {
  'EPP': 'European People\'s Party',
  'S&D': 'Progressive Alliance of Socialists and Democrats',
  'RE': 'Renew Europe',
  'Greens/EFA': 'Greens/European Free Alliance',
  'ECR': 'European Conservatives and Reformists',
  'The Left': 'The Left in the European Parliament',
  'PfE': 'Patriots for Europe',
  'NI': 'Non-Inscrits',
  'ESN': 'Europe of Sovereign Nations',
};

const COUNTRIES = [
  { code: 'PL', name: 'Poland', seats: 52 },
  { code: 'DE', name: 'Germany', seats: 96 },
  { code: 'FR', name: 'France', seats: 81 },
  { code: 'IT', name: 'Italy', seats: 76 },
  { code: 'ES', name: 'Spain', seats: 61 },
  { code: 'RO', name: 'Romania', seats: 33 },
  { code: 'NL', name: 'Netherlands', seats: 31 },
  { code: 'BE', name: 'Belgium', seats: 22 },
  { code: 'CZ', name: 'Czechia', seats: 21 },
  { code: 'GR', name: 'Greece', seats: 21 },
  { code: 'HU', name: 'Hungary', seats: 21 },
  { code: 'PT', name: 'Portugal', seats: 21 },
  { code: 'SE', name: 'Sweden', seats: 21 },
  { code: 'AT', name: 'Austria', seats: 20 },
  { code: 'BG', name: 'Bulgaria', seats: 17 },
  { code: 'DK', name: 'Denmark', seats: 15 },
  { code: 'FI', name: 'Finland', seats: 15 },
  { code: 'SK', name: 'Slovakia', seats: 15 },
  { code: 'IE', name: 'Ireland', seats: 14 },
  { code: 'HR', name: 'Croatia', seats: 12 },
  { code: 'LT', name: 'Lithuania', seats: 11 },
  { code: 'LV', name: 'Latvia', seats: 9 },
  { code: 'SI', name: 'Slovenia', seats: 9 },
  { code: 'EE', name: 'Estonia', seats: 7 },
  { code: 'CY', name: 'Cyprus', seats: 6 },
  { code: 'LU', name: 'Luxembourg', seats: 6 },
  { code: 'MT', name: 'Malta', seats: 6 },
];

const POLISH_MEPS_NAMES = [
  ['Bartosz', 'Arłukowicz', 'PO', 'EPP'],
  ['Marek', 'Belka', 'Lewica', 'S&D'],
  ['Adam', 'Bielan', 'PiS', 'ECR'],
  ['Joachim', 'Brudziński', 'PiS', 'ECR'],
  ['Jerzy', 'Buzek', 'PO', 'EPP'],
  ['Ryszard', 'Czarnecki', 'PiS', 'ECR'],
  ['Anna', 'Fotyga', 'PiS', 'ECR'],
  ['Tomasz', 'Frankowski', 'PO', 'EPP'],
  ['Andrzej', 'Halicki', 'PO', 'EPP'],
  ['Krzysztof', 'Hetman', 'PSL', 'EPP'],
  ['Danuta', 'Hübner', 'PO', 'EPP'],
  ['Patryk', 'Jaki', 'PiS', 'ECR'],
  ['Adam', 'Jarubas', 'PSL', 'EPP'],
  ['Karol', 'Karski', 'PiS', 'ECR'],
  ['Beata', 'Kempa', 'PiS', 'ECR'],
  ['Izabela-Helena', 'Kloc', 'PiS', 'ECR'],
  ['Łukasz', 'Kohut', 'Lewica', 'S&D'],
  ['Ewa', 'Kopacz', 'PO', 'EPP'],
  ['Joanna', 'Kopcińska', 'PiS', 'ECR'],
  ['Zdzisław', 'Krasnodębski', 'PiS', 'ECR'],
  ['Elżbieta', 'Kruk', 'PiS', 'ECR'],
  ['Robert', 'Lewandowski', 'PO', 'EPP'],
  ['Bogdan', 'Marcinkiewicz', 'PO', 'EPP'],
  ['Leszek', 'Miller', 'Lewica', 'S&D'],
  ['Andżelika', 'Możdżanowska', 'PiS', 'ECR'],
  ['Janina', 'Ochojska', 'PO', 'EPP'],
  ['Jan', 'Olbrycht', 'PO', 'EPP'],
  ['Tomasz', 'Poręba', 'PiS', 'ECR'],
  ['Elżbieta', 'Rafalska', 'PiS', 'ECR'],
  ['Bogdan', 'Rzońca', 'PiS', 'ECR'],
  ['Jacek', 'Saryusz-Wolski', 'PiS', 'ECR'],
  ['Radosław', 'Sikorski', 'PO', 'EPP'],
  ['Beata', 'Szydło', 'PiS', 'ECR'],
  ['Róża', 'Thun', 'PO', 'RE'],
  ['Grzegorz', 'Tobiszowski', 'PiS', 'ECR'],
  ['Witold', 'Waszczykowski', 'PiS', 'ECR'],
  ['Jadwiga', 'Wiśniewska', 'PiS', 'ECR'],
  ['Anna', 'Zalewska', 'PiS', 'ECR'],
  ['Kosma', 'Złotowski', 'PiS', 'ECR'],
  ['Ewa', 'Zajączkowska-Hernik', 'Konfederacja', 'ESN'],
];

const FIRST_NAMES_BY_COUNTRY: Record<string, string[]> = {
  DE: ['Hans', 'Klaus', 'Petra', 'Ursula', 'Markus', 'Stefan', 'Monika', 'Christine'],
  FR: ['Jean', 'Pierre', 'Marie', 'Sophie', 'François', 'Nathalie', 'Dominique', 'Raphaël'],
  IT: ['Marco', 'Giuseppe', 'Maria', 'Francesca', 'Antonio', 'Lucia', 'Paolo', 'Silvia'],
  ES: ['Carlos', 'María', 'José', 'Ana', 'Pedro', 'Isabel', 'Luis', 'Elena'],
  RO: ['Alexandru', 'Maria', 'Ion', 'Elena', 'Cristian', 'Ioana', 'Daniel', 'Mihaela'],
  NL: ['Jan', 'Pieter', 'Sophie', 'Esther', 'Bas', 'Malik', 'Derk', 'Annie'],
  BE: ['Marc', 'Philippe', 'Hilde', 'Guy', 'Kathleen', 'Koen', 'Assita', 'Tom'],
  CZ: ['Jan', 'Petr', 'Tomáš', 'Lucie', 'Markéta', 'Ondřej', 'Dita', 'Veronika'],
  GR: ['Nikos', 'Manolis', 'Eva', 'Stelios', 'Maria', 'Dimitrios', 'Eleni', 'Petros'],
  HU: ['Tamás', 'Anna', 'László', 'Katalin', 'Balázs', 'Enikő', 'Csaba', 'Kinga'],
  PT: ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Isabel', 'José', 'Marisa'],
  SE: ['Erik', 'Malin', 'Johan', 'Abir', 'Alice', 'Peter', 'Sara', 'Jakop'],
  AT: ['Wolfgang', 'Othmar', 'Claudia', 'Lukas', 'Monika', 'Andreas', 'Evelyn', 'Angelika'],
  BG: ['Andrey', 'Elena', 'Radan', 'Emil', 'Tsvetelina', 'Ilhan', 'Iskra', 'Petar'],
  DK: ['Niels', 'Morten', 'Karen', 'Christel', 'Kira', 'Søren', 'Asger', 'Bergur'],
  FI: ['Eero', 'Henna', 'Ville', 'Silvia', 'Laura', 'Nils', 'Miapetra', 'Mauri'],
  SK: ['Robert', 'Miriam', 'Eugen', 'Lucia', 'Vladimír', 'Monika', 'Ivan', 'Martin'],
  IE: ['Ciarán', 'Deirdre', 'Barry', 'Maria', 'Seán', 'Grace', 'Billy', 'Regina'],
  HR: ['Tonino', 'Sunčana', 'Biljana', 'Romana', 'Karlo', 'Valter', 'Predrag', 'Ladislav'],
  LT: ['Petras', 'Vilija', 'Aušra', 'Juozas', 'Rasa', 'Andrius', 'Bronis', 'Stasys'],
  LV: ['Sandra', 'Roberts', 'Ivars', 'Inese', 'Nils', 'Dace', 'Arturs', 'Tatjana'],
  SI: ['Milan', 'Ljudmila', 'Irena', 'Tanja', 'Franc', 'Romana', 'Klemen', 'Matjaž'],
  EE: ['Marina', 'Yana', 'Urmas', 'Riho', 'Sven', 'Jana', 'Jaak'],
  CY: ['Niyazi', 'Giorgos', 'Demetris', 'Loucas', 'Eleni', 'Fidias'],
  LU: ['Charles', 'Marc', 'Monica', 'Isabel', 'Christophe', 'Tilly'],
  MT: ['Roberta', 'Alfred', 'David', 'Josianne', 'Alex', 'Daniel'],
};

const LAST_NAMES_BY_COUNTRY: Record<string, string[]> = {
  DE: ['Müller', 'Weber', 'Schmidt', 'von der Leyen', 'Scholz', 'Becker', 'Giegold', 'Liese'],
  FR: ['Dupont', 'Martin', 'Leroy', 'Aubry', 'Glucksmann', 'Hayer', 'Bellamy', 'Bardella'],
  IT: ['Rossi', 'Ferrara', 'Moretti', 'Ferrara', 'Ferrara', 'Ferrara', 'Ferrara', 'Ferrara'],
  ES: ['García', 'López', 'Rodríguez', 'González', 'Estarás', 'Borràs', 'Solís', 'Aguilar'],
  RO: ['Popa', 'Ionescu', 'Mureșan', 'Drăghici', 'Nistor', 'Bușoi', 'Winkler', 'Falcă'],
  NL: ['de Vries', 'van Berg', 'Schreijer', 'Azmani', 'in\'t Veld', 'Jongerius', 'Bos', 'Lenaers'],
  BE: ['Verhofstadt', 'Lutgen', 'Arimont', 'Tarabella', 'Vandendriessche', 'Lacapelle', 'Botenga', 'Kanko'],
  CZ: ['Zdechovský', 'Niedermayer', 'Charanzová', 'Dlabajová', 'Konečná', 'Polčák', 'Pospíšil', 'Gregorová'],
  GR: ['Papadakis', 'Androulakis', 'Kefalogiannis', 'Spyraki', 'Arvanitis', 'Kympouropoulos', 'Georgoulis', 'Meimarakis'],
  HU: ['Deutsch', 'Donáth', 'Cseh', 'Ujhelyi', 'Hidvéghi', 'Trócsányi', 'Gál', 'Deli'],
  PT: ['Silva', 'Santos', 'Marques', 'Zorrinho', 'Carvalhais', 'Pimenta Lopes', 'Rangel', 'Monteiro'],
  SE: ['Johansson', 'Guteland', 'Federley', 'Al-Sahlani', 'Danielsson', 'Pehrson', 'Incir', 'Björk'],
  AT: ['Karas', 'Regner', 'Mandl', 'Schieder', 'Wieland', 'Gamon', 'Ernst', 'Haider'],
  BG: ['Kovatchev', 'Vitanov', 'Yoncheva', 'Maydell', 'Kyuchyuk', 'Mihaylova', 'Novakov', 'Penkova'],
  DK: ['Auken', 'Fuglsang', 'Kofod', 'Rohde', 'Christensen', 'Schaldemose', 'Villumsen', 'Poulsen'],
  FI: ['Torvalds', 'Sarvamaa', 'Hakkarainen', 'Kumpula-Natri', 'Virkkunen', 'Niinistö', 'Pekkarinen', 'Katainen'],
  SK: ['Štefanec', 'Lexmann', 'Hajšel', 'Beňová', 'Bilčík', 'Číž', 'Jurzyca', 'Pollák'],
  IE: ['Kelleher', 'Andrews', 'Clune', 'Flanagan', 'Daly', 'O\'Sullivan', 'Fitzgerald', 'Kelly'],
  HR: ['Picula', 'Šuica', 'Sinčić', 'Kolakušić', 'Tomašić', 'Ressler', 'Bačić', 'Ilčić'],
  LT: ['Auštrevičius', 'Blinkevičiūtė', 'Maldeikienė', 'Gentvilas', 'Juknevičienė', 'Ušackas', 'Kubilius', 'Saudargas'],
  LV: ['Ījabs', 'Kalniete', 'Zīle', 'Ždanoka', 'Dombrovskis', 'Pabriks', 'Vaidere', 'Mamikins'],
  SI: ['Fajon', 'Joveva', 'Brglez', 'Bogovič', 'Grošelj', 'Zver', 'Novak', 'Tomc'],
  EE: ['Ansip', 'Kaljurand', 'Paet', 'Madison', 'Toom', 'Kallas', 'Tarand'],
  CY: ['Mavrides', 'Papadakis', 'Stylianides', 'Theocharous', 'Georgiou', 'Panayotopoulos'],
  LU: ['Goerens', 'Engel', 'Turmes', 'Semedo', 'Hansen', 'Metz'],
  MT: ['Metsola', 'Sant', 'Casa', 'Agius Saliba', 'Cutajar', 'Cauchi'],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMEPs(): MEP[] {
  const meps: MEP[] = [];
  let globalId = 100000;
  const rand = seededRandom(42);

  for (const [first, last, party, group] of POLISH_MEPS_NAMES) {
    meps.push({
      id: String(globalId),
      identifier: String(globalId),
      fullName: `${first} ${last}`,
      firstName: first,
      lastName: last,
      country: 'Poland',
      countryCode: 'PL',
      politicalGroup: GROUP_FULL[group] || group,
      politicalGroupShort: group,
      nationalParty: party,
      photoUrl: `https://www.europarl.europa.eu/mepphoto/${globalId}.jpg`,
      active: true,
      gender: ['Anna', 'Beata', 'Danuta', 'Elżbieta', 'Ewa', 'Izabela-Helena', 'Jadwiga', 'Janina', 'Joanna', 'Róża', 'Andżelika'].includes(first) ? 'female' : 'male',
    });
    globalId++;
  }

  for (const country of COUNTRIES) {
    if (country.code === 'PL') continue;
    const firstNames = FIRST_NAMES_BY_COUNTRY[country.code] || ['Alex', 'Sam', 'Chris', 'Pat'];
    const lastNames = LAST_NAMES_BY_COUNTRY[country.code] || ['Smith', 'Jones', 'Brown', 'Wilson'];

    const seatsToGenerate = Math.min(country.seats, 12);
    for (let i = 0; i < seatsToGenerate; i++) {
      const fn = firstNames[Math.floor(rand() * firstNames.length)];
      const ln = lastNames[Math.floor(rand() * lastNames.length)];
      const group = GROUPS[Math.floor(rand() * GROUPS.length)];

      meps.push({
        id: String(globalId),
        identifier: String(globalId),
        fullName: `${fn} ${ln}`,
        firstName: fn,
        lastName: ln,
        country: country.name,
        countryCode: country.code,
        politicalGroup: GROUP_FULL[group] || group,
        politicalGroupShort: group,
        nationalParty: '',
        photoUrl: `https://www.europarl.europa.eu/mepphoto/${globalId}.jpg`,
        active: true,
        gender: rand() > 0.5 ? 'female' : 'male',
      });
      globalId++;
    }
  }

  return meps;
}

const COMMITTEE_DATA: [string, string][] = [
  ['AFET', 'Foreign Affairs'],
  ['DEVE', 'Development'],
  ['INTA', 'International Trade'],
  ['BUDG', 'Budgets'],
  ['CONT', 'Budgetary Control'],
  ['ECON', 'Economic and Monetary Affairs'],
  ['EMPL', 'Employment and Social Affairs'],
  ['ENVI', 'Environment, Public Health and Food Safety'],
  ['ITRE', 'Industry, Research and Energy'],
  ['IMCO', 'Internal Market and Consumer Protection'],
  ['TRAN', 'Transport and Tourism'],
  ['REGI', 'Regional Development'],
  ['AGRI', 'Agriculture and Rural Development'],
  ['PECH', 'Fisheries'],
  ['CULT', 'Culture and Education'],
  ['JURI', 'Legal Affairs'],
  ['LIBE', 'Civil Liberties, Justice and Home Affairs'],
  ['AFCO', 'Constitutional Affairs'],
  ['FEMM', 'Women\'s Rights and Gender Equality'],
  ['PETI', 'Petitions'],
];

function generateCommittees(): Committee[] {
  return COMMITTEE_DATA.map(([short, name]) => ({
    id: short,
    name: `Committee on ${name}`,
    shortName: short,
    role: '',
    type: 'committee',
  }));
}

function generateVotes(): VoteResult[] {
  const rand = seededRandom(123);
  const votes: VoteResult[] = [];

  const topics = [
    { title: 'European Green Deal - Fit for 55 package', subject: 'Environment' },
    { title: 'Digital Services Act (DSA)', subject: 'Digital' },
    { title: 'Digital Markets Act (DMA)', subject: 'Digital' },
    { title: 'AI Act - Artificial Intelligence Regulation', subject: 'Digital' },
    { title: 'Migration and Asylum Pact', subject: 'Migration' },
    { title: 'Common Agricultural Policy Reform', subject: 'Agriculture' },
    { title: 'EU Budget 2024-2027 Framework', subject: 'Budget' },
    { title: 'European Defence Industrial Strategy', subject: 'Defence' },
    { title: 'Critical Raw Materials Act', subject: 'Industry' },
    { title: 'Nature Restoration Law', subject: 'Environment' },
    { title: 'Corporate Sustainability Due Diligence', subject: 'Environment' },
    { title: 'Euro 7 Emission Standards', subject: 'Environment' },
    { title: 'European Media Freedom Act', subject: 'Media' },
    { title: 'Packaging and Packaging Waste Regulation', subject: 'Environment' },
    { title: 'Right to Repair Directive', subject: 'Consumer' },
    { title: 'European Health Data Space', subject: 'Health' },
    { title: 'Anti-Money Laundering Package', subject: 'Finance' },
    { title: 'Platform Workers Directive', subject: 'Employment' },
    { title: 'Deforestation Regulation', subject: 'Environment' },
    { title: 'Chips Act - European Semiconductor Strategy', subject: 'Industry' },
    { title: 'Energy Performance of Buildings Directive', subject: 'Energy' },
    { title: 'Cyber Resilience Act', subject: 'Digital' },
    { title: 'European Hydrogen Strategy', subject: 'Energy' },
    { title: 'Schengen Area Enlargement', subject: 'Internal Affairs' },
    { title: 'EU-Ukraine Association Agreement Update', subject: 'Foreign Affairs' },
  ];

  const dates = [
    '2024-01-17', '2024-02-06', '2024-02-28', '2024-03-12', '2024-03-13',
    '2024-04-10', '2024-04-24', '2024-05-09', '2024-06-12', '2024-07-17',
    '2024-09-17', '2024-10-08', '2024-10-22', '2024-11-13', '2024-11-28',
    '2024-12-17', '2025-01-15', '2025-01-29', '2025-02-12', '2025-02-27',
    '2025-03-12', '2025-04-02', '2025-04-16', '2025-05-07', '2025-05-22',
  ];

  for (let i = 0; i < topics.length; i++) {
    const totalVoters = Math.floor(rand() * 100) + 600;
    const forRatio = rand() * 0.5 + 0.3;
    const againstRatio = rand() * 0.3 + 0.1;
    const totalFor = Math.floor(totalVoters * forRatio);
    const totalAgainst = Math.floor(totalVoters * againstRatio);
    const totalAbstention = totalVoters - totalFor - totalAgainst;

    const groups: GroupVote[] = GROUPS.filter(g => g !== 'NI').map((group) => {
      const groupSize = Math.floor(rand() * 40) + 15;
      const gFor = Math.floor(rand() * groupSize * 0.8);
      const gAgainst = Math.floor(rand() * (groupSize - gFor) * 0.7);
      return {
        group: GROUP_FULL[group] || group,
        groupShort: group,
        votesFor: gFor,
        votesAgainst: gAgainst,
        abstentions: groupSize - gFor - gAgainst,
        noVote: Math.floor(rand() * 5),
      };
    });

    votes.push({
      id: `vote-${i}`,
      title: topics[i].title,
      date: dates[i] || '2025-06-01',
      documentRef: `A9-${String(i + 100).padStart(4, '0')}/2024`,
      totalFor,
      totalAgainst,
      totalAbstention,
      subject: topics[i].subject,
      groups,
    });
  }

  return votes;
}

const ALL_MEPS = generateMEPs();
const ALL_COMMITTEES = generateCommittees();
const ALL_VOTES = generateVotes();

// Assign committees to MEPs
const rand = seededRandom(999);
for (const mep of ALL_MEPS) {
  const numCommittees = Math.floor(rand() * 3) + 1;
  const shuffled = [...ALL_COMMITTEES].sort(() => rand() - 0.5);
  mep.committees = shuffled.slice(0, numCommittees).map((c) => ({
    ...c,
    role: rand() > 0.8 ? 'Vice-Chair' : rand() > 0.9 ? 'Chair' : 'Member',
  }));
}

export function getMockMEPs(params: {
  offset?: number;
  limit?: number;
  countryCode?: string;
  group?: string;
  search?: string;
  committee?: string;
} = {}): { items: MEP[]; total: number } {
  let filtered = [...ALL_MEPS];

  if (params.countryCode) {
    filtered = filtered.filter((m) => m.countryCode === params.countryCode);
  }
  if (params.group) {
    filtered = filtered.filter((m) => m.politicalGroupShort === params.group);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.nationalParty.toLowerCase().includes(q)
    );
  }
  if (params.committee) {
    filtered = filtered.filter(
      (m) => m.committees?.some((c) => c.shortName === params.committee)
    );
  }

  const offset = params.offset || 0;
  const limit = params.limit || 20;
  const items = filtered.slice(offset, offset + limit);

  return { items, total: filtered.length };
}

export function getMockMEPById(id: string): MEP | undefined {
  return ALL_MEPS.find((m) => m.id === id);
}

export function getMockPolishMEPs(): MEP[] {
  return ALL_MEPS.filter((m) => m.countryCode === 'PL');
}

export function getMockCommittees(): Committee[] {
  return ALL_COMMITTEES;
}

export function getMockCommitteeMembers(committeeShort: string): MEP[] {
  return ALL_MEPS.filter(
    (m) => m.committees?.some((c) => c.shortName === committeeShort)
  );
}

export function getMockVotes(): VoteResult[] {
  return ALL_VOTES;
}

export function getMockCorporateBodies(): CorporateBody[] {
  return [
    ...GROUPS.map((g) => ({
      id: g,
      notation: g,
      prefLabel: GROUP_FULL[g] || g,
      type: 'PoliticalGroup',
      memberCount: ALL_MEPS.filter((m) => m.politicalGroupShort === g).length,
    })),
    ...ALL_COMMITTEES.map((c) => ({
      id: c.shortName,
      notation: c.shortName,
      prefLabel: c.name,
      type: 'Committee',
      memberCount: ALL_MEPS.filter(
        (m) => m.committees?.some((mc) => mc.shortName === c.shortName)
      ).length,
    })),
  ];
}

export function getMockGroupStats() {
  const groups = GROUPS.map((g) => {
    const members = ALL_MEPS.filter((m) => m.politicalGroupShort === g);
    return {
      short: g,
      full: GROUP_FULL[g] || g,
      mepCount: members.length,
      countries: [...new Set(members.map((m) => m.countryCode))].length,
    };
  });
  return groups.sort((a, b) => b.mepCount - a.mepCount);
}

export function getMockCountryStats() {
  return COUNTRIES.map((c) => {
    const members = ALL_MEPS.filter((m) => m.countryCode === c.code);
    const groupCounts: Record<string, number> = {};
    for (const m of members) {
      groupCounts[m.politicalGroupShort] = (groupCounts[m.politicalGroupShort] || 0) + 1;
    }
    return {
      country: c.name,
      countryCode: c.code,
      mepCount: members.length,
      totalSeats: c.seats,
      groups: groupCounts,
    };
  }).sort((a, b) => b.totalSeats - a.totalSeats);
}
