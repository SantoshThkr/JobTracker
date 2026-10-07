import {createAuthClient} from "better-auth/react";

// No baseURL: the auth API is served by this app (app/api/auth), so the client
// uses the current origin.
export const authClient = createAuthClient();

export const {signIn , signUp, signOut, useSession} = authClient;
