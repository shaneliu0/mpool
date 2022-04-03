import { FontAwesome } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';

import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';

import { useDispatch } from 'react-redux';
import {
  setAuth
} from '../slices/authSlice';

const auth = getAuth();

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);
  const dispatch = useDispatch();

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        await new Promise<void>(resolve => {
          onAuthStateChanged(auth, user => {
            if (user) {
              (async () => {
                const idToken = await user.getIdToken(true);

                setInterval(async () => {
                  axios.defaults.headers.common['Authorization'] = await user.getIdToken(true);
                  console.log('Refreshed auth token!');
                }, 60 * 60 * 1000)
                console.log(idToken);
                axios.defaults.headers.common['Authorization'] = idToken;
                dispatch(setAuth({
                  displayName: user.displayName,
                  email: user.email,
                  photoURL: user.photoURL,
                  uid: user.uid
                }));
                
                resolve();
              })();
            } else {
              dispatch(setAuth(null));
              resolve();
            }
          })
        });

        // Load fonts
        await Font.loadAsync({
          ...FontAwesome.font,
          'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}
