import { IContact, IContactList } from '@kinect/shared';

export interface GroupedItem<T> {
  list: IContactList | null;
  items: T[];
  overdueCount?: number;
}

/**
 * Generic grouping utility for contacts by list
 */
export const groupItemsByList = <T extends { listId?: string }>(
  items: T[],
  lists: IContactList[],
  isOverdueFn?: (item: T) => boolean
): GroupedItem<T>[] => {
  // Group items by list
  const grouped = new Map<string, GroupedItem<T>>();

  items.forEach((item) => {
    const listId = item.listId || 'no-list';
    const list = lists.find((l) => l._id === item.listId) || null;

    if (!grouped.has(listId)) {
      grouped.set(listId, {
        list,
        items: [],
        overdueCount: 0,
      });
    }

    const group = grouped.get(listId)!;
    group.items.push(item);

    // Calculate overdue count if function provided
    if (isOverdueFn && isOverdueFn(item)) {
      group.overdueCount = (group.overdueCount || 0) + 1;
    }
  });

  // Convert to array and sort groups by list name
  return Array.from(grouped.values()).sort((a, b) => {
    const nameA = a.list?.name || 'No List';
    const nameB = b.list?.name || 'No List';
    return nameA.localeCompare(nameB);
  });
};

/**
 * Sort grouped items within each group
 */
export const sortGroupedItems = <T>(
  groupedItems: GroupedItem<T>[],
  sortFn: (a: T, b: T) => number
): GroupedItem<T>[] => {
  return groupedItems.map((group) => ({
    ...group,
    items: [...group.items].sort(sortFn),
  }));
};

/**
 * Sort items by common criteria
 */
export const createSortFunction = <T extends Record<string, any>>(
  sortBy: string,
  sortOrder: 'asc' | 'desc'
) => {
  return (a: T, b: T): number => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        if (a.firstName && a.lastName && b.firstName && b.lastName) {
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        } else if (a.name && b.name) {
          comparison = a.name.localeCompare(b.name);
        }
        break;

      case 'updated':
      case 'lastContactDate': {
        const dateA = a.lastContactDate ? new Date(a.lastContactDate) : new Date(0);
        const dateB = b.lastContactDate ? new Date(b.lastContactDate) : new Date(0);
        comparison = dateB.getTime() - dateA.getTime();
        break;
      }

      case 'created':
      case 'createdAt': {
        const createdA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const createdB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        comparison = createdB.getTime() - createdA.getTime();
        break;
      }

      case 'count':
      case 'contactCount':
        comparison = (a.contactCount || 0) - (b.contactCount || 0);
        break;

      case 'overdue':
      case 'overdueCount':
        comparison = (a.overdueCount || 0) - (b.overdueCount || 0);
        break;

      case 'reminderDays':
        comparison = (a.reminderDays || 30) - (b.reminderDays || 30);
        break;

      case 'list':
        if (a.list?.name && b.list?.name) {
          comparison = a.list.name.localeCompare(b.list.name);
        } else if (a.listId && b.listId) {
          comparison = a.listId.localeCompare(b.listId);
        }
        break;

      default:
        // Fallback to name sorting
        if (a.firstName && a.lastName && b.firstName && b.lastName) {
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        } else if (a.name && b.name) {
          comparison = a.name.localeCompare(b.name);
        }
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  };
};

/**
 * Helper function to determine if a contact is overdue
 */
export const isContactOverdue = (contact: IContact, lists: IContactList[]): boolean => {
  if (!contact.lastContactDate) return true; // No contact logged means overdue

  // Determine reminder interval
  let reminderDays = contact.customReminderDays;

  if (!reminderDays) {
    // Use list reminder days if contact is in a list
    if (contact.listId) {
      const contactList = lists.find((list) => list._id === contact.listId);
      reminderDays = contactList?.reminderDays;
    }

    // Fallback to category-based defaults
    if (!reminderDays) {
      switch (contact.category) {
        case 'BEST_FRIEND':
          reminderDays = 30;
          break;
        case 'FRIEND':
          reminderDays = 90;
          break;
        case 'ACQUAINTANCE':
          reminderDays = 180;
          break;
        default:
          reminderDays = 90;
      }
    }
  }

  const daysSinceContact = Math.floor(
    (Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceContact > reminderDays;
};
