import {Account, Client, Databases, Messaging} from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6854346600203ab09001')
  .setPlatform('com.dripple.app');

export const account = new Account(client);
export const databases = new Databases(client);
export const messaging = new Messaging(client);


export const databaseId = '6855d4f2000e5c3a1067';
export const postsCollectionId = '6855d508003b4eaeaa71';
export const usersCollectionId = '6855efaf0026958f37e4';


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