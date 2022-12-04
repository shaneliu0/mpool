import { IInputProps, Input } from "native-base";
import React from "react";
import { View } from "react-native";

interface TextInputProps {
    variant: IInputProps['variant'];
    placeholder: string;
}
export function TextInput(props: TextInputProps) {
    const { variant, placeholder } = props;

    return (
        <View>
            <Input variant={variant} />
        </View>
    )
}