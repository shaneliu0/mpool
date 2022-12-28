import 'react-native-gesture-handler';
import './firebaseinit';

import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox, Platform } from 'react-native';

import axios from 'axios';

import { Provider as ReduxProvider, useSelector } from 'react-redux';
import store from './store';
import Toast from 'react-native-toast-message';

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

// Native Base
import {
  extendTheme,
  NativeBaseProvider
} from 'native-base';
import Colors from './constants/Colors';
import { API_BASE_URL } from './config';
import { registerNotifications } from './dataAccess/notifications';
import { ThemeContext } from './Context';

// configurate axios
axios.defaults.baseURL = API_BASE_URL;

LogBox.ignoreAllLogs();

const selectColorMode = (scheme: 'light' | 'dark') => (light: string, dark: string) => scheme === 'light' ? light : dark;

function App() {
  const user = useSelector((state: any) => state.auth.user);
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<any>(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const colorSelect = selectColorMode(colorScheme);
  const darkMode = colorScheme === 'dark';

  const theme = extendTheme({
    components: {
      Heading: {
        baseStyle: (props: any) => {
          return {
            color: colorSelect('black', 'white'),
            p: 3,
            mx: 2,
            marginLeft: "0%",
            marginRight: "auto",
          }
        }
      },
      Checkbox: {
        defaultProps: {
          colorScheme: 'green',
        }
      },
      Select: {
        defaultProps: {
          color: colorSelect('black', 'white')
        }
      },
      Input: {
        baseStyle: (props: any) => {
          return {
            color: colorSelect('black', 'white')
          }
        }
      },
    }
  });

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync(user.uid).then(token => setExpoPushToken(token));

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });
  
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log(response);
      });
  
      return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      };
    }
  }, [user]);

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <ThemeContext.Provider value={darkMode ? Colors.dark : Colors.light}>
        <NativeBaseProvider theme={theme}>
          <SafeAreaProvider>
            <Navigation colorScheme={colorScheme} />
            <StatusBar />
            <Toast />
          </SafeAreaProvider>
        </NativeBaseProvider>
      </ThemeContext.Provider>
    );
  }
};

export default function WithReduxApp() {
  return (
    <ReduxProvider store={store}>
      <App />
    </ReduxProvider>
  )
}

async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got mail! 📬",
      body: 'Here is the notification body',
      data: { data: 'goes here' },
    },
    trigger: { seconds: 2 },
  });
}

async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      experienceId: `@${userId}/mpool`
    })).data;
    registerNotifications({
      expoPushToken: token,
    })
    console.log(token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}