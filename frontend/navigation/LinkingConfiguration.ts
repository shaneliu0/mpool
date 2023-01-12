/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

import { RootStackParamList } from '../types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.makeUrl('/')],
  config: {
    screens: {
      SignIn: {
        path: 'signin',
        screens: {
          SignInScreen: 'signin'
        }
      },
      Root: {
        screens: {
          Pool: {
            path: 'pools',
            screens: {
              HomeScreen: '/',
              NotificationsScreen: 'notifications',
              PoolRequestCreationScreen: 'request',
              PoolRequestViewScreen: 'request/:id',
              PoolScreen: ':poolId',
              ProfileView: '/profile/:profileId',
            },
          },
          Chat: {
            path: 'chat',
            screens: {
              Chats: 'chats',
              ChatScreen: ':chatId',
            }
          },
          Account: {
            screens: {
              AccountScreen: 'account',
            },
          },
        },
      },
      Modal: 'modal',
      NotFound: '*',
    },
  },
  // async getInitialURL(): Promise<string> {
  //   const url = await Linking.getInitialURL();
  //   if (url !== null) {
  //     return url;
  //   }

  //   const response = await Notifications.getLastNotificationResponseAsync();
  //   const rurl = response?.notification.request.content.data.url;

  //   return rurl as string;
  // },
  // subscribe(listener) {
  //   const onReceiveURL = ({ url }: { url: string }) => listener(url);

  //   const linkingSub = Linking.addEventListener('url', onReceiveURL);

  //   const subscription = Notifications.addNotificationResponseReceivedListener(response => {
  //     const url = response.notification.request.content.data.url;
  //     Linking.openURL('/chat')
  //     listener(url as string);
  //   });
    
  //   return () => {
  //     linkingSub.remove();
  //     subscription.remove();
  //   };
  // },
};

export default linking;
