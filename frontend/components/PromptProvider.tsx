import { Platform, StyleSheet, View } from "react-native";
import prompt, { PromptOptions } from "react-native-prompt-android";
import Dialog from 'react-native-dialog';
import React, { useEffect, useState } from "react";

let androidPromptRef: (title: string, message: string, buttons: Array<PromptButton>, options: PromptOptions) => void;
let promptLastCancelled = 0;

type PromptButton = {
    text?: string;
    onPress?: (message: string) => void;

    /** @platform ios */
    style?: 'default' | 'cancel' | 'destructive';
};

export default function compatiblePrompt(
    title?: string,
    message?: string,
    callbackOrButtons?: ((value: string) => void) | Array<PromptButton>,
    options?: PromptOptions,
) {
    if (!options) {
        options = { type: "default" };
    }
    if (Platform.OS === "android") {
        androidPromptRef(title || "", message || "", callbackOrButtons as Array<PromptButton>, options);
        return;
    }
    prompt(title, message, callbackOrButtons, options);
};

export function AndroidPromptProvider() {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [buttons, setButtons] = useState<PromptButton[]>([]);
    const [options, setOptions] = useState<PromptOptions>({ type: "default" });
    const [input, setInput] = useState("");

    androidPromptRef = (title: string, message: string, buttons: Array<PromptButton>, options: PromptOptions) => {
        const f = () => {
            setTitle(title);
            setMessage(message);
            setButtons(buttons);
            setOptions(options);
            setInput("");
            setVisible(true);
        };

        if (Date.now() - promptLastCancelled < 500) {
            setTimeout(f, 500);
        } else {
            f();
        }
    }

    const handleCancel = () => {
        setVisible(false);
    }

    useEffect(() => {
        if (!visible) {
            promptLastCancelled = Date.now();
        }
    }, [visible]);

    if (Platform.OS !== "android") {
        return null;
    }

    return (
        <View style={[StyleSheet.absoluteFill, styles.container]}>
            <Dialog.Container visible={visible}>
                <Dialog.Title>{title}</Dialog.Title>
                {message ? (
                    <Dialog.Description>
                        {message}
                    </Dialog.Description>
                ) : null}
                {options.type === "plain-text" && <Dialog.Input onChangeText={(t) => setInput(t)} />}
                {buttons.map((button, index) => {
                    if (button.style === "cancel") {
                        return <Dialog.Button key={index} label={button.text} onPress={handleCancel} />
                    }
                    return <Dialog.Button key={index} label={button.text} onPress={() => {
                        if (button.onPress) {
                            button.onPress(input);
                        }
                        setVisible(false);
                    }} />
                })
                }
            </Dialog.Container>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    }
})