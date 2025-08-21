// Demo mode constants and data
export const DEMO_CREDENTIALS = {
  email: 'demo.active@kinect.app',
  password: 'demo123',
};

export const DEMO_TOUR_STEPS = [
  {
    target: '.demo-dashboard',
    content:
      'Welcome to Kinect! This is your dashboard where you can see an overview of your relationships and upcoming reminders.',
    title: 'Your Dashboard',
  },
  {
    target: '.demo-contacts-nav',
    content:
      "Here you can view and manage all your contacts. Kinect organizes them into lists and reminds you when it's time to reconnect.",
    title: 'Contacts Section',
  },
  {
    target: '.demo-contact-list',
    content:
      'Your contacts are organized into lists like "Best Friends", "Family", and "Work" to help you stay organized.',
    title: 'Contact Lists',
  },
  {
    target: '.demo-reminder-badge',
    content:
      'These badges show when you should reach out. Red means overdue, yellow means due soon, and green means recently contacted.',
    title: 'Reminder System',
  },
  {
    target: '.demo-add-contact',
    content:
      'Click here to add new contacts. You can set custom reminder intervals and organize them into lists.',
    title: 'Adding Contacts',
  },
  {
    target: '.demo-sync-button',
    content:
      "Kinect can sync with your phone to automatically track when you've been in touch with someone.",
    title: 'Phone Integration',
  },
  {
    target: '.demo-settings',
    content: 'Customize your notification preferences and reminder intervals in settings.',
    title: 'Settings',
  },
];

export const DEMO_NOTIFICATIONS = [
  {
    title: 'Demo Mode Active',
    message:
      "You're exploring Kinect with demo data. Try adding a contact or updating reminder settings!",
    type: 'info' as const,
  },
  {
    title: 'Contact Added',
    message:
      "Great! You've added a new contact. Kinect will remind you to stay in touch based on their category.",
    type: 'success' as const,
  },
  {
    title: 'Phone Sync Simulated',
    message:
      'In the real app, this would sync your recent calls and texts to update contact dates automatically.',
    type: 'info' as const,
  },
  {
    title: 'Reminder Updated',
    message:
      "You've customized the reminder interval. Kinect will now use your preferred timeline for this contact.",
    type: 'success' as const,
  },
];

export const DEMO_FEATURES = [
  {
    title: 'Smart Reminders',
    description: "Get notified when it's time to reach out to friends and family",
    icon: '🔔',
  },
  {
    title: 'Contact Lists',
    description: 'Organize your relationships into meaningful groups',
    icon: '📋',
  },
  {
    title: 'Phone Integration',
    description: 'Automatically track communication through phone logs',
    icon: '📱',
  },
  {
    title: 'Custom Intervals',
    description: 'Set personalized reminder frequencies for each relationship',
    icon: '⚙️',
  },
  {
    title: 'Relationship Analytics',
    description: 'See patterns in your communication and relationship health',
    icon: '📊',
  },
];

export const DEMO_STATS = {
  totalContacts: 18,
  contactsOverdue: 5,
  contactsDueSoon: 3,
  recentlyContacted: 10,
  averageDaysBetweenContact: 21,
  longestGap: 127,
  thisMonthContacts: 8,
};
