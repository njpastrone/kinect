import React from 'react';

const REMINDER_PRESETS = [
  { value: 1, label: 'Daily' },
  { value: 7, label: 'Weekly' },
  { value: 30, label: 'Monthly' },
  { value: 60, label: 'Bi-monthly' },
  { value: 90, label: 'Quarterly' },
  { value: 180, label: 'Bi-annually' },
  { value: 365, label: 'Annually' },
];

interface ListFormData {
  name: string;
  description: string;
  reminderDays: number;
  color: string;
}

interface ListFormProps {
  isEdit?: boolean;
  formData: ListFormData;
  setFormData: (data: ListFormData) => void;
  customReminderDays: number | null;
  setCustomReminderDays: (days: number | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const ListForm = React.memo<ListFormProps>(({ 
  isEdit = false, 
  formData, 
  setFormData, 
  customReminderDays, 
  setCustomReminderDays,
  onSubmit,
  onCancel
}) => {
  return (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
        List Name *
      </label>
      <input
        type="text"
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter list name"
        required
      />
    </div>

    <div>
      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Optional description"
        rows={3}
      />
    </div>

    <div>
      <label htmlFor="reminderDays" className="block text-sm font-medium text-gray-700 mb-1">
        Reminder Interval
      </label>
      <select
        id="reminderDays"
        value={customReminderDays ? 'custom' : formData.reminderDays}
        onChange={(e) => {
          if (e.target.value === 'custom') {
            setCustomReminderDays(formData.reminderDays);
          } else {
            setCustomReminderDays(null);
            setFormData({ ...formData, reminderDays: Number(e.target.value) });
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {REMINDER_PRESETS.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label} ({preset.value} days)
          </option>
        ))}
        <option value="custom">Custom</option>
      </select>
    </div>

    {customReminderDays !== null && (
      <div>
        <label htmlFor="customDays" className="block text-sm font-medium text-gray-700 mb-1">
          Custom Days
        </label>
        <input
          type="number"
          id="customDays"
          value={customReminderDays}
          onChange={(e) => setCustomReminderDays(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          max="365"
          required
        />
      </div>
    )}

    <div>
      <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
        Color
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
        />
        <span className="text-sm text-gray-600">{formData.color}</span>
      </div>
    </div>

    <div className="flex justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {isEdit ? 'Update List' : 'Create List'}
      </button>
    </div>
  </form>
  );
});

ListForm.displayName = 'ListForm';