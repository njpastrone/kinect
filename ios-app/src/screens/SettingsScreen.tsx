import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [pushEnabled, setPushEnabled] = React.useState(true);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    navigation.replace('Login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive reminders to contact friends
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Best Friends</Text>
            <Text style={styles.settingDescription}>Remind every 30 days</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Friends</Text>
            <Text style={styles.settingDescription}>Remind every 90 days</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Acquaintances</Text>
            <Text style={styles.settingDescription}>Remind every 180 days</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingLabel}>About</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 20,
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});