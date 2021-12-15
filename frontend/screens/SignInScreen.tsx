import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Platform, ScrollView, RefreshControl, } from 'react-native';
import { View, Text } from '../components/Themed';
import {
    RecommendationAlert,
    DaySlotBar
} from '../components/Schedule';

import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import useColorScheme from '../hooks/useColorScheme';

import {
    Heading,
    Container,
    VStack,
    useMediaQuery,
    useTheme,
    Skeleton,
    Center,
    Box,
    FormControl,
    Input,
    Link,
    Button,
    Icon,
    IconButton,
    HStack,
    Divider,
    Spinner,
} from 'native-base';

import axios from 'axios';
import * as Google from 'expo-google-app-auth';
import * as AppAuth from 'expo-app-auth';

import { getAuth, onAuthStateChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";

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
            } catch (error:any) {
                // Handle Errors here.
                const errorCode = error.code;
                const errorMessage = error.message;
                // The email of the user's account used.
                console.log(errorCode, errorMessage);
                alert('Something went wrong while authenticating with Google.');
            }
        } else {
            alert('Something went wrong. Please try again.')
        }
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
                    <Button onPress={onLoginPress}>Login</Button>
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