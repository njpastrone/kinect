export interface IUser {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
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
