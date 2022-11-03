import React, { useContext, useState } from "react";
import { Platform, StyleSheet, Button, useColorScheme, Modal, } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

import { Text, View } from '../components/Themed';

import {
    CheckIcon,
    Heading,
    IconButton,
    Input,
    Select
} from 'native-base';

import { GooglePlaceData, GooglePlaceDetail, GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_PLACES_API_KEY } from "../config";
import { HStack } from "native-base";
import { ThemeContext } from "../App";
import { MaterialIcons } from "@expo/vector-icons";
import * as Logging from '../Logging';

interface PlacesSelectorProps {
    onSelect: (place: GooglePlaceData, details: GooglePlaceDetail | null) => void;
}
export function PlacesSelector(props: PlacesSelectorProps) {
    const { onSelect } = props;

    return (
        <GooglePlacesAutocomplete
            placeholder="Search"
            query={{
                key: GOOGLE_PLACES_API_KEY,
                language: 'en', // language of the results
            }}
            onPress={onSelect}
            onFail={(error) => Logging.Error(error)}
            requestUrl={{
                url:
                    'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
                useOnPlatform: 'web',
            }} // this in only required for use on the web. See https://git.io/JflFv more for details.
            enablePoweredByContainer={false}
            textInputProps={{
                // Super hacky..
                ref: (textInput: any) => {
                    setTimeout(() => textInput && textInput.focus(), 100);
                },
            }}
            fetchDetails
        />
    )
}


interface DateTimeSelectorProps {
    onSelect: (event: any, selectedDate: any) => void;
    value: Date;
    minuteInterval?: number;
}
export function DateTimeSelector(props: DateTimeSelectorProps) {
    const { onSelect, value, minuteInterval } = props;
    const [dateSelectorOpen, setDateSelectorOpen] = useState(false);
    const [timeSelectorOpen, setTimeSelectorOpen] = useState(false);

    const androidOnSelect = (event: any, selectedDate: any) => {
        onSelect(event, selectedDate);
    }

    if (Platform.OS === 'ios') {
        return (
            <HStack style={{ width: 450 }} space={3} alignItems="center">
                <DateTimePicker
                    minimumDate={new Date()}
                    testID="dateTimePicker"
                    value={value}
                    mode={'date'}
                    display="default"
                    onChange={onSelect}
                    style={styles.datePicker}
                    minuteInterval={minuteInterval}
                />
                <DateTimePicker
                    minimumDate={new Date()}
                    testID="dateTimePicker"
                    value={value}
                    mode={'time'}
                    display="default"
                    onChange={onSelect}
                    style={styles.datePicker}
                    minuteInterval={minuteInterval}
                />
            </HStack>
        )
    } else if (Platform.OS === "android") {
        return (
            <>
                <HStack space={3} alignItems="center" style={{ marginLeft: 15 }}>
                    {/* date selector */}
                    <Button
                        title={moment(value).format("MMMM, DD, YYYY")}
                        onPress={() => {
                            if (dateSelectorOpen) {
                                setDateSelectorOpen(false);
                                setDateSelectorOpen(true);
                            } else {
                                setDateSelectorOpen(true);
                            }
                        }}
                    />
                    {/* time selctor */}
                    <Button
                        title={moment(value).format("hh:mm A")}
                        onPress={() => {
                            if (timeSelectorOpen) {
                                setTimeSelectorOpen(false);
                                setTimeSelectorOpen(true);
                            } else {
                                setTimeSelectorOpen(true);
                            }
                        }}
                    />
                    {timeSelectorOpen && (
                        <DateTimePicker
                            minimumDate={new Date()}
                            testID="dateTimePicker"
                            value={value}
                            mode={'time'}
                            display="default"
                            onChange={(event: any, selectedDate: any) => {
                                setTimeSelectorOpen(false);
                                onSelect(event, selectedDate);
                            }}
                            style={styles.datePicker}
                        />
                    )}
                    {dateSelectorOpen && (
                        <DateTimePicker
                            minimumDate={new Date()}
                            testID="dateTimePicker"
                            value={value}
                            mode={'date'}
                            display="default"
                            onChange={(event: any, selectedDate: any) => {
                                setDateSelectorOpen(false);
                                onSelect(event, selectedDate);
                            }}
                            style={styles.datePicker}
                        />
                    )}
                </HStack>
            </>
        )
    } else {
        return <Text>Unknown</Text>
    }
}

interface SingleSelectProps {
    selectedValue: string | undefined;
    onValueChange: (newValue: string) => void;
    items: { label: string, value: string }[];
    label: string;
}
export function SingleSelect(props: SingleSelectProps) {
    const { selectedValue, items, label, onValueChange } = props;

    const renderItems = () => items.map(({ label, value }) => (
        <Select.Item label={label} value={value} />
    ))

    return (
        <View style={styles.singleSelect}>
            <Select
                selectedValue={selectedValue}
                accessibilityLabel={label}
                placeholder={label}
                onValueChange={onValueChange}
                _selectedItem={{
                    bg: "cyan.600",
                    endIcon: <CheckIcon size={4} />,
                }}
            >
                {renderItems()}
            </Select>
        </View>
    )
}

interface PlaceInputModalProps {
    onSelect: (place: GooglePlaceData, details: GooglePlaceDetail | null) => void;
    fieldText: string;
    fieldValue: string;
}
export function PlaceInputModal(props: PlaceInputModalProps) {
    const { onSelect, fieldText, fieldValue } = props;
    const colorScheme = useColorScheme();
    const theme = useContext(ThemeContext);
    const [modalVisible, setModalVisible] = useState(false);
    const [fieldDisabled, FieldDisabled] = useState(false);

    const onSelectProxy = (place: GooglePlaceData, details: GooglePlaceDetail | null) => {
        setModalVisible(false);
        onSelect(place, details);
    }

    return (
        <>
            <Input
                placeholder={fieldText}
                onPressOut={() => setModalVisible(true)}
                value={fieldValue}
                isDisabled={modalVisible}
                style={{ width: "100%" }}
            />
            <Modal
                animationType="slide"
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
                style={{
                    margin: 50
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalView, { backgroundColor: theme.background }]}>
                        <HStack justifyContent="flex-start" style={styles.alignRight}>
                            <IconButton
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <MaterialIcons name='close' size={24} color={colorScheme === 'light' ? '#000' : '#FFF'} />
                            </IconButton>
                            {true ? (
                                <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600" }}>Start typing a location...</Heading>

                            ) : (
                                <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600", color: 'black' }}>Start typing a location...</Heading>
                            )}
                        </HStack>
                        <View style={[styles.placeSelector, { width: "90%" }]}>
                            <PlacesSelector
                                onSelect={onSelectProxy}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    datePicker: {
        width: '30%',
        height: Platform.OS === 'ios' ? 40 : 50,
    },
    androidDatePickerButton: {
        borderRadius: 30
    },
    singleSelect: {
        width: "100%",
        padding: 15,
    },
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
    placeSelector: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        width: "90%",
        height: "90%",
    },
})