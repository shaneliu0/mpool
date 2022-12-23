import React, { useState } from 'react';
import { FadeInView } from '../../components/Animation';
import { Loading } from '../../components/Display';
import { RootStackParamList, RootStackScreenProps } from '../../types';
import Text from '../../components/StyledText';

import { getAuth } from 'firebase/auth';
import { ScrollView, View } from 'react-native';
import StyledButton from '../../components/Button';

const auth = getAuth();

function AccountSettings() {
    const [loading, setLoading] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        await new Promise<void>(resolve => setTimeout(resolve, 1000));
        auth.signOut();
    }

    if (loading) return <Loading defaultDelay shouldCenter />

    return (
        <FadeInView>
            <ScrollView style={{ height: "100%", marginBottom: "auto" }}>
                <Text variant="h1">Settings</Text>
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