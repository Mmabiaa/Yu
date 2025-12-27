import { SocialAuthRequest } from '../../types/auth';

export interface GoogleSignInResult {
    idToken: string;
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        photo?: string;
    };
}

export interface AppleSignInResult {
    identityToken: string;
    authorizationCode: string;
    user?: {
        email?: string;
        name?: {
            firstName?: string;
            lastName?: string;
        };
    };
}

export class SocialAuthHelper {
    /**
     * Prepare Google Sign-In request for backend
     */
    public static prepareGoogleAuthRequest(result: GoogleSignInResult): SocialAuthRequest {
        return {
            provider: 'google',
            token: result.idToken,
            email: result.user.email,
        };
    }

    /**
     * Prepare Apple Sign-In request for backend
     */
    public static prepareAppleAuthRequest(result: AppleSignInResult): SocialAuthRequest {
        return {
            provider: 'apple',
            token: result.identityToken,
            email: result.user?.email,
        };
    }

    /**
     * Validate Google Sign-In result
     */
    public static validateGoogleResult(result: any): result is GoogleSignInResult {
        return (
            result &&
            typeof result.idToken === 'string' &&
            typeof result.accessToken === 'string' &&
            result.user &&
            typeof result.user.id === 'string' &&
            typeof result.user.email === 'string' &&
            typeof result.user.name === 'string'
        );
    }

    /**
     * Validate Apple Sign-In result
     */
    public static validateAppleResult(result: any): result is AppleSignInResult {
        return (
            result &&
            typeof result.identityToken === 'string' &&
            typeof result.authorizationCode === 'string'
        );
    }

    /**
     * Extract user info from Google result
     */
    public static extractGoogleUserInfo(result: GoogleSignInResult) {
        return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            photo: result.user.photo,
        };
    }

    /**
     * Extract user info from Apple result
     */
    public static extractAppleUserInfo(result: AppleSignInResult) {
        const firstName = result.user?.name?.firstName || '';
        const lastName = result.user?.name?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();

        return {
            email: result.user?.email,
            name: fullName || undefined,
        };
    }
}