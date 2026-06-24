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
  // REPLACE with real content
  {
    id: 'project-1',
    type: 'project',
    title: 'Interactive Globe Portfolio',
    city: 'San Francisco, CA',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    summary: 'A cinematic 3D portfolio you explore by flying a plane around Earth.',
    description:
      'This very portfolio — built with React Three Fiber, Three.js, and react-leaflet. Visitors pilot a small plane around a textured globe, discovering projects and photos pinned at real-world coordinates. Features proximity popups, a passport stamp system, and building-level Leaflet maps.',
    tech: ['React', 'TypeScript', 'Three.js', 'React Three Fiber', 'Drei', 'react-leaflet', 'Vite'],
    links: [
      { label: 'GitHub', url: 'https://github.com/yourusername/portfolio' },
      { label: 'Live Site', url: 'https://yoursite.com' },
    ],
    images: [],
    important: true,
  },
  // REPLACE with real content
  {
    id: 'project-2',
    type: 'project',
    title: 'Full-Stack Web App',
    city: 'New York, NY',
    coordinates: { lat: 40.7128, lng: -74.006 },
    summary: 'A scalable web application built with modern tooling.',
    description:
      'Replace this with your real project description. Talk about the problem you solved, your approach, interesting technical challenges, and the impact. This text appears in the detail panel when a visitor lands at this location.',
    tech: ['Node.js', 'React', 'PostgreSQL', 'Docker'],
    links: [
      { label: 'GitHub', url: 'https://github.com/yourusername/project' },
      { label: 'Demo', url: 'https://demo.yoursite.com' },
    ],
    images: [],
    important: true,
  },
  // REPLACE with real content
  {
    id: 'project-3',
    type: 'project',
    title: 'Open Source Library',
    city: 'London, UK',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    summary: 'A utility library used by thousands of developers.',
    description:
      'Replace this with details about your open source contribution or project. What does it do? Who uses it? How many stars / downloads? What were the interesting engineering decisions?',
    tech: ['TypeScript', 'Jest', 'GitHub Actions'],
    links: [{ label: 'npm', url: 'https://npmjs.com/package/your-package' }],
    images: [],
    important: false,
  },
  // REPLACE with real content
  {
    id: 'photo-1',
    type: 'photo',
    title: 'Sunrise Over the Alps',
    city: 'Zermatt, Switzerland',
    coordinates: { lat: 46.0207, lng: 7.7491 },
    caption: 'Replace with your real photo caption and story.',
    date: '2024-08',
    photos: [],
  },
  // REPLACE with real content
  {
    id: 'photo-2',
    type: 'photo',
    title: 'Street Life in Tokyo',
    city: 'Tokyo, Japan',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    caption: 'Replace with your real photo caption and story. Add photos to /public/images/.',
    date: '2023-11',
    photos: [],
  },
];

export default locations;
