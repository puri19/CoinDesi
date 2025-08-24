declare module '@react-native-google-signin/google-signin' {
  export interface SignInResponse {
    idToken: string;
    serverAuthCode?: string;
    scopes?: string[];
    user: {
      id: string;
      name?: string;
      email?: string;
      photo?: string;
      familyName?: string;
      givenName?: string;
    };
  }

  export interface SignInErrorResponse {
    code: string;
    message: string;
  }

  export type SignInResult = SignInResponse | SignInErrorResponse;

  export class GoogleSignin {
    static configure(config: {
      webClientId: string;
      offlineAccess?: boolean;
      forceCodeForRefreshToken?: boolean;
      iosClientId?: string;
      serverClientId?: string;
      hostedDomain?: string;
      openIdRealm?: string;
      profileImageSize?: number;
    }): void;

    static hasPlayServices(options?: { showPlayServicesUpdateDialog?: boolean }): Promise<boolean>;
    static signIn(): Promise<SignInResponse>;
    static signOut(): Promise<void>;
    static isSignedIn(): Promise<boolean>;
    static getCurrentUser(): Promise<SignInResponse | null>;
    static clearCachedToken(): Promise<void>;
    static getTokens(): Promise<{ accessToken: string; idToken: string }>;
  }

  export enum GoogleSigninButton {
    Size = {
      Icon: 0,
      Standard: 1,
      Wide: 2,
    },
    Color = {
      Dark: 0,
      Light: 1,
    },
  }

  export interface GoogleSigninButtonProps {
    size?: GoogleSigninButton.Size;
    color?: GoogleSigninButton.Color;
    disabled?: boolean;
    onPress?: () => void;
  }

  export const GoogleSigninButton: React.ComponentType<GoogleSigninButtonProps>;
} 