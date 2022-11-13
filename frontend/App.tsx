import 'react-native-gesture-handler';
import './firebaseinit';

import firebase from 'firebase/app'
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, Image, LogBox, } from 'react-native';

import axios from 'axios';

import { Provider as ReduxProvider } from 'react-redux';
import { useDispatch } from 'react-redux';
import store from './store';
import Toast from 'react-native-toast-message';

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

// Native Base
import {
  extendTheme,
  NativeBaseProvider,
  themeTools,
  useColorMode,
  Skeleton
} from 'native-base';
import Colors from './constants/Colors';
import { API_BASE_URL } from './config';

// configurate axios
axios.defaults.baseURL = API_BASE_URL;

LogBox.ignoreAllLogs();

const selectColorMode = (scheme: 'light' | 'dark') => (light: string, dark: string) => scheme === 'light' ? light : dark;

export const ThemeContext = React.createContext<typeof Colors.light>(Colors.light);

function App() {
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
            marginRight: "auto"
          }
        }
      },
      Checkbox: {
        defaultProps: {
          colorScheme: 'green'
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