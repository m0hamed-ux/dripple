import { Models } from 'react-native-appwrite';
export interface PostType extends Models.Document {
    userID: string;
    content: string;
}
export interface UserType extends Models.Document {
    userID: string;
    username: string;
    name: string;
    userProfile?: string;
}