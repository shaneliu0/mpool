/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  SignIn: undefined;
  Modal: undefined;
  NotFound: undefined;
};

export type SignInStackParamList = {
  SignIn: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

export type RootTabParamList = {
  Pool: undefined;
  Chat: undefined;
  Account: undefined;
};

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;

export type PoolParamList = {
  Home: undefined;
  Notifications: undefined;
  PoolRequestCreation: undefined;
  PoolRequestView: undefined;
  FindPool: undefined;
  PoolScreen: undefined;
  MatchedPoolScreen: undefined;
  ProfileView: undefined;
}

export type ChatParamList = {
  Chats: undefined;
  SpecificChat: undefined;
  ProfileView: undefined;
}

export type AccountParamList = {
  Account: undefined;
  AccountSettings: undefined;
}

// begin non-navigation types

export interface PoolSearchQuery {
  time: string;
  startPoint: string;
  endPoint: string;
}

export interface Pool {
  id: string;
  title: string;
  time: string;
  startPoint: string;
  endPoint: string;
}

export interface PoolDetails {
  id: string;
  startPoint: string;
  endPoint: string;
  startCoords: {
    latitude: number;
    longitude: number;
  };
  endCoords: {
    latitude: number;
    longitude: number;
  };
  time: string;
  estimatedCost: string;
  availableSeats: number;
  description: string;
}

export interface AvailableChat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  avatars: string[];
}

export interface Account {
  id: string;
}