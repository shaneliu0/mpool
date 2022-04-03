import React, { useState } from 'react';
import { StyleSheet, Platform, } from 'react-native';
import { View } from '../components/Themed';

import useColorScheme from '../hooks/useColorScheme';

import {
    Heading,
    Container,
    useMediaQuery,
    useTheme,
    Center,
    Box,
    Button,
} from 'native-base';

import * as Google from 'expo-google-app-auth';
import Toast from 'react-native-toast-message';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

import { getAuth, signInWithCredential, GoogleAuthProvider } from "firebase/auth";

if (Platform.OS === 'web') {
    const firebaseConfig = {
        apiKey: "YOUR_GOOGLE_API_KEY",
        authDomain: "your-firebase-project.firebaseapp.com",
        databaseURL: "https://your-firebase-project-default-rtdb.firebaseio.com",
        projectId: "your-firebase-project",
        storageBucket: "your-firebase-project.appspot.com",
        messagingSenderId: "YOUR_FIREBASE_SENDER_ID",
        appId: "YOUR_FIREBASE_APP_ID",
        measurementId: "G-XXXXXXXXXX"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
}

const auth = getAuth();

const CELL_COUNT = 6;

export default function SignInScreen(props: any) {
    const { navigation, route } = props;
    const theme = useTheme();
    const [mobile] = useMediaQuery({ maxWidth: theme.breakpoints.md });
    const isDarkTheme = useColorScheme() === "dark";

    const [loading, setLoading] = useState(false);

    const onLoginPress = async () => {
        // First- obtain access token from Expo's Google API
        const res = await Google.logInAsync({
            iosClientId: "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com",
            androidClientId: "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com",
            // scopes: ['profile', 'email']
        });

        if (res.type === 'success') {
            const { idToken } = res;

            const credential = GoogleAuthProvider.credential(idToken);
            console.log(credential);
            try {
                await signInWithCredential(auth, credential)
            } catch (error: any) {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                console.log(errorCode, errorMessage);
                alert('Something went wrong while authenticating with Google.');
            }
        } else {
            Toast.show({
                type: 'error',
                text1: 'Something went wrong.'
            });
        }
    }

    const uiconfig = {
        signInFlow: 'popup',
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        ]
    }

    let body;
    body = (
        <>
            <Center
                style={{ width: "100%", height: "100%" }}
            >
                <Box
                    safeArea
                    flex={1}
                    p={2}
                    w="90%"
                    mx='auto'
                >
                    <Heading size="lg" color='primary.500'>
                        Welcome back! We're so excited to see you again!
                    </Heading>
                    <Heading color="muted.400" size="xs">
                        Please sign in with your UM Google Account to continue.
                    </Heading>
                    {Platform.OS === "web" ? (
                        <StyledFirebaseAuth uiConfig={uiconfig} firebaseAuth={firebase.auth()} />
                    ) : (
                        <Button onPress={onLoginPress}>Login</Button>
                    )}
                </Box>
            </Center>
        </>
    )

    if (mobile) {
        return (
            <View style={styles.container}>
                {body}
            </View>
        );
    } else {
        return (
            <View style={styles.container}>
                <Container centerContent={false} width="40%">
                    {body}
                </Container>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        direction: 'ltr',
    },
    alignLeft: {
        marginLeft: 15,
        marginRight: "auto",
    },
    root: { flex: 1, padding: 20 },
    title: { textAlign: 'center', fontSize: 30 },
    codeFieldRoot: { marginTop: 20, },
    cell: {
        width: 40,
        height: 40,
        lineHeight: 38,
        fontSize: 24,
        borderWidth: 2,
        borderColor: '#00000030',
        textAlign: 'center',
    },
    focusCell: {
        borderColor: '#FFF',
    },
    errorText: {
        fontSize: 16
    },
});