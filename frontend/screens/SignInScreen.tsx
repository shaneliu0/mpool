import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Platform, Image, ImageSourcePropType } from 'react-native';
import { View } from '../components/Themed';


import {
    useTheme, Box
} from 'native-base';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

import { getAuth, signInWithCredential, GoogleAuthProvider, signInWithCustomToken } from "firebase/auth";
import PagerView from 'react-native-pager-view';
import Text from '../components/StyledText';
import Layout from '../constants/Layout';
import StyledButton, { SignInWithGoogleButton, TextButton } from '../components/Button';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import StartPoly1 from '../assets/svgs/startpoly1.svg';
import StartPoly2 from '../assets/svgs/startpoly2.svg';

WebBrowser.maybeCompleteAuthSession();

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

interface OnboardingPageProps {
    title: string;
    imgSrc: ImageSourcePropType;
    imgDim: number;
    description: string;
}
function OnboardingPage(props: OnboardingPageProps) {
    const { title, description, imgSrc, imgDim } = props;

    return (
        <View style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: -100,
        }}>
            <View style={{ height: 350 }}>
                <Image
                    source={imgSrc}
                    style={{
                        width: imgDim,
                        height: imgDim,
                    }}
                />
            </View>
            <View style={{ width: Layout.window.width, padding: 15, backgroundColor: "transparent" }}>
                <Text variant="h1">{title}</Text>
                <Text variant="body">{description}</Text>
            </View>
        </View>
    );
}

interface BottomDotsProps {
    numPages: number;
    curPage: number;
}
function BottomDots(props: BottomDotsProps) {
    const { numPages, curPage } = props;
    const theme = useTheme();

    const dots = [];
    for (let i = 0; i < numPages; i++) {
        dots.push(
            <Box
                key={i}
                bg={curPage === i ? "#000000" : "#C4C4C4"}
                width={"10px"}
                height={"10px"}
                borderRadius={"15px"}
                margin={"2px"}
            />
        );
    }

    return (
        <View style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: -20,
        }}>
            {dots}
        </View>
    );
}

interface FadeInOutButtonProps {
    show: boolean;
    onPress: () => void;
    children: React.ReactText;
    altShow?: React.ReactNode;
}
function FadeInOutButton(props: FadeInOutButtonProps) {
    const { show, onPress, children, altShow } = props;
    const [showAlt, setShowAlt] = useState(false);
    const opacity = useSharedValue(0.01);

    const animatedViewStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        if (show) {
            opacity.value = withTiming(0, {}, () => {
                runOnJS(setShowAlt)(false);
                opacity.value = withTiming(1);
            });
        } else {
            opacity.value = withTiming(0, {}, () => {
                runOnJS(setShowAlt)(true);
                opacity.value = withTiming(1);
            });
        }
    }, [show]);

    return (
        <Animated.View style={animatedViewStyle}>
            {showAlt ? (
                altShow
            ) : (
                <TextButton onPress={onPress} color="secondary">
                    {children}
                </TextButton>
            )}
        </Animated.View>
    );
}

