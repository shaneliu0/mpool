import React, { useContext } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text,
    StyleProp
} from 'react-native';
import { ThemeContext } from '../App';
import { ActivityIndicator, View } from 'react-native';

function FilledButton(props: StyledButtonProps) {
    const {
        color,
        children,
        style,
        onPress,
        loading,
        disabled,
    } = props;
    const theme = useContext(ThemeContext);

    // const OuterComponent = (disabled ? View : TouchableOpacity) as React.ComponentType<any>;
    const bgcolor = disabled ? "rgba(0,0,0,.06)" : theme.colors[color];

    return (
        <TouchableOpacity
            style={[{
                width: "90%",
                height: 40,
                backgroundColor: bgcolor,
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

function OutlinedButton(props: StyledButtonProps) {
    const {
        color,
        children,
        style,
        onPress,
        loading,
        disabled,
    } = props;
    const theme = useContext(ThemeContext);


    const forecolor = disabled ? "rgba(0,0,0,.06)" : theme.colors[color];
    return (
        <TouchableOpacity
            style={[{
                width: "90%",
                height: 40,
                backgroundColor: theme.background,
                borderStyle: "solid",
                borderWidth: 1,
                borderRadius: 15,
                borderColor: forecolor,
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
                            color: forecolor,
                        }}
                    >{children}</Text>
                );
            })()}
        </TouchableOpacity>
    );
}

interface StyledButtonProps {
    color: "primary" | "secondary";
    variant?: "filled" | "outlined";
    children: React.ReactText,
    style?: StyleProp<any>,
    onPress?: () => void;
    loading?: boolean;
    disabled?: boolean;
}
export default function StyledButton(props: StyledButtonProps) {
    const {
        variant,
    } = props;

    switch (variant) {
        case 'outlined':
            return <OutlinedButton {...props} />;
        case 'filled':
        default:
            return <FilledButton {...props} />
    }
}

interface TextButtonProps {
    children: React.ReactText;
    onPress: () => void;
}
export function TextButton(props: TextButtonProps) {
    const { children, onPress } = props;

    return (
        <>
            <TouchableOpacity onPress={onPress} style={{ margin: 10, marginTop: 20, }}>
                <Text style={{
                    fontSize: 20,
                    color: "#007AFF",
                }}>{children}</Text>
            </TouchableOpacity>
        </>
    )
}