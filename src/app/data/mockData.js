// src/app/data/mockData.js
export const mockTickets = [
  {
    id: 1,
    title: 'Login issue',
    department: 'IT',
    status: 'resolved',
    createdAt: '2023-11-01T09:00:00Z',
    resolvedAt: '2023-11-01T11:30:00Z',
    priority: 'high',
    category: 'software',
    createdBy: 'John Doe',
    assignedTo: 'IT Support',
    comments: [
      {
        id: 1,
        user: 'IT Support',
        message: 'Have you tried connecting to power?',
        createdAt: '2023-05-15T11:15:00Z'
      }
    ]
  },
  {
    id: 2,
    title: 'Software license renewal',
    description: 'I need my Adobe Creative Cloud license renewed for the upcoming project.',
    status: 'in-progress',
    priority: 'medium',
    category: 'software',
    createdAt: '2023-05-14T14:45:00Z',
    createdBy: 'Sarah Johnson',
    assignedTo: 'License Manager',
    comments: [
      {
        id: 1,
        user: 'License Manager',
        message: 'Request forwarded to procurement. Waiting for approval.',
        createdAt: '2023-05-14T15:30:00Z'
      }
    ]
  },
  {
    id: 3,
    title: 'VPN connection issues',
    description: 'Unable to connect to company VPN from home office. Getting authentication error.',
    status: 'resolved',
    priority: 'high',
    category: 'network',
    createdAt: '2023-05-10T09:15:00Z',
    createdBy: 'Michael Chen',
    assignedTo: 'Network Admin',
    comments: [
      {
        id: 1,
        user: 'Network Admin',
        message: 'Fixed firewall rule that was blocking your connection.',
        createdAt: '2023-05-10T11:45:00Z'
      }
    ]
  }
];

export const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@fedpioneer.com',
    role: 'user',
    department: 'Marketing',
    avatar: '/default-avatar.png'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@fedpioneer.com',
    role: 'user',
    department: 'Design',
    avatar: '/default-avatar.png'
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'michael.chen@fedpioneer.com',
    role: 'user',
    department: 'Engineering',
    avatar: '/default-avatar.png'
  },
  {
    id: 4,
    name: 'IT Support',
    email: 'support@fedpioneer.com',
    role: 'support',
    department: 'IT',
    avatar: '/admin-avatar.png'
  },
  {
    id: 5,
    name: 'Admin User',
    email: 'admin@fedpioneer.com',
    role: 'admin',
    department: 'IT',
    avatar: '/admin-avatar.png'
  }
];