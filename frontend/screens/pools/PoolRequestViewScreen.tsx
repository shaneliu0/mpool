import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RootTabScreenProps } from '../../types';



export default function PoolRequestViewScreen({ navigation }: RootTabScreenProps<'PoolRoot'>) {
    return (
        <View style={styles.container}>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        direction: 'ltr',
    },
    fullWidth: {
        width: '100%',
    },
});
