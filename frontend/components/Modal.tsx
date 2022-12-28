import { MaterialIcons } from "@expo/vector-icons";
import { HStack, IconButton, Heading } from "native-base";
import React, { useContext } from "react";

import { Modal, StyleSheet, View } from 'react-native';
import { ThemeContext } from "../Context";
import { TextButton } from "./Button";
import { Loading } from "./Display";
import Text from "./StyledText";

interface AlternateAction {
    text: string;
    loadingText: string;
    action: () => void;
    loading: boolean;
}
interface PageSheetModalProps {
    children: React.ReactNode;
    open: boolean;
    title: string;
    onClose: () => void;
    altAction?: AlternateAction;
}
export function PageSheetModal(props: PageSheetModalProps) {
    const {
        children,
        onClose,
        open,
        title,
        altAction
    } = props;

    const handleClose = () => onClose && onClose();

    return (
        <Modal
            presentationStyle="pageSheet"
            animationType="slide"
            visible={open}
        >
            <View style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexDirection: "row",
                height: 50,
                width: "100%",
                paddingHorizontal: 10,
            }}>
                <View></View>
                <Text variant="subtitle" style={{ fontSize: 20, }}>{title}</Text>
                {(() => {
                    if (altAction && altAction.loading) {
                        return <TextButton onPress={altAction.action}>{altAction.loadingText}</TextButton>
                    }
                    if (altAction && !altAction.loading) {
                        return <TextButton onPress={altAction.action}>{altAction.text}</TextButton>
                    }

                    return (
                        <TextButton onPress={handleClose}>Done</TextButton>
                    )
                })()}
            </View>
            <View>
                {children}
            </View>
        </Modal>
    );
};

interface PopUpModalProps {
    children: React.ReactNode;
    open: boolean;
    title: string;
    onClose: () => void;
}
export function PopUpModal(props: PopUpModalProps) {
    const { open, onClose, children, title } = props;
    const theme = useContext(ThemeContext);

    return (
        <Modal
            animationType="slide"
            visible={open}
        >
            <View style={styles.modalContainer}>
                <View
                    style={[
                        styles.modalView,
                        { backgroundColor: theme.background }
                    ]}
                >
                    <HStack justifyContent="flex-start" style={styles.alignRight}>
                        <IconButton
                            onPress={onClose}
                        >
                            <MaterialIcons name='close' size={24} color={theme.text} />
                        </IconButton>
                        {true ? (
                            <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600" }}>{title}</Heading>

                        ) : (
                            <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600", color: 'black' }}>{title}</Heading>
                        )}
                    </HStack>
                    <View style={styles.modalContent}>
                        {children}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalView: {
        margin: 20,
        marginTop: 100,
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: "90%"
    },
    alignRight: {
        marginRight: "auto"
    },
    modalContent: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        width: "90%",
        height: "90%",
    },
});
