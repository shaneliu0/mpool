import React, { useContext } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text,
    StyleProp
} from 'react-native';
import { ThemeContext } from '../App';


interface StyledButtonProps {
    color: "primary" | "secondary";
    children: React.ReactText,
    style?: StyleProp<any>,
    onPress?: () => void;
}
export default function StyledButton(props: StyledButtonProps) {
    const {
        color,
        children,
        style,
        onPress
    } = props;
    const theme = useContext(ThemeContext);

    return (
        <TouchableOpacity
            style={[{
                width: 320,
                height: 40,
                backgroundColor: theme.colors[color],
                borderRadius: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }, style]}
            onPress={onPress}
        >
            <Text
                style={{
                    color: theme.complementColors[color],
                }}
            >{children}</Text>
        </TouchableOpacity>
    );
}