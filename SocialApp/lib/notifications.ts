import { ID } from 'react-native-appwrite';
import { UserType } from '../types/database.type';
import { databaseId, notificationsCollectionId, safeCreateDocument } from './appwrite';

export interface CreateNotificationParams {
  targetUserID: string;
  targetType?: 'user' | 'post' | 'none';
  targetID?: string;
  content: string;
  type: 'like' | 'comment' | 'follow' | 'verification';
}

/**
 * Send a notification to a user
 */
export const sendNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    await safeCreateDocument(
      databaseId,
      notificationsCollectionId,
      ID.unique(),
      {
        user: params.targetUserID,
        targetType: params.targetType || 'none',
        targetID: params.targetID,
        content: params.content,
        type: params.type,
        isViewed: false,
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

/**
 * Send like notification
 */
export const sendLikeNotification = async (
  postOwner: UserType,
  likerName: string,
  postID: string
): Promise<void> => {
  await sendNotification({
    targetUserID: postOwner.userID,
    targetType: 'post',
    targetID: postID,
    content: `${likerName} أعجب بمنشورك`,
    type: 'like',
  });
};

/**
 * Send comment notification
 */
export const sendCommentNotification = async (
  postOwner: UserType,
  commenterName: string,
  postID: string,
  commentContent: string
): Promise<void> => {
  console.log('sendCommentNotification called with:', {
    postOwner,
    commenterName,
    postID,
    commentContent
  });
  
  const truncatedComment = commentContent.length > 50 
    ? commentContent.substring(0, 50) + '...' 
    : commentContent;
    
  await sendNotification({
    targetUserID: postOwner.userID,
    targetType: 'post',
    targetID: postID,
    content: `${commenterName} علق على منشورك: "${truncatedComment}"`,
    type: 'comment',
  });
};

/**
 * Send follow notification
 */
export const sendFollowNotification = async (
  followedUser: UserType,
  followerName: string,
  followerUserID: string
): Promise<void> => {
  await sendNotification({
    targetUserID: followedUser.userID,
    targetType: 'user',
    targetID: followerUserID,
    content: `${followerName} بدأ بمتابعتك`,
    type: 'follow',
  });
};

/**
 * Send verification request notification
 */
export const sendVerificationNotification = async (
  user: UserType,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  const statusText = status === 'pending' 
    ? 'تم إرسال طلب التحقق الخاص بك' 
    : status === 'approved' 
    ? 'تم الموافقة على طلب التحقق الخاص بك' 
    : 'تم رفض طلب التحقق الخاص بك';
    
  await sendNotification({
    targetUserID: user.userID,
    targetType: 'none',
    content: statusText,
    type: 'verification',
  });
};

/**
 * Send community join notification
 */
export const sendCommunityJoinNotification = async (
  communityAdmin: UserType,
  joinerName: string,
  communityName: string
): Promise<void> => {
  await sendNotification({
    targetUserID: communityAdmin.userID,
    targetType: 'none',
    content: `${joinerName} انضم إلى مجتمع "${communityName}"`,
    type: 'follow', // Using follow type for community joins
  });
}; 