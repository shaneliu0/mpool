import React from 'react';
import { useNavigation } from '@react-navigation/core';

// import Text from '../components/StyledText';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootTabScreenProps } from '../../types';

function CustomHomeHeader() {
    const navigation = useNavigation();

    const handleNotificationsTap = () => {
        navigation.navigate('Root', {
            screen: 'Pool',
            params: {
                screen: "Notifications"
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
            {/* TODO: replace this with a real logo */}
            <Text style={{
                fontSize: 25,
            }}>MPool</Text>
            <TouchableOpacity onPress={handleNotificationsTap}>
                <MaterialCommunityIcons name="bell" size={24} color="black" />
            </TouchableOpacity>
        </View>
    );
}

export default CustomHomeHeader;