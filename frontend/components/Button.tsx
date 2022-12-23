import React, { useContext } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text,
    StyleProp
} from 'react-native';
import { ThemeContext } from '../App';
import { ActivityIndicator, View } from 'react-native';
import GLogo from '../assets/svgs/glogo.svg';

function FilledButton(props: StyledButtonProps) {
    const {
        color,
        children,
        style,
        onPress,
        loading,
        disabled,
        fontSize,
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
                            fontSize: fontSize,
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
        fontSize,
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
                            fontSize: fontSize,
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
    fontSize?: number;
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
    color?: "primary" | "secondary";
    onPress: () => void;
}
export function TextButton(props: TextButtonProps) {
    const { children, onPress, color } = props;

    return (
        <>
            <TouchableOpacity onPress={onPress} style={{ margin: 10, marginTop: 20, }}>
                <Text style={{
                    fontSize: 20,
                    color: color === 'secondary' ? "black" : "#007AFF",
                }}>{children}</Text>
            </TouchableOpacity>
        </>
    )
}

interface SignInWithGoogleButtonProps {
    onPress: () => void;
}
export function SignInWithGoogleButton(props: SignInWithGoogleButtonProps) {
    const { onPress, } = props;

    return (
        <TouchableOpacity
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                height: 56,
                width: 300,
                borderRadius: 20,
                backgroundColor: "#FFFFFF",
            }}
            onPress={onPress}
        >
            <GLogo style={{ margin: 20, width: 30, height: 30, }} />
            <Text style={{
                color: "#797979",
                fontWeight: "500",
                fontFamily: "Roboto",
                fontSize: 20,
                lineHeight: 23,
                marginRight: 65,
            }}>Sign in with Google</Text>
        </TouchableOpacity>
    )
}