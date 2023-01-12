import { Avatar } from "native-base";
import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { FadeInView } from "../../components/Animation";
import { Chip, ChipContainer } from "../../components/Chip";
import { Loading } from "../../components/Display";
import Text from "../../components/StyledText";
import { defaultProfile, getProfile, Profile, ProfileContentBlock as ProfileContentBlockProps } from "../../dataAccess/users";
import { RootTabScreenProps } from "../../types";
import * as Logging from '../../Logging';
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import prompt from '../../components/PromptProvider';
import Toast from "react-native-toast-message";
import { blockUser, postReport } from "../../dataAccess/safety";
import { useSelector } from "react-redux";

interface ProfileActionsProps {
    userId?: string;
    navigation?: RootTabScreenProps<'Pool'>['navigation'];
}
function ProfileActions(props: ProfileActionsProps) {
    const {
        userId,
        navigation
    } = props;
    const { showActionSheetWithOptions } = useActionSheet();

    const executeBlock = async () => {
        try {
            if (!userId) throw new Error();
            await blockUser({ userId });
            Toast.show({
                type: "success",
                text1: "User blocked.",
            })
            if (navigation) {
                navigation.goBack();
            }
        } catch (error) {
            Logging.Error(error, { text1: "Error: couldn't block user." });
        }
    }

    const handlePress = () => {
        const options = ['Report', 'Block', 'Cancel'];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 2;
        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
            },
            (buttonIndex) => {
                try {
                    switch (buttonIndex) {
                        case 0: // report
                            prompt(
                                'Report message',
                                'Enter a reason for reporting this user.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Report', onPress: reason => postReport({ reason, userId: userId }).then(() => {
                                            prompt(
                                                "Reported. Would you also like to block this user?",
                                                "Blocking a user will prevent them from contacting or matching with you.",
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Block',
                                                        onPress: executeBlock,
                                                        style: "destructive"
                                                    }
                                                ],
                                                {
                                                    type: "default"
                                                }
                                            );
                                        }).catch(e => {
                                            Logging.Error(e, { text1: "Error: couldn't report user." });
                                        })
                                    },
                                ],
                                {
                                    type: 'plain-text'
                                }
                            );
                            break;
                        case 1: // block
                            prompt(
                                "Block this user?",
                                "Blocking a user will prevent them from contacting or matching with you.",
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Block',
                                        onPress: executeBlock,
                                        style: "destructive"
                                    }
                                ],
                                {
                                    type: "default"
                                }
                            );
                            break;
                    }
                } catch (error) {
                    Logging.Error(error);
                }
            },
        );
    }

    return (
        <TouchableOpacity onPress={handlePress}>
            <MaterialCommunityIcons name="dots-vertical" size={24} color="black" />
        </TouchableOpacity>
    );
}


function ProfileContentBlock(props: ProfileContentBlockProps) {
    const {
        heading,
        text,
        tiles,
    } = props;

    const renderTiles = () => {
        return tiles?.map((t, idx) => {
            return <Chip key={idx} content={t} />
        })
    };

    return (
        <View style={{
            marginVertical: 5,
        }}>
            <Text variant="body" style={{ fontWeight: "500" }}>{heading}</Text>
            {text && <Text variant="body">{text}</Text>}
            {tiles && (
                <ChipContainer>
                    {renderTiles()}
                </ChipContainer>
            )}
        </View>
    )
}

interface ProfileDisplayProps {
    navigation?: RootTabScreenProps<'Pool'>['navigation'];
    userId?: string;
}
export function ProfileDisplay(props: Profile & ProfileDisplayProps) {
    const {
        photoUrl,
        content,
        description,
        name,
        navigation,
        userId,
    } = props;
    const user = useSelector((state: any) => state.auth.user);

    const renderContent = () => {
        return content.map((d, idx) => {
            return <ProfileContentBlock key={idx} {...d} />
        })
    }

    useEffect(() => {
        if (navigation) {
            if (userId === user?.uid) return;
            navigation.setOptions({
                headerRight: () => (
                    <ProfileActions userId={userId} navigation={navigation} />
                ),
            });
        }
    }, []);

    return (
        <>
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                padding: 25,
                paddingLeft: 40,
            }}>
                <View style={{
                    marginTop: 25,
                    marginRight: 25,
                    width: 100,
                }}>
                    <Avatar
                        size="24"
                        source={{
                            uri: photoUrl
                        }}
                    />
                </View>
                <View style={{
                    flex: 1,
                    height: 100,
                }}>
                    <Text variant="h1">{name}</Text>
                    <Text variant="body">{description}</Text>
                </View>
            </View>
            <View style={{
                padding: 25,
                paddingTop: 0,
            }}>
                {renderContent()}
            </View>
        </>
    )
}

function ProfileViewScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile>(defaultProfile);

    useEffect(() => {
        if (loading) {
            (async () => {
                try {
                    const resp = await getProfile((route.params as any).userId);
                    setProfile(resp);
                    setLoading(false);
                    if (resp.errorMsg) {
                        prompt(
                            "Couldn't load",
                            resp.errorMsg,
                            [
                                {
                                    text: "OK",
                                    onPress: () => navigation.goBack(),
                                }
                            ],
                        )
                    }
                } catch (error) {
                    Logging.Error(error);
                }
            })();
        }
    }, []);

    if (!route.params) return <Text variant="h1">Something went wrong!</Text>
    if (loading) return <Loading shouldCenter defaultDelay />

    return (
        <FadeInView>
            <ScrollView style={{
                height: "100%",
            }}>
                <ProfileDisplay {...profile} navigation={navigation} userId={(route.params as any).userId} />
            </ScrollView>
        </FadeInView>
    )
}

export default ProfileViewScreen;