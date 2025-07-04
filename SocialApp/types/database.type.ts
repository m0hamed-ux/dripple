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
    followers?: Array<UserType>;
    following?: Array<UserType>;
    communities?: Array<communityType>;
    notifications?: Array<NotificationType>;
}
export interface communityType extends Models.Document {
    name: string;
    image?: string;
    banner?: string;
    desciption?: string;
    memebers?: Array<UserType>;
    admin?: UserType;
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
    views?: Array<UserType>;
}
export interface verificationReq extends Models.Document {
    userID: UserType;
    status: 'pending' | 'approved' | 'rejected';
    idCardImage?: string;
    fullName: string;
}
export interface NotificationType extends Models.Document {
    user?: string;
    targetType?: 'user' | 'post' | 'none';
    targetID?: string;
    content?: string;
    isViewed?: boolean;
    type?: 'like' | 'comment' | 'follow' | 'verification' ;
}
export interface storiesView extends Models.Document {
    stories: StoryType;
    user: UserType;
}