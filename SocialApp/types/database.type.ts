import { Models } from 'react-native-appwrite';
export interface PostType extends Models.Document {
    user: UserType;
    content: string;
    title: string;
    link?: string;
    images?: string | Array<string>;
    video?: string;
    createdAt?: string;
    community?: communityType;
}
export interface UserType extends Models.Document {
    userID: string;
    username: string;
    name: string;
    userProfile?: string;
    bio?: string;
    verified?: boolean;
}
export interface communityType extends Models.Document {
    name: string;
    image?: string;
    banner?: string;
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