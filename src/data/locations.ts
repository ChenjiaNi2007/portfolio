export type Coordinates = { lat: number; lng: number };

export interface ProjectLocation {
  id: string;
  type: 'project';
  title: string;
  city: string;
  coordinates: Coordinates;
  summary: string;
  description: string;
  tech: string[];
  links: { label: string; url: string }[];
  images: string[];
  pdf?: string;
  video?: string;
  important: boolean;
}

export interface PhotoLocation {
  id: string;
  type: 'photo';
  title: string;
  city: string;
  coordinates: Coordinates;
  caption: string;
  date?: string;
  photos: { src: string; alt?: string }[];
}

export type MapLocation = ProjectLocation | PhotoLocation;

const locations: MapLocation[] = [
  {
    id: 'cern',
    type: 'project',
    title: 'Lorentz-Equivariant Jet Tagging on FPGAs',
    city: 'CERN — Geneva, Switzerland',
    coordinates: { lat: 46.2333, lng: 6.05 },
    summary: 'Porting a Lorentz-equivariant neural net to FPGAs for sub-microsecond jet tagging in the CMS trigger.',
    description:
      "Implementing the nano-PELICAN Lorentz-equivariant network on FPGAs via hls4ml for low-latency jet-tagging inference in CERN's CMS trigger. Benchmarking latency, throughput, and resource use (LUTs, DSPs, BRAM) across quantization configs to meet sub-microsecond trigger timing.",
    tech: ['hls4ml', 'FPGA', 'PELICAN', 'Python', 'Machine Learning'],
    links: [
      { label: 'PELICAN-nano', url: 'https://github.com/ChenjiaNi2007/PELICAN-nano' },
      { label: 'nPELICAN-fpga', url: 'https://github.com/ChenjiaNi2007/nPELICAN-fpga' },
    ],
    images: [],
    important: true,
  },
  {
    id: 'colgate',
    type: 'project',
    title: 'Trapped-Ion Qubit Decoherence Modeling',
    city: 'Colgate University — Hamilton, NY',
    coordinates: { lat: 42.8186, lng: -75.54 },
    summary: 'Hamiltonian and Lindblad simulations of trapped-ion qubit coherence with QuTiP.',
    description:
      'Built Hamiltonian and Lindblad models for a trapped-ion qubit chain and simulated decoherence with QuTiP to evaluate T2 vs. ion spacing and noise. Cut simulation trials from hours to seconds while replicating real ion-trap coherence behavior.',
    tech: ['Python', 'QuTiP', 'Quantum Simulation'],
    links: [],
    images: [],
    pdf: '/media/colgate-paper.pdf',
    important: true,
  },
  {
    id: 'penn-polarization',
    type: 'project',
    title: 'Light Polarization Lab Automation',
    city: 'University of Pennsylvania — Philadelphia, PA',
    coordinates: { lat: 39.9522, lng: -75.1932 },
    summary: 'Automated optical polarization measurements with reproducible Python scripts.',
    description:
      'Tested optical setups to study light polarization and wrote reproducible measurement scripts in Python to automate data collection, enabling faster parameter sweeps and visualization. Processed data in C++ and Python and fit theoretical curves.',
    tech: ['Python', 'C++', 'Optics'],
    links: [],
    images: [],
    pdf: '/media/penn-polarization.pdf',
    important: false,
  },
  {
    id: 'cosmos',
    type: 'project',
    title: '3D-Printed Ionic Wind Thruster',
    city: 'UC Irvine — Irvine, CA',
    coordinates: { lat: 33.6405, lng: -117.8443 },
    summary: 'Designed and tested a 3D-printed ionic thruster studying ionic-wind propulsion.',
    description:
      'Investigated ionic wind and propulsion with Prof. Albert Siryaporn; designed and tested a 3D-printed ionic thruster across multiple operating regimes. Fabricated a custom clip in OnShape to streamline the experimental setup, cutting time between trials by 30%.',
    tech: ['OnShape', '3D Printing', 'Propulsion'],
    links: [],
    images: ['/media/cosmos1.jpg', '/media/cosmos2.jpg'],
    pdf: '/media/ion-thruster-poster.pdf',
    important: true,
  },
  {
    id: 'wifi-outlet',
    type: 'project',
    title: 'WiFi Smart Outlet Controller',
    city: 'Del Sur — San Diego, CA',
    coordinates: { lat: 33.0223, lng: -117.1295 },
    summary: 'ESP32 outlet switch with a custom enclosure and HTTP API for remote power control.',
    description:
      'Designed and prototyped a wireless outlet switch with a custom 3D-printed enclosure, integrating mechanical packaging with embedded I/O for safe, reliable remote power control. Programmed an ESP32 to host a lightweight WiFi server exposing an HTTP API that handles network requests and toggles outlet state with low-latency response.',
    tech: ['ESP32', 'HTTP API', 'WiFi', '3D Printing', 'Embedded'],
    links: [],
    images: [],
    video: '/media/wifioutlet.mp4',
    important: false,
  },
  {
    id: 'focus-pager',
    type: 'project',
    title: 'Focus Pager — BLE Companion Device',
    city: 'University of Pennsylvania — Philadelphia, PA',
    coordinates: { lat: 39.9509, lng: -75.1908 },
    summary: 'A cheap BLE device that keeps you reachable while your iPhone is intentionally bricked.',
    description:
      'A cheap BLE companion device that keeps you reachable for calls and important messages while your iPhone is bricked, with the physical device doubling as the only way to un-brick it. Uses an ESP32 to interface with the phone.',
    tech: ['ESP32', 'BLE', 'iOS', 'Embedded'],
    links: [{ label: 'GitHub', url: 'https://github.com/Jijibean/focus-pager' }],
    images: ['/media/focuspager.jpg'],
    important: true,
  },
  {
    id: 'congress-bot',
    type: 'project',
    title: 'Congressional Trade Mirror Bot',
    city: 'University of Pennsylvania — Philadelphia, PA',
    coordinates: { lat: 39.9535, lng: -75.1955 },
    summary: 'Paper-trading system that mirrors congressional STOCK Act disclosures into Alpaca.',
    description:
      'Developed a paper-trading system that mirrors congressional STOCK Act disclosures into Alpaca, ranking members via a lookahead-free copy-at-disclosure backtest. Engineered an idempotent order-reconciliation engine — target-vs-live diffing, deterministic order IDs, and an SQLite audit log — validated by 51 unit tests.',
    tech: ['Python', 'Alpaca API', 'SQLite', 'Backtesting'],
    links: [{ label: 'GitHub', url: 'https://github.com/ChenjiaNi2007/congress-mirror-bot' }],
    images: [],
    important: true,
  },
  {
    id: 'citadel',
    type: 'project',
    title: 'Citadel Discovery Day — 1st Place',
    city: 'New York City, NY',
    coordinates: { lat: 40.76, lng: -73.9712 },
    summary: 'Built a trading pipeline from data to portfolio management and won 1st in the trading competition.',
    description:
      "Attended Citadel's Discovery Day, designed a trading pipeline spanning data ingestion to portfolio management, and won 1st place in the trading competition.",
    tech: ['Trading', 'Portfolio Management', 'Quant'],
    links: [],
    images: ['/media/citadel1.jpg', '/media/citadel2.jpg', '/media/citadel3.jpg'],
    important: true,
  },
  {
    id: 'photo-puerto-rico',
    type: 'photo',
    title: 'Puerto Rico',
    city: 'San Juan, Puerto Rico',
    coordinates: { lat: 18.4655, lng: -66.1057 },
    caption: 'Spring break trip to Puerto Rico with Pan Asian Dance Troupe!',
    photos: [{ src: '/media/puertorico.jpg', alt: 'Puerto Rico' }],
  },
  {
    id: 'photo-tokyo',
    type: 'photo',
    title: 'Tokyo',
    city: 'Tokyo, Japan',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    caption: 'Visited Tokyo with the family',
    photos: [{ src: '/media/tokyo.jpg', alt: 'Tokyo' }],
  },
  {
    id: 'photo-alaska',
    type: 'photo',
    title: 'Alaska',
    city: 'Alaska, USA',
    coordinates: { lat: 64.8378, lng: -147.7164 },
    caption: 'The northern lights were more underwhelming in person',
    photos: [{ src: '/media/alaska.jpg', alt: 'Alaska northern lights' }],
  },
];

export default locations;
