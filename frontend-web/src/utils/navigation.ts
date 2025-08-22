/**
 * Navigation utility functions for consistent routing
 */

export const routes = {
  dashboard: '/dashboard',
  contacts: {
    index: '/contacts',
    overdue: '/contacts?filter=overdue',
    byList: (listId: string) => `/lists/${listId}`,
  },
  lists: {
    index: '/lists',
    view: (listId: string) => `/lists/${listId}`,
  },
  settings: '/settings',
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
} as const;

export type NavigationRoutes = typeof routes;

/**
 * Generate query string from parameters
 */
export const createQueryString = (
  params: Record<string, string | number | boolean | undefined>
): string => {
  const searchParams = new window.URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Parse query string into object
 */
export const parseQueryString = (search: string): Record<string, string> => {
  const params = new window.URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
};

/**
 * Navigation helper functions
 */
export const navigationHelpers = {
  // Dashboard navigation
  goToOverdueContacts: () => routes.contacts.overdue,
  goToAllContacts: () => routes.contacts.index,
  goToContactsByList: (listId: string) => routes.contacts.byList(listId),

  // List navigation
  goToListContacts: (listId: string) => routes.lists.view(listId),

  // Filter helpers
  addContactFilter: (baseUrl: string, filter: string) => {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('filter', filter);
    return url.pathname + url.search;
  },

  removeContactFilter: (baseUrl: string) => {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.delete('filter');
    return url.pathname + url.search;
  },

  // Breadcrumb helpers
  getBreadcrumbs: (pathname: string, listName?: string): Array<{ label: string; href: string }> => {
    const breadcrumbs: Array<{ label: string; href: string }> = [
      { label: 'Dashboard', href: routes.dashboard },
    ];

    if (pathname.startsWith('/contacts')) {
      if (pathname.includes('filter=overdue')) {
        breadcrumbs.push({ label: 'Overdue Contacts', href: routes.contacts.overdue });
      } else {
        breadcrumbs.push({ label: 'Contacts', href: routes.contacts.index });
      }
    } else if (pathname.startsWith('/lists')) {
      if (pathname === '/lists') {
        breadcrumbs.push({ label: 'Lists', href: routes.lists.index });
      } else if (listName) {
        breadcrumbs.push({ label: 'Lists', href: routes.lists.index });
        breadcrumbs.push({ label: listName, href: pathname });
      }
    } else if (pathname === '/settings') {
      breadcrumbs.push({ label: 'Settings', href: routes.settings });
    }

    return breadcrumbs;
  },
};
