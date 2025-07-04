import React, { createContext, useContext, useEffect } from "react";
import { ID, Models } from "react-native-appwrite";
import { account, databaseId, databases, usersCollectionId } from "./appwrite";


type AuthContextType = {
    user: Models.User<Models.Preferences> | null;
    isLoadingUser: boolean;
    signUp: (email: string, password: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function Auth({children}: {children: React.ReactNode}){
    const [user, setUser] = React.useState<Models.User<Models.Preferences> | null>(null);
    const [isLoadingUser, setIsLoadingUser] = React.useState<boolean>(true);
    
    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );
            
            const sessionPromise = account.get();
            const session = await Promise.race([sessionPromise, timeoutPromise]) as Models.User<Models.Preferences>;
            setUser(session);
        } catch (error) {
            console.log('No active session or timeout:', error);
            setUser(null);
        } finally {
            setIsLoadingUser(false);
        }
    }

    const signUp = async (email: string, password: string) => {
        try {
            await account.create(
                ID.unique(),
                email,
                password,
                "user"
            );
            await signIn(email, password);
            await account.updatePrefs({
                profilePictureId: "test-profile-picture",
            });
            const user = await account.get();
            const userId = user.$id;
            await databases.createDocument(
                databaseId,
                usersCollectionId,
                userId,
                {
                    userID: userId,
                    username: "user_" + userId,
                    name: user.name || "User",
                }
            )

            return null;
        } catch (error) {
            console.error('Sign up error:', error);
            if (error instanceof Error) {
                return error.message;
            }
            return "An unknown error occurred during sign up.";
        }
    }
    
    const signIn = async (email: string, password: string) => {
        try {
            await account.createEmailPasswordSession(email, password);
            const session = await account.get();
            setUser(session);
            return null;
        } catch (error) {
            console.error('Sign in error:', error);
            if (error instanceof Error) {
                return error.message;
            }
            return "An unknown error occurred during sign in.";
        }
    }
    
    const signOut = async () => {
        try {
            await account.deleteSession("current");
            setUser(null);
        } catch (error) {
            console.error('Sign out error:', error);
            setUser(null);
        }
    }

    return (<AuthContext.Provider value={{user, isLoadingUser, signUp, signIn, signOut}}>
                {children}
            </AuthContext.Provider>
    );
}

export function useAuth(){
    const context = useContext(AuthContext);
    if (context == undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}