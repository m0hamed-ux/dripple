import { Models } from 'react-native-appwrite';
export interface PostType extends Models.Document {
    userID: string;
    content: string;
    title: string;
    link?: string;
    images?: string | Array<string>;
    video?: string;
    createdAt?: string;
}
export interface UserType extends Models.Document {
    userID: string;
    username: string;
    name: string;
    userProfile?: string;
    verified?: boolean;
}
export interface LikeType extends Models.Document {
    postID: string;
    userID: string;
}
export interface CommentType extends Models.Document {
    postID: string;
    userID: string;
    content: string;
    createdAt?: string;
}
export interface StoryType extends Models.Document {
    userID: UserType;
    image: string;
    createdAt?: string;
    video?: string;
    text?: string;
}