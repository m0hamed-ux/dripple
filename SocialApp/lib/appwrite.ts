import {Account, Client, Databases, Messaging, Storage} from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6854346600203ab09001')
  .setPlatform('com.dripple.app');

export const account = new Account(client);
export const databases = new Databases(client);
export const messaging = new Messaging(client);
export const storage = new Storage(client);


export const databaseId = '6855d4f2000e5c3a1067';
export const postsCollectionId = '6855d508003b4eaeaa71';
export const usersCollectionId = '6855efaf0026958f37e4';
export const imagesStorageId = '6856cdeb003b063e06d2';
export const likesCollectionId = '685811b2000adce1ae1f';
export const commentsCollectionId = '68581e190019c6286fbc';


// // get posts collection
// export const postsCollection = databases.listDocuments(databaseId, postsCollectionId);
// export const getPosts = async () => {
//   try {
//     const response = await databases.listDocuments(databaseId, postsCollectionId);
//     return response.documents;
//   } catch (error) {
//     console.error('Error fetching posts:', error);
//     throw error;
//   }
// }
 

// // add post
// export const addPost = async (content: String) => {
//   await databases.createDocument(
//     databaseId,
//     postsCollectionId,
//     ID.unique(),
//     {
//       content: content,
//     }
//   );
//   return true;
// }