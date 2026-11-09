// The periodic table of skills. Add, remove or reorder freely: atomic numbers follow the order below.

export const groups = [
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Front end' },
  { id: 'data', label: 'Data' },
  { id: 'cloud', label: 'Cloud and DevOps' },
  { id: 'quality', label: 'Quality' },
  { id: 'other', label: 'Other' },
] as const;

export type GroupId = (typeof groups)[number]['id'];

export interface Element {
  sym: string;
  name: string;
  group: GroupId;
  note: string;
}

export const elements: Element[] = [
  { sym: 'Jv', name: 'Java 17/21', group: 'backend', note: 'My home language. Written nearly every working day for nine-plus years.' },
  { sym: 'Sb', name: 'Spring Boot', group: 'backend', note: 'REST APIs, batch jobs and security, without the XML of old.' },
  { sym: 'Sx', name: 'Spring Batch', group: 'backend', note: 'Monthly regulatory runs that have to finish, and finish correctly.' },
  { sym: 'Ss', name: 'Spring Security', group: 'backend', note: 'Who may do what, and a way to prove it.' },
  { sym: 'Hb', name: 'Hibernate / JPA', group: 'backend', note: 'Object mapping, with a healthy respect for the N+1 problem.' },
  { sym: 'Rs', name: 'REST design', group: 'backend', note: 'Contracts you can read without a decoder ring.' },
  { sym: 'Jk', name: 'Jakarta EE', group: 'backend', note: 'JSF and JPA from my Accenture years.' },

  { sym: 'Vu', name: 'Vue.js', group: 'frontend', note: 'Rebuilt my team’s front end in Vue, on top of the bank’s design library.' },
  { sym: 'Ag', name: 'AngularJS', group: 'frontend', note: 'Retired with honors.' },
  { sym: 'Hc', name: 'HTML and CSS', group: 'frontend', note: 'Yes, I enjoy this too. See: this website.' },

  { sym: 'Pg', name: 'PostgreSQL', group: 'data', note: 'Schema design and gnarly queries, plus the Oracle migration.' },
  { sym: 'Or', name: 'Oracle', group: 'data', note: 'Where the data lived before the move to PostgreSQL.' },
  { sym: 'Sq', name: 'SQL', group: 'data', note: 'The cheapest speed-up is usually a better query.' },

  { sym: 'Az', name: 'Azure', group: 'cloud', note: 'Where three Java apps went when they left the data center.' },
  { sym: 'K8', name: 'Kubernetes', group: 'cloud', note: 'AKS, where those apps live now.' },
  { sym: 'Dk', name: 'Docker', group: 'cloud', note: 'The same behavior on my laptop and in production.' },
  { sym: 'Ad', name: 'Azure DevOps', group: 'cloud', note: 'CI/CD pipelines that run so I don’t have to.' },
  { sym: 'Bi', name: 'Bicep', group: 'cloud', note: 'Azure resources, written as code.' },
  { sym: 'Gt', name: 'Git', group: 'cloud', note: 'Small commits, careful rebases.' },

  { sym: 'Ju', name: 'JUnit 5', group: 'quality', note: 'Took three applications from 15% to 80% test coverage.' },
  { sym: 'Mk', name: 'Mockito', group: 'quality', note: 'Faking collaborators so tests stay fast.' },
  { sym: 'Cr', name: 'Code review', group: 'quality', note: 'Where most of my mentoring happens.' },
  { sym: 'Cc', name: 'Clean code', group: 'quality', note: 'SOLID, readable first, clever never.' },

  { sym: 'Ai', name: 'AI assistants', group: 'other', note: 'Copilot and friends as pair programmers: trust, but review.' },
];
