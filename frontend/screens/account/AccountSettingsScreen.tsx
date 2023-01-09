import React, { useContext, useEffect, useState } from 'react';
import { FadeInView } from '../../components/Animation';
import { Loading } from '../../components/Display';
import { RootStackParamList, RootStackScreenProps, RootTabScreenProps } from '../../types';
import Text from '../../components/StyledText';

import { getAuth } from 'firebase/auth';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import StyledButton from '../../components/Button';
import { getContactBlurb } from '../../dataAccess/static';
import * as Logging from '../../Logging';
import { Entypo } from '@expo/vector-icons';
import { ThemeContext } from '../../Context';
import { deleteAccount } from '../../dataAccess/users';
import prompt from '../../components/PromptProvider';

const auth = getAuth();

function AccountSettings({ navigation }: RootTabScreenProps<'Account'>) {
    const theme = useContext(ThemeContext);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [contactBlurb, setContactBlurb] = useState("");

    const handleSignOut = async () => {
        setSigningOut(true);
        await new Promise<void>(resolve => setTimeout(resolve, 500));
        auth.signOut();
    }

    const handleGoToBlocks = () => {
        navigation.navigate('Account', {
            screen: "Blocks"
        } as never);
    }

    const handeDeleteAccount = async () => {
        const confirmationText = "mpool";
        try {
            prompt(
                "We're sorry to see you go.",
                `Enter "${confirmationText}" below to delete your account.`,
                [
                    {
                        style: 'cancel',
                        text: 'Cancel',
                    },
                    {
                        style: 'destructive',
                        text: 'Delete',
                        onPress: async (text: string) => {
                            if (text.toLowerCase() !== confirmationText) {
                                prompt(
                                    "Cancelled",
                                    `You did not enter the correct text, "${confirmationText}" into the field.`,
                                );
                                return;
                            };
                            await deleteAccount();
                            prompt(
                                "Account Deleted",
                                "Your account has been deleted and you have been signed out.",
                            );
                            auth.signOut();
                        }
                    }
                ],
                {
                    type: 'plain-text',
                }
            )
        } catch (error) {
            Logging.Error(error);
        }
    }

    useEffect(() => {
        if (loading) {
            (async () => {
                try {
                    const bresp = await getContactBlurb();
                    setContactBlurb(await bresp.blurb);
                    setLoading(false);
                } catch (error) {
                    Logging.Error(error);
                }
            })();
        }
    }, [])

    return (
        <FadeInView>
            <ScrollView style={{ height: "100%", marginBottom: "auto" }}>
                {loading ? (
                    <View style={{ height: 200 }}>
                        <Loading defaultDelay shouldCenter />
                    </View>
                ) : (
                    <FadeInView>
                        <Text variant="h1">Settings & Help</Text>
                        <Text variant="subtitle">Contact</Text>
                        <Text variant="body">{contactBlurb}</Text>
                        <TouchableOpacity onPress={handleGoToBlocks} style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <Text variant="subtitle">Manage Blocked Users</Text>
                            <View style={{
                                margin: 30,
                                marginBottom: 15,
                            }}>
                                <Entypo name="chevron-right" size={24} color="black" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handeDeleteAccount} style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <Text variant="subtitle" style={{ color: theme.colors.danger }}>Delete Account</Text>
                            <View style={{
                                margin: 30,
                                marginBottom: 15,
                            }}>
                                <Entypo name="chevron-right" size={24} color="black" style={{ color: theme.colors.danger }}/>
                            </View>
                        </TouchableOpacity>
                    </FadeInView>
                )}
            </ScrollView>
            <View
                style={{
                    width: "100%",
                    padding: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <StyledButton onPress={handleSignOut} loading={signingOut} color='primary'>Sign Out</StyledButton>
            </View>
        </FadeInView>
    );
}

export default AccountSettings;