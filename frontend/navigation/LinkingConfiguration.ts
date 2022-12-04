/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

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
              ChatScreen: 'chat/:chatId',
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
};

export default linking;
