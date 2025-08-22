import React, { useState } from 'react';
import { useDevTools, formatDateForTimeTravel, ApiLog } from '../../utils/devTools';

export const DevToolsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'time' | 'data'>('general');

  const devTools = useDevTools();

  if (!devTools.isEnabled) return null;

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={togglePanel}
        className="fixed top-4 left-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Toggle Dev Tools"
      >
        🛠️
      </button>

      {/* Dev panel */}
      {isOpen && (
        <div className="fixed inset-x-4 top-16 z-40 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Dev Tools</h3>
            <button onClick={togglePanel} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {[
              { id: 'general', label: 'General' },
              { id: 'api', label: `API (${devTools.apiLogs.length})` },
              { id: 'time', label: 'Time Travel' },
              { id: 'data', label: 'Data' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-64 overflow-y-auto">
            {activeTab === 'general' && <GeneralTab devTools={devTools} />}
            {activeTab === 'api' && <ApiTab devTools={devTools} />}
            {activeTab === 'time' && <TimeTravelTab devTools={devTools} />}
            {activeTab === 'data' && <DataTab devTools={devTools} />}
          </div>
        </div>
      )}
    </>
  );
};

const GeneralTab: React.FC<{ devTools: ReturnType<typeof useDevTools> }> = ({ devTools }) => (
  <div className="space-y-3">
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => devTools.simulatePhoneSync()}
          className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
        >
          📱 Sync Phone
        </button>
        <button
          onClick={() => devTools.clearApiLogs()}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
        >
          🗑️ Clear Logs
        </button>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info</h4>
      <div className="bg-gray-50 p-2 rounded text-xs">
        <div>User State: {devTools.debugInfo.userState ? '✓ Loaded' : '❌ Not loaded'}</div>
        <div>Cache Status: {devTools.debugInfo.cacheStatus || 'Unknown'}</div>
        <div>Notifications: {devTools.debugInfo.notificationQueue.length} queued</div>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Environment</h4>
      <div className="bg-gray-50 p-2 rounded text-xs">
        <div>Node ENV: {process.env.NODE_ENV}</div>
        <div>API URL: {process.env.REACT_APP_API_URL || 'default'}</div>
        <div>Version: {process.env.REACT_APP_VERSION || '1.0.0'}</div>
      </div>
    </div>
  </div>
);

const ApiTab: React.FC<{ devTools: ReturnType<typeof useDevTools> }> = ({ devTools }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <h4 className="text-sm font-medium text-gray-900">Recent API Calls</h4>
      <button
        onClick={() => devTools.clearApiLogs()}
        className="text-xs text-red-600 hover:text-red-800"
      >
        Clear All
      </button>
    </div>

    <div className="space-y-2 max-h-48 overflow-y-auto">
      {devTools.apiLogs.length === 0 ? (
        <p className="text-sm text-gray-500">No API calls logged yet</p>
      ) : (
        devTools.apiLogs.map((log) => <ApiLogEntry key={log.id} log={log} />)
      )}
    </div>
  </div>
);

const ApiLogEntry: React.FC<{ log: ApiLog }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    log.status >= 200 && log.status < 300
      ? 'text-green-600'
      : log.status >= 400
        ? 'text-red-600'
        : 'text-yellow-600';

  return (
    <div className="border border-gray-200 rounded p-2">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-mono ${statusColor}`}>{log.status || 'ERR'}</span>
          <span className="text-xs font-medium">{log.method}</span>
          <span className="text-xs text-gray-600 truncate max-w-32">{log.url}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{log.duration}ms</span>
          <span className="text-xs">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs space-y-1">
            <div>
              <strong>URL:</strong> {log.url}
            </div>
            <div>
              <strong>Time:</strong> {log.timestamp.toLocaleTimeString()}
            </div>
            {log.error && (
              <div className="text-red-600">
                <strong>Error:</strong> {log.error}
              </div>
            )}
            {log.requestData && (
              <details className="mt-1">
                <summary className="cursor-pointer text-gray-600">Request Data</summary>
                <pre className="mt-1 p-1 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.requestData, null, 2)}
                </pre>
              </details>
            )}
            {log.responseData && (
              <details className="mt-1">
                <summary className="cursor-pointer text-gray-600">Response Data</summary>
                <pre className="mt-1 p-1 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.responseData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TimeTravelTab: React.FC<{ devTools: ReturnType<typeof useDevTools> }> = ({ devTools }) => (
  <div className="space-y-3">
    <div>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={devTools.timeTravel.enabled}
          onChange={(e) => devTools.enableTimeTravel(e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm font-medium">Enable Time Travel</span>
      </label>
      <p className="text-xs text-gray-500 mt-1">Override current date for testing reminder logic</p>
    </div>

    {devTools.timeTravel.enabled && (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Date</label>
          <input
            type="date"
            value={formatDateForTimeTravel(devTools.timeTravel.currentDate)}
            onChange={(e) => devTools.setCurrentDate(new Date(e.target.value))}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Quick Jumps</h5>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                devTools.setCurrentDate(tomorrow);
              }}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              +1 Day
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                devTools.setCurrentDate(nextWeek);
              }}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              +1 Week
            </button>
            <button
              onClick={() => {
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                devTools.setCurrentDate(nextMonth);
              }}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              +1 Month
            </button>
            <button
              onClick={() => devTools.setCurrentDate(new Date())}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

const DataTab: React.FC<{ devTools: ReturnType<typeof useDevTools> }> = ({ devTools }) => (
  <div className="space-y-3">
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Data Generation</h4>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => devTools.generateBulkContacts(5)}
          className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
        >
          + 5 Contacts
        </button>
        <button
          onClick={() => devTools.generateBulkContacts(10)}
          className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
        >
          + 10 Contacts
        </button>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Data Management</h4>
      <div className="space-y-2">
        <button
          onClick={() => devTools.resetDemo()}
          className="w-full px-3 py-2 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
        >
          🔄 Reset Demo Data
        </button>
        <button
          onClick={() => devTools.clearAllData()}
          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          🗑️ Clear All Data
        </button>
        <p className="text-xs text-gray-500">
          Reset demo will reload fresh demo data. Clear all will remove all local data.
        </p>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Export/Import</h4>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const data = {
              localStorage: { ...localStorage },
              timestamp: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kinect-data-export.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
        >
          Export Data
        </button>
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  try {
                    const data = JSON.parse(e.target?.result as string);
                    if (data.localStorage) {
                      Object.keys(data.localStorage).forEach((key) => {
                        localStorage.setItem(key, data.localStorage[key]);
                      });
                      window.location.reload();
                    }
                  } catch (error) {
                    alert('Invalid data file');
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
        >
          Import Data
        </button>
      </div>
    </div>
  </div>
);
