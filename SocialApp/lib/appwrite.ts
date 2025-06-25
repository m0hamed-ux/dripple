import { Account, Client, Databases, Messaging, Storage } from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('685bce8d0026ef276c37')
  .setPlatform('com.dripple.app');

export const account = new Account(client);
export const databases = new Databases(client);
export const messaging = new Messaging(client);
export const storage = new Storage(client);

// Helper function to handle API errors
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  if (error.code === 401) {
    return 'Authentication failed. Please login again.';
  } else if (error.code === 403) {
    return 'Access denied. You don\'t have permission to perform this action.';
  } else if (error.code === 404) {
    return 'Resource not found.';
  } else if (error.code === 429) {
    return 'Too many requests. Please try again later.';
  } else if (error.code === 500) {
    return 'Server error. Please try again later.';
  } else if (error.message?.includes('Network')) {
    return 'Network error. Please check your internet connection.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export const databaseId = '6855d4f2000e5c3a1067';
export const postsCollectionId = '6855d508003b4eaeaa71';
export const usersCollectionId = '6855efaf0026958f37e4';
export const imagesStorageId = '6856cdeb003b063e06d2';
export const likesCollectionId = '685811b2000adce1ae1f';
export const commentsCollectionId = '68581e190019c6286fbc';
export const storiesCollectionId = '68587954003c15fa31ea';
export const communitiesCollectionId = '68592878003110928a09';
export const followersCollectionId = '685adf8200242cf814f2';
export const communityMembersCollectionId = '685bc7230017860f8612';
export const verificationReqCollectionId = '685c0de1002016153169';


export const safeListDocuments = async (databaseId: string, collectionId: string, queries?: any[]) => {
  try {
    return await databases.listDocuments(databaseId, collectionId, queries);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const safeCreateDocument = async (databaseId: string, collectionId: string, documentId: string, data: any) => {
  try {
    return await databases.createDocument(databaseId, collectionId, documentId, data);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const safeDeleteDocument = async (databaseId: string, collectionId: string, documentId: string) => {
  try {
    return await databases.deleteDocument(databaseId, collectionId, documentId);
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
