import {Account, Client, Databases, Messaging} from 'react-native-appwrite';;

export const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('6854346600203ab09001')
  .setPlatform('com.dripple.app');

export const account = new Account(client);
export const databases = new Databases(client);
export const messaging = new Messaging(client);
