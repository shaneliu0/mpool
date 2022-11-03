import React, { useContext } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text,
    StyleProp
} from 'react-native';
import { ThemeContext } from '../App';
import { ActivityIndicator } from 'react-native';
import { View } from './Themed';

interface StyledButtonProps {
    color: "primary" | "secondary";
    children: React.ReactText,
    style?: StyleProp<any>,
    onPress?: () => void;
    loading?: boolean;
    // disabled?: boolean;
}
export default function StyledButton(props: StyledButtonProps) {
    const {
        color,
        children,
        style,
        onPress,
        loading
        // disabled,
    } = props;
    const theme = useContext(ThemeContext);

    return (
        <TouchableOpacity
            style={[{
                width: "90%",
                height: 40,
                backgroundColor: theme.colors[color],
                borderRadius: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
            }, style]}
            onPress={onPress}
        >
            {(() => {
                if (loading) return (
                    <ActivityIndicator style={{ marginHorizontal: 15, }} />
                );
                return (
                    <Text
                        style={{
                            color: theme.complementColors[color],
                        }}
                    >{children}</Text>
                );
            })()}
        </TouchableOpacity>
    );
}