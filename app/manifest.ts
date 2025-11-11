import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Front Desk Visitor Management',
    short_name: 'Front Desk',
    description: 'Visitor management system for government and enterprise offices',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'any',
    icons: [],
    categories: ['business', 'productivity'],
    shortcuts: [
      {
        name: 'Visitor Check-In',
        short_name: 'Check-In',
        description: 'Quick access to visitor check-in',
        url: '/visitor',
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Access receptionist dashboard',
        url: '/dashboard',
      },
    ],
  };
}
