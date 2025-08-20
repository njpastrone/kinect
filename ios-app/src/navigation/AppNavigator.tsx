import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ContactsScreen } from '../screens/ContactsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Contacts: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Dashboard' : 'Login'}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'Kinect' }}
          />
          <Stack.Screen
            name="Contacts"
            component={ContactsScreen}
            options={{ title: 'Contacts' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};