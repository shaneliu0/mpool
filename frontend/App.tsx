import 'react-native-gesture-handler';
import './firebaseinit';

import firebase from 'firebase/app'
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, Image } from 'react-native';

import axios from 'axios';

import { Provider as ReduxProvider } from 'react-redux';
import { useDispatch } from 'react-redux';
import store from './store';

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
import { useEffect, useState, useCallback } from 'react';

// configurate axios
// axios.defaults.baseURL = 'http://localhost:3001';
axios.defaults.baseURL = 'http://localhost:3001'

const selectColorMode = (scheme: 'light' | 'dark') => (light: string, dark: string) => scheme === 'light' ? light : dark;

function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  const colorSelect = selectColorMode(colorScheme);

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
      <NativeBaseProvider theme={theme}>
        <SafeAreaProvider>
          <Navigation colorScheme={colorScheme} />
          <StatusBar />
        </SafeAreaProvider>
      </NativeBaseProvider>
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