export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
];

export const DEFAULT_LANGUAGE = 'javascript';

export const DEFAULT_CONTENT = `function greet(name) {
  // This is a collaborative editor
  // Any changes you make are visible to others in real-time
  return \`Welcome to CollabX, \${name}!\`;
}

// Try editing this code together with your team
const message = greet('Team');
console.log(message);`;

export const coolUsernames = [
  'ByteMaster',
  'PixelNinja',
  'CodeWizard',
  'DataDragon',
  'CyberPanda',
  'QuantumFox',
  'SyntaxRaven',
  'LogicLynx',
  'BinaryBadger',
  'TechTiger',
  'AlgoAlien',
  'CloudKoala',
  'DevDragon',
  'ScriptSage',
  'NeonNebula',
  'CryptoCat',
  'DigitalDolphin',
  'WebWolf',
  'CodeCrane',
  'DataDeer',
];

export function getRandomColor(): string {
  const colors = [
    '#330000', // Darkest red
    '#1A0033', // Darkest pink
    '#0D0019', // Darkest purple
    '#0A0019', // Darkest deep purple
    '#050019', // Darkest indigo
    '#000033', // Darkest blue
    '#000033', // Darkest light blue
    '#001919', // Darkest cyan
    '#000D0A', // Darkest teal
    '#05140A', // Darkest green
    '#0A1E0A', // Darkest light green
    '#1A1A00', // Darkest lime
    '#1A1A00', // Darkest yellow
    '#1A0A00', // Darkest orange
    '#1A0500', // Darkest deep orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getRandomUsername(): string {
  const randomIndex = Math.floor(Math.random() * coolUsernames.length);
  // Add a random number to make it more unique
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${coolUsernames[randomIndex]}${randomSuffix}`;
} 