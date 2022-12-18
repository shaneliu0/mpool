import React, { useState } from 'react';
import { FadeInView } from '../../components/Animation';
import { Loading } from '../../components/Display';
import { RootStackParamList, RootStackScreenProps } from '../../types';
import Text from '../../components/StyledText';

function AccountSettings() {
    const [loading, setLoading] = useState(false);

    if (loading) return <Loading defaultDelay shouldCenter />

    return (
        <FadeInView>
            <Text variant="h1">Settings</Text>
        </FadeInView>
    );
}

export default AccountSettings;