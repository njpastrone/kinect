export interface IUser {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  onboarding?: {
    welcomeDemoCompleted: boolean;
    welcomeDemoCompletedAt?: Date;
    setupWizardCompleted: boolean;
    setupWizardCompletedAt?: Date;
    tourPreferences: {
      showTipsAndTricks: boolean;
      autoStartTours: boolean;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserWithPassword extends IUser {
  password: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}

export interface IOnboardingStatus {
  welcomeDemoCompleted: boolean;
  welcomeDemoCompletedAt?: Date;
  setupWizardCompleted: boolean;
  setupWizardCompletedAt?: Date;
  tourPreferences: {
    showTipsAndTricks: boolean;
    autoStartTours: boolean;
  };
}

export interface IUpdateOnboardingRequest {
  welcomeDemoCompleted?: boolean;
  setupWizardCompleted?: boolean;
  tourPreferences?: {
    showTipsAndTricks?: boolean;
    autoStartTours?: boolean;
  };
}