export default function SignInScreen(props: any) {
    const [curPage, setCurPage] = useState(0);
    const pagerRef = useRef<PagerView>(null);
    const [lockScroll, setLockScroll] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        responseType: "id_token",
        iosClientId: "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com",
        androidClientId: "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com", // invalid
        expoClientId: "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com",
    });

    const onLoginPress = () => {
        promptAsync();
    }
    useEffect(() => {
        (async () => {
            if (response?.type === 'success') {
                const token = response.params.id_token;
                try {
                    // sign in with firebase
                    const credential = GoogleAuthProvider.credential(token);
                    await signInWithCredential(auth, credential);
                } catch (error: any) {
                    // Handle Errors here.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // The email of the user's account used.
                    console.log(errorCode, errorMessage);
                    alert('Something went wrong while authenticating with Google.');
                }
            }
        })();
    }, [response]);

    const initiateGoToSignIn = () => {
        setLockScroll(true);
        const animDuration = 750;
        const timingOptions = { duration: animDuration, };

        const delayedShowLogin = () => {
            setTimeout(() => {
                setShowLogin(true);
                startForegroundOpacity.value = withTiming(1, timingOptions);
                startForegroundTranslate.value = withTiming(0, timingOptions);
                triangleOffsets.value = withTiming(0, timingOptions);
            }, 500);
        }
        pagerOpacity.value = withTiming(0, timingOptions, () => {
            runOnJS(delayedShowLogin)();
        });

    }
    const goBackFromSignIn = () => {
        setLockScroll(false);
        const animDuration = 750;
        const timingOptions = { duration: animDuration, };

        const delayedGoBack = () => {
            setTimeout(() => {
                setShowLogin(false);
                pagerOpacity.value = withTiming(1, timingOptions);
                startForegroundTranslate.value = withTiming(150, timingOptions);

                startForegroundOpacity.value = 0;
                triangleOffsets.value = 200;
            }, 500);
        }

        startForegroundOpacity.value = withTiming(0, timingOptions, () => {
            runOnJS(delayedGoBack)();
        });
    }

    const pagerOpacity = useSharedValue(1);
    const startForegroundOpacity = useSharedValue(0);
    const startForegroundTranslate = useSharedValue(150);
    const triangleOffsets = useSharedValue(200);

    const animatedPagerStyle = useAnimatedStyle(() => {
        return {
            opacity: pagerOpacity.value,
        }
    });
    const animatedPagerBottomStyle = useAnimatedStyle(() => {
        return {
            opacity: pagerOpacity.value,
        }
    });
    const animatedStartForegroundStyle = useAnimatedStyle(() => {
        return {
            opacity: startForegroundOpacity.value,
            transform: [
                { translateY: withSpring(startForegroundTranslate.value) },
            ],
        }
    });
    const animatedStartBottomButtonsStyle = useAnimatedStyle(() => {
        return {
            opacity: withDelay(750, withTiming(startForegroundOpacity.value)),
        }
    });
    const animatedStartPoly1Style = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: withSpring(150 + triangleOffsets.value) },
                { translateX: withSpring(-175 - triangleOffsets.value) },
            ],
            opacity: startForegroundOpacity.value,
        }
    });
    const animatedStartPoly2Style = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: withSpring(-100 + triangleOffsets.value) },
                { translateX: withSpring(150 + triangleOffsets.value) },
            ],
            opacity: startForegroundOpacity.value,
        }
    });

    const numPages = 4;

    if (showLogin) {
        return (
            <>
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}>
                    <Animated.View style={animatedStartPoly2Style}>
                        <StartPoly2 />
                    </Animated.View>
                    <Animated.View style={animatedStartPoly1Style}>
                        <StartPoly1 />
                    </Animated.View>
                </View>
                <Animated.View
                    key={0}
                    style={[
                        animatedStartForegroundStyle, {
                            height: "100%",
                            width: "100%",
                            flex: 1,
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            paddingHorizontal: 35,
                        }]}>
                    <View></View>
                    <View></View>
                    <View style={{
                        marginBottom: -58,
                        backgroundColor: "transparent",
                    }}>
                        <Image
                            source={require('../assets/images/icongraphic.png')}
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 20,
                            }}
                        />
                        <Text variant="h1" style={{ marginLeft: 0, fontWeight: "400" }}>Let's start</Text>
                        <Text variant="bodylarge" style={{ marginLeft: 0 }}>Sign in with your university Google account.</Text>
                    </View>
                    <Animated.View style={[animatedStartBottomButtonsStyle, { backgroundColor: "transparent" }]}>
                        <View style={{ marginBottom: 58, backgroundColor: "transparent", }}>
                            <SignInWithGoogleButton onPress={onLoginPress} disabled={!request} />
                        </View>
                        <View style={{
                            height: 50,
                            marginBottom: 35,
                            backgroundColor: "transparent",
                        }}>
                            <FadeInOutButton
                                onPress={goBackFromSignIn}
                                show
                            >
                                Back
                            </FadeInOutButton>
                        </View>
                    </Animated.View>
                </Animated.View>
            </>
        )
    }

    return (
        <>
            <PagerView
                style={styles.pagerView}
                ref={pagerRef}
                initialPage={0}
                scrollEnabled={!lockScroll}
                onPageSelected={(e: any) => setCurPage(e.nativeEvent.position)}
            >
                <Animated.View key="1" style={[animatedPagerStyle, styles.pagerPage]}>
                    <OnboardingPage
                        title="Share a Uber"
                        imgSrc={require('../assets/images/flightgroupsgraphic.png')}
                        imgDim={350}
                        description="We group you with other students from your university with similar flight times and locations."
                    />
                </Animated.View>
                <View key="2" style={styles.pagerPage}>
                    <OnboardingPage
                        title="Meet someone new"
                        imgSrc={require('../assets/images/interestsgraphic.png')}
                        imgDim={300}
                        description="We try to match you with other students who have similar interests."
                    />
                </View>
                <View key="3" style={styles.pagerPage}>
                    <OnboardingPage
                        title="Save money"
                        imgSrc={require('../assets/images/dollarbill.jpg')}
                        imgDim={300}
                        description="Split ride cost across your pool."
                    />
                </View>
                <Animated.View key="4" style={[animatedPagerStyle, styles.pagerPage]}>
                    <OnboardingPage
                        title="You're safe"
                        imgSrc={require('../assets/images/lockgraphic.png')}
                        imgDim={290}
                        description="We only match you with other verified students from your university. You'll receive each other's emails after you match."
                    />
                </Animated.View>
            </PagerView>
            <Animated.View
                style={[
                    animatedPagerBottomStyle,
                    styles.pagerBottom
                ]}>
                <View style={styles.pagerBottomItem}>
                    <FadeInOutButton show={curPage !== 0} onPress={() => pagerRef.current?.setPage(curPage - 1)}>Back</FadeInOutButton>
                </View>
                <View style={styles.pagerBottomItem}>
                    <BottomDots numPages={numPages} curPage={curPage} />
                </View>
                <View style={styles.pagerBottomItem}>
                    <FadeInOutButton
                        show={curPage !== numPages - 1}
                        onPress={() => pagerRef.current?.setPage(curPage + 1)}
                        altShow={
                            <StyledButton onPress={initiateGoToSignIn} style={{ width: 100, marginLeft: -25, marginBottom: -10 }} fontSize={20} color='primary' disabled={lockScroll}>Next</StyledButton>
                        }
                    >Next</FadeInOutButton>
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        direction: 'ltr',
    },
    pagerView: {
        flex: 1,
    },
    pagerPage: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    pagerBottom: {
        height: 50,
        marginBottom: 35,
        paddingHorizontal: 25,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    pagerBottomItem: {
        width: 75,
    },
    startForegroundStyle: {

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

    // const uiconfig = {
    //     signInFlow: 'popup',
    //     signInOptions: [
    //         firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    //     ]
    // }

    // let body = (
    //     <>
    //         <Center
    //             style={{ width: "100%", height: "100%" }}
    //         >
    //             <Box
    //                 safeArea
    //                 flex={1}
    //                 p={2}
    //                 w="90%"
    //                 mx='auto'
    //             >
    //                 <Heading size="lg" color='primary.500'>
    //                     Welcome back! We're so excited to see you again!
    //                 </Heading>
    //                 <Heading color="muted.400" size="xs">
    //                     Please sign in with your UM Google Account to continue.
    //                 </Heading>
    //                 {Platform.OS === "web" ? (
    //                     <StyledFirebaseAuth uiConfig={uiconfig} firebaseAuth={firebase.auth()} />
    //                 ) : (
    //                     <Button onPress={onLoginPress}>Login</Button>
    //                 )}
    //             </Box>
    //         </Center>
    //     </>
    // )