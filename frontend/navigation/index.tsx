/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ColorSchemeName, Pressable, TouchableOpacity } from 'react-native';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import ModalScreen from '../screens/ModalScreen';

import { RootStackParamList, RootTabParamList, RootTabScreenProps, PoolParamList, Pool, ChatParamList, SignInStackParamList } from '../types';
import LinkingConfiguration from './LinkingConfiguration';

// start screen imports
import NotFoundScreen from '../screens/NotFoundScreen';

import FindPoolScreen from '../screens/pools/FindPoolScreen';
import PoolScreen from '../screens/pools/PoolScreen';
import HomeScreen from '../screens/pools/HomeScreen';
import PoolRequestCreationScreen from '../screens/pools/PoolRequestCreationScreen';
import PoolRequestViewScreen from '../screens/pools/PoolRequestViewScreen';
import NotificationsScreen from '../screens/pools/NotificationsScreen';
import ProfileViewScreen from '../screens/pools/ProfileViewScreen';

import ChatScreen from '../screens/chat/ChatsScreen';
import SpecficChatScreen from '../screens/chat/SpecificChatScreen';

import SignInScreen from '../screens/SignInScreen';

import AccountScreen from '../screens/AccountScreen';

import { useDispatch, useSelector } from 'react-redux';

import CustomHomeHeader from './CustomHomeHeader';

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  const user = useSelector((state: any) => state.auth.user);
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: '#FFFFFF'
    }
  };

  return (
    <NavigationContainer
      linking={LinkingConfiguration}
      theme={theme}>
      {user ? <RootNavigator /> : <SignInNavigator />}
    </NavigationContainer>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Modal" component={ModalScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Pool"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
      }}>
      <BottomTab.Screen
        name="Pool"
        component={PoolNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
      <BottomTab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
      <BottomTab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

const ChatStack = createNativeStackNavigator<ChatParamList>();

function ChatNavigator() {
  return (
    <ChatStack.Navigator
      initialRouteName="Chats"
    >
      <ChatStack.Screen name="Chats" component={ChatScreen} />
      <ChatStack.Screen
        name="SpecificChat"
        component={SpecficChatScreen}
        options={{
          title: "Chat",
          headerRight: () => (
            <TouchableOpacity>
              <AntDesign name="infocirlceo" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />
      <PoolStack.Screen name="ProfileView" component={ProfileViewScreen} options={{ title: "Profile" }} />
    </ChatStack.Navigator>
  );
}

// create a new navigator for pools
const PoolStack = createNativeStackNavigator<PoolParamList>();

function PoolNavigator() {
  return (
    <PoolStack.Navigator
      initialRouteName="Home"
    >
      <PoolStack.Screen name="Home" component={HomeScreen} options={{ headerTitle: () => <CustomHomeHeader /> }} />
      <PoolStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <PoolStack.Screen name="PoolRequestCreation" component={PoolRequestCreationScreen} options={{ title: "Creating Request" }} />
      <PoolStack.Screen name="PoolRequestView" component={PoolRequestViewScreen} options={{ title: "Viewing Request" }} />
      <PoolStack.Screen name="FindPool" component={FindPoolScreen} options={{ title: 'Find Pool' }} />
      <PoolStack.Screen name="PoolScreen" component={PoolScreen} options={{ title: 'Pool' }} />
      <PoolStack.Screen name="ProfileView" component={ProfileViewScreen} options={{ title: "Profile" }} />
    </PoolStack.Navigator>
  );
}

const SignInStack = createNativeStackNavigator<SignInStackParamList>();

function SignInNavigator() {
  return (
    <SignInStack.Navigator screenOptions={{ headerShown: false }}>
      <SignInStack.Screen name="SignIn" component={SignInScreen} />
    </SignInStack.Navigator>
  )
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}