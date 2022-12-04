import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";

interface ChipProps {
    content: React.ReactText;
}
export function Chip(props: ChipProps) {
    const { content, } = props;

    return (
        <View style={{
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgb(189, 189, 189)",
            borderRadius: 16,
            height: 40,
            padding: 10,
            margin: 2,
        }}>
            <Text>
                {content}
            </Text>
        </View>
    )
}

interface ChipContainerProps {
    children: React.ReactNode;
    hideOverflow?: boolean;
    noPadding?: boolean;
}
export function ChipContainer(props: ChipContainerProps) {
    const { children, hideOverflow, noPadding } = props;

    return (
        <ScrollView
            horizontal
            style={{
                marginTop: 10,
                paddingHorizontal: noPadding ? undefined : 10,
                width: "100%",
                overflow: hideOverflow ? "hidden" : "visible"
            }}
        >
            {children}
        </ScrollView>
    )
}