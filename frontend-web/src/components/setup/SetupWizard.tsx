import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Users, Download, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  isOptional?: boolean;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [setupData, setSetupData] = useState({
    user: {
      name: '',
      email: '',
      password: '',
    },
    preferences: {
      notifications: true,
      reminderIntervals: {
        bestFriend: 30,
        friend: 90,
        acquaintance: 180,
      },
    },
    importData: null as File | null,
    createSampleData: false,
  });

  const steps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Kinect Self-Hosted',
      description: 'Your privacy-first relationship manager',
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      component: <WelcomeStep />,
    },
    {
      id: 'account',
      title: 'Create Your Account',
      description: 'Set up your admin account',
      icon: <User className="w-8 h-8 text-blue-500" />,
      component: (
        <AccountStep
          data={setupData.user}
          onChange={(userData) => setSetupData(prev => ({ ...prev, user: userData }))}
        />
      ),
    },
    {
      id: 'preferences',
      title: 'Configure Preferences',
      description: 'Set your reminder preferences',
      icon: <Settings className="w-8 h-8 text-purple-500" />,
      component: (
        <PreferencesStep
          data={setupData.preferences}
          onChange={(preferences) => setSetupData(prev => ({ ...prev, preferences }))}
        />
      ),
      isOptional: true,
    },
    {
      id: 'import',
      title: 'Import Contacts',
      description: 'Import your existing contacts (optional)',
      icon: <Download className="w-8 h-8 text-orange-500" />,
      component: (
        <ImportStep
          data={{ importData: setupData.importData, createSampleData: setupData.createSampleData }}
          onChange={(importData) => setSetupData(prev => ({ 
            ...prev, 
            importData: importData.importData,
            createSampleData: importData.createSampleData 
          }))}
        />
      ),
      isOptional: true,
    },
    {
      id: 'complete',
      title: 'Setup Complete!',
      description: 'You\'re ready to start using Kinect',
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      component: <CompleteStep onComplete={onComplete} />,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    const stepId = currentStepData.id;
    
    if (stepId === 'account') {
      if (!await validateAccount()) {
        return;
      }
    }
    
    setCompletedSteps(prev => new Set(prev).add(stepId));
    
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateAccount = async (): Promise<boolean> => {
    const { name, email, password } = setupData.user;
    
    if (!name || !email || !password) {
      alert('Please fill in all required fields');
      return false;
    }
    
    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return true;
      case 'account':
        return setupData.user.name && setupData.user.email && setupData.user.password;
      case 'preferences':
        return true; // Always can proceed (optional step)
      case 'import':
        return true; // Always can proceed (optional step)
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    completedSteps.has(step.id)
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      completedSteps.has(step.id) ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mb-4">{currentStepData.icon}</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStepData.component}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                isFirstStep
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-2">
              {currentStepData.isOptional && (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center px-6 py-2 rounded-lg font-medium ${
                  canProceed()
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLastStep ? 'Complete Setup' : 'Next'}
                {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </div>
        </div>

        {/* Self-Hosted Badge */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Self-Hosted • Your Data Stays Private
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🔗</div>
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Welcome to Your Private Kinect Instance!
      </h2>
      <p className="text-gray-600">
        You've successfully installed Kinect Self-Hosted. This setup wizard will help you
        configure your instance and get started with managing your relationships.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-800 font-medium">100% Private</span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          All your data stays on your device. No cloud services, no tracking, no third parties.
        </p>
      </div>
    </div>
  </div>
);

// Account Step Component
interface AccountStepProps {
  data: { name: string; email: string; password: string };
  onChange: (data: { name: string; email: string; password: string }) => void;
}

const AccountStep: React.FC<AccountStepProps> = ({ data, onChange }) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="name"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="your@email.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <input
          type="password"
          id="password"
          value={data.password}
          onChange={(e) => onChange({ ...data, password: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Minimum 6 characters"
          minLength={6}
        />
      </div>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-800 text-sm">
        This will be your admin account for this Kinect instance. You can create additional
        accounts later if needed.
      </p>
    </div>
  </div>
);

// Preferences Step Component
interface PreferencesStepProps {
  data: any;
  onChange: (data: any) => void;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({ data, onChange }) => (
  <div className="space-y-6">
    <div>
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={data.notifications}
          onChange={(e) => onChange({ ...data, notifications: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="ml-2 text-sm font-medium text-gray-900">
          Enable reminder notifications
        </span>
      </label>
    </div>

    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Reminder Intervals</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Best Friends
          </label>
          <select
            value={data.reminderIntervals.bestFriend}
            onChange={(e) => onChange({
              ...data,
              reminderIntervals: { ...data.reminderIntervals, bestFriend: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Every week</option>
            <option value={14}>Every 2 weeks</option>
            <option value={30}>Every month</option>
            <option value={60}>Every 2 months</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Friends
          </label>
          <select
            value={data.reminderIntervals.friend}
            onChange={(e) => onChange({
              ...data,
              reminderIntervals: { ...data.reminderIntervals, friend: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>Every month</option>
            <option value={60}>Every 2 months</option>
            <option value={90}>Every 3 months</option>
            <option value={120}>Every 4 months</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Acquaintances
          </label>
          <select
            value={data.reminderIntervals.acquaintance}
            onChange={(e) => onChange({
              ...data,
              reminderIntervals: { ...data.reminderIntervals, acquaintance: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={90}>Every 3 months</option>
            <option value={120}>Every 4 months</option>
            <option value={180}>Every 6 months</option>
            <option value={365}>Every year</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

// Import Step Component
interface ImportStepProps {
  data: { importData: File | null; createSampleData: boolean };
  onChange: (data: { importData: File | null; createSampleData: boolean }) => void;
}

const ImportStep: React.FC<ImportStepProps> = ({ data, onChange }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Import Your Contacts</h3>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Download className="w-8 h-8 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop your contacts file here, or click to browse
        </p>
        <input
          type="file"
          accept=".csv,.vcf,.json"
          onChange={(e) => onChange({ ...data, importData: e.target.files?.[0] || null })}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
        >
          Choose File
        </label>
        {data.importData && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {data.importData.name}
          </p>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Supported formats: CSV, vCard (.vcf), JSON
      </p>
    </div>

    <div className="border-t pt-6">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={data.createSampleData}
          onChange={(e) => onChange({ ...data, createSampleData: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="ml-2 text-sm font-medium text-gray-900">
          Create sample data for testing
        </span>
      </label>
      <p className="text-sm text-gray-500 mt-1 ml-6">
        Adds example contacts to help you explore Kinect's features
      </p>
    </div>
  </div>
);

// Complete Step Component
interface CompleteStepProps {
  onComplete: () => void;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ onComplete }) => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🎉</div>
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Congratulations! Setup Complete
      </h2>
      <p className="text-gray-600">
        Your Kinect instance is ready to use. You can now start adding contacts and managing
        your relationships privately.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 text-left space-y-4">
        <h3 className="font-medium text-gray-900">What's Next?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Add your first contacts manually or import them</li>
          <li>• Create contact lists to organize your relationships</li>
          <li>• Set up reminders to stay in touch</li>
          <li>• Explore the dashboard to track your communication patterns</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Tip:</strong> Bookmark http://localhost:3000 or add Kinect to your home screen
          for easy access. Your data never leaves this device!
        </p>
      </div>
    </div>
  </div>
);

export default SetupWizard;