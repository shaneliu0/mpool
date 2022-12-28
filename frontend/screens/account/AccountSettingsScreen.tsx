import React, { useEffect, useState } from 'react';
import { FadeInView } from '../../components/Animation';
import { Loading } from '../../components/Display';
import { RootStackParamList, RootStackScreenProps } from '../../types';
import Text from '../../components/StyledText';

import { getAuth } from 'firebase/auth';
import { ScrollView, View } from 'react-native';
import StyledButton from '../../components/Button';
import { getContactBlurb } from '../../dataAccess/static';
import * as Logging from '../../Logging';

const auth = getAuth();

function AccountSettings() {
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [contactBlurb, setContactBlurb] = useState("");

    const handleSignOut = async () => {
        setSigningOut(true);
        await new Promise<void>(resolve => setTimeout(resolve, 500));
        auth.signOut();
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