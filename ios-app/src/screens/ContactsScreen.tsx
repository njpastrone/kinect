import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import api from '../services/api';
import { IContact } from '@kinect/shared';

export const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<IContact[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await api.getContacts();
      setContacts(response.items);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'BEST_FRIEND': return '#10B981';
      case 'FRIEND': return '#3B82F6';
      case 'ACQUAINTANCE': return '#6B7280';
      default: return '#8B5CF6';
    }
  };

  const renderContact = ({ item }: { item: IContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactName}>
          {item.firstName} {item.lastName}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>
            {item.category.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {item.email && <Text style={styles.contactDetail}>📧 {item.email}</Text>}
      {item.phoneNumber && <Text style={styles.contactDetail}>📱 {item.phoneNumber}</Text>}
      <TouchableOpacity style={styles.logButton}>
        <Text style={styles.logButtonText}>Log Contact</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item._id!}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No contacts yet</Text>
            <Text style={styles.emptySubtext}>Add your first contact to get started</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContainer: {
    padding: 16,
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contactDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 2,
  },
  logButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '400',
  },
});