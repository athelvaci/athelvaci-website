// Work history, newest first. `~~text~~` renders as a struck-through "before" value.

export interface Job {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  place: string;
  current?: boolean;
  logo?: string;
  points: string[];
  stack: string[];
}

export const jobs: Job[] = [
  {
    id: 'abn-amro',
    company: 'ABN AMRO Bank',
    role: 'Senior full-stack Java developer, IFRS-9 regulatory reporting',
    start: 'Aug 2021',
    end: 'present',
    place: 'Amsterdam',
    current: true,
    logo: '/logos/abn-amro.svg',
    points: [
      'Cut a critical monthly batch run from ~~7 hours~~ to under 45 minutes.',
      'Raised test coverage from ~~15%~~ to 80% across three applications.',
      'Rebuilt the team’s front end from AngularJS in Vue.js, using the bank’s Emerald design library.',
      'Helped move from Oracle to PostgreSQL, and three Java apps from on-prem to Azure with CI/CD, AKS and Bicep.',
      'Lead developers in the team, mentor newer colleagues and take part in technical hiring.',
    ],
    stack: ['Java 17/21', 'Spring Boot', 'Spring Batch', 'Vue.js', 'PostgreSQL', 'Azure', 'Kubernetes', 'Bicep'],
  },
  {
    id: 'mercedes',
    company: 'Mercedes (Daimler)',
    logo: '/logos/daimler.svg',
    role: 'Backend developer',
    start: 'Nov 2020',
    end: 'Jul 2021',
    place: 'Istanbul',
    points: ['Designed REST API endpoints and shipped new features in Java and Spring.'],
    stack: ['Java', 'Spring', 'REST'],
  },
  {
    id: 'n11',
    company: 'N11.com',
    logo: '/logos/n11.webp',
    role: 'Backend Java developer',
    start: 'Jul 2019',
    end: 'Nov 2020',
    place: 'Istanbul',
    points: [
      'Worked on payment integrations for an e-commerce marketplace: fixed critical bugs and tuned performance.',
      'Built REST APIs serving web, Android and iOS clients, backed by unit and integration tests.',
    ],
    stack: ['Java', 'Spring', 'Hibernate', 'JUnit', 'Mockito'],
  },
  {
    id: 'accenture',
    company: 'Accenture',
    logo: '/logos/accenture.svg',
    role: 'Full-stack developer',
    start: 'Apr 2018',
    end: 'Jul 2019',
    place: 'Istanbul',
    points: [
      'Consulted on insurance platforms for policy creation and claims processing, used by agencies, banks and brokers.',
      'Ran bi-weekly knowledge-sharing sessions on smart-contract trends for the Blockchain R&D initiative.',
    ],
    stack: ['Java', 'Spring', 'JSF', 'HTML'],
  },
  {
    id: 'credit-europe',
    company: 'Credit Europe Bank',
    logo: '/logos/credit-europe-bank.webp',
    role: 'Blockchain R&D intern',
    start: '2017',
    end: '2017',
    place: 'Amsterdam',
    points: ['Researched blockchain and wrote Solidity smart contracts on Ethereum.'],
    stack: ['Solidity', 'Ethereum'],
  },
];

export const schools = [
  { name: 'Boğaziçi University', degree: 'MSc, Software Engineering', year: '2022', place: 'Istanbul' },
  { name: 'Kadir Has University', degree: 'BSc, Computer Engineering', year: '2017', place: 'Istanbul' },
];

export const languages = [
  { name: 'English', level: 'Fluent', dots: 5 },
  { name: 'Turkish', level: 'Native', dots: 5 },
  { name: 'Dutch', level: 'Learning', dots: 2 },
];
