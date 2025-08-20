import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useContacts } from '../hooks/useContacts';
import api from '../services/api';

export const Dashboard: React.FC = () => {
  const { contacts, fetchContacts } = useContacts();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchContacts();
        const upcomingReminders = await api.getUpcomingReminders();
        setReminders(upcomingReminders);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Stay connected with your friends and loved ones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Contacts</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{contacts.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Reminders</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{reminders.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Lists</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
        </div>

        {reminders.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overdue Contacts</h2>
            <div className="space-y-3">
              {reminders.slice(0, 5).map((reminder) => (
                <div key={reminder.contact._id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <div>
                    <p className="font-medium">
                      {reminder.contact.firstName} {reminder.contact.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {reminder.daysOverdue} days overdue
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Contact Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};