import React from 'react';
import { useNavigation } from '@react-navigation/core';

// import Text from '../components/StyledText';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RootTabScreenProps } from '../../types';

function CustomAccountHeader() {
    const navigation = useNavigation();

    const handleNotificationsTap = () => {
        navigation.navigate('Root', {
            screen: 'Account',
            params: {
                screen: "AccountSettings"
            }
        } as never)
    }

    return (
        <View style={{
            width: "100%",
            paddingHorizontal: 10,
            paddingRight: 60,
            display: "flex",
            justifyContent: 'space-between',
            flexDirection: "row",
        }}>
            <View></View>
            <TouchableOpacity onPress={handleNotificationsTap}>
                <MaterialIcons name="settings" size={24} color="black" />
            </TouchableOpacity>
        </View>
    );
}

export default CustomAccountHeader;