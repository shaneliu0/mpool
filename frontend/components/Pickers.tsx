import React, { useContext, useEffect, useState } from "react";
import { Platform, StyleSheet, Button, useColorScheme, Modal, ScrollView } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

import { Text, View } from '../components/Themed';

import {
    CheckIcon, Heading,
    IconButton,
    Input,
    Menu,
    Select
} from 'native-base';

import { GooglePlaceData, GooglePlaceDetail, GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_PLACES_API_KEY } from "../config";
import { HStack } from "native-base";
import { ThemeContext } from "../Context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Logging from '../Logging';
import { defaultPoolPlace, PoolPlace, PoolPlaceCategory } from "../dataAccess/poolData";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { placeCatEnum } from "../constants/Conversion";

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
                    textInput && textInput.focus && textInput.focus()
                },
            }}
            fetchDetails
        />
    )
}

interface SingleSelectProps {
    selectedValue: string | undefined;
    onValueChange: (newValue: string) => void;
    items: { label: string, value: string }[];
    label: string;
}
export function SingleSelect(props: SingleSelectProps) {
    const { selectedValue, items, label, onValueChange } = props;

    const renderItems = () => items.map(({ label, value }, idx) => (
        <Select.Item label={label} value={value} key={idx} />
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

interface FlexiblePlacesSelectorProps {
    onSelect: (place: PoolPlace) => void;
    items: PoolPlaceCategory[];
    placeholder: string;
    value: PoolPlace | null;
    enforceOnlyAirports?: boolean;
    enforceNotAirports?: boolean;
}
export function FlexiblePlacesSelector(props: FlexiblePlacesSelectorProps) {
    const { onSelect, placeholder, value, items, enforceOnlyAirports, enforceNotAirports } = props;
    const colorScheme = useColorScheme();
    const theme = useContext(ThemeContext);
    const [modalVisible, setModalVisible] = useState(false);

    const [choosingExternal, setChoosingExternal] = useState(false);

    const onExternalSelect = (place: GooglePlaceData, details: GooglePlaceDetail | null) => {
        setModalVisible(false);
        setChoosingExternal(false);

        if (!details?.geometry) {
            Toast.show({
                type: "error",
                text1: "Couldn't locate",
            })
            return;
        };

        onSelect({
            name: place.description,
            id: place.place_id,
            coords: {
                latitude: details.geometry.location.lat || 0,
                longitude: details.geometry.location.lng || 0,
            }
        });
    }

    const onInternalSelect = (place: PoolPlace) => {
        setModalVisible(false);
        onSelect(place);
    }

    useEffect(() => {
        if (modalVisible) {
            setChoosingExternal(false);
        }
    }, [modalVisible])

    const { name } = value || defaultPoolPlace;

    const hasAirportTerminals = items.some(item => item.category_id === placeCatEnum['airport_terminal']);

    return (
        <>
            {Platform.OS === 'ios' ? (
                <View style={styles.flexiblePickerView}>
                    <Input
                        placeholder={placeholder}
                        onPressOut={() => setModalVisible(true)}
                        value={name}
                        isReadOnly
                        isDisabled={modalVisible}
                        style={{ width: "100%" }}
                    />
                </View>
            ) : (
                <View style={styles.flexiblePickerView}>
                    <Input
                        placeholder={placeholder}
                        onPressIn={() => setModalVisible(true)}
                        value={name}

                        isDisabled={modalVisible}
                        style={{ width: "100%" }}
                    />
                </View>
            )}
            <Modal
                animationType="slide"
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
                style={{
                    margin: 50,
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalView, { backgroundColor: theme.background, padding: 0 }]}>
                        <HStack justifyContent="flex-start" style={[styles.alignRight, { padding: 35, paddingBottom: 0 }]}>
                            <IconButton
                                onPress={() => {
                                    if (choosingExternal) {
                                        setChoosingExternal(false);
                                    } else {
                                        setModalVisible(false);
                                    }
                                }}
                            >
                                <MaterialIcons key={String(choosingExternal)} name={choosingExternal ? "arrow-back" : "close"} size={24} color={colorScheme === 'light' ? '#000' : '#FFF'} />
                            </IconButton>
                            {choosingExternal ? (
                                <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600" }}>Start typing a location...</Heading>

                            ) : (
                                <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600" }}>Select a location</Heading>
                            )}
                        </HStack>
                        <View style={[styles.placeSelector, { width: "90%", paddingHorizontal: 20 }]}>
                            {(() => {
                                if (choosingExternal) {
                                    return (
                                        <PlacesSelector
                                            onSelect={onExternalSelect}
                                        />
                                    )
                                } else {
                                    return (
                                        <ScrollView>
                                            <View style={{ marginBottom: 60 }}>
                                                {items
                                                    .filter(i => {
                                                        if (enforceOnlyAirports && hasAirportTerminals) {
                                                            return i.category_id === placeCatEnum['airport_terminal'];
                                                        }
                                                        if (enforceNotAirports) {
                                                            return i.category_id !== placeCatEnum['airport_terminal'];
                                                        }
                                                        return true;
                                                    })
                                                    .map((c, idx) => {
                                                        return (
                                                            <Menu.Group title={c.category} key={c.category_id}>
                                                                {c.places.map((i, idx) => {
                                                                    return (
                                                                        <Menu.ItemOption
                                                                            key={idx}
                                                                            value={i.id}
                                                                            bg={i.id === value?.id ? "cyan.600" : undefined}
                                                                            style={{ borderRadius: 15, }}
                                                                            onPress={() => {
                                                                                onInternalSelect(i);
                                                                            }}
                                                                        >
                                                                            {i.name}
                                                                        </Menu.ItemOption>
                                                                    )
                                                                })}
                                                            </Menu.Group>
                                                        )
                                                    })}
                                                {(!(enforceOnlyAirports && hasAirportTerminals)) ? (
                                                    <Menu.Group title="Other Locations">
                                                        {(value && !items.some(i => i.places.some(p => p.id === value?.id))) ? (
                                                            <Menu.ItemOption
                                                                value={value?.id}
                                                                bg={"cyan.600"}
                                                                style={{ borderRadius: 15 }}
                                                            >
                                                                {value?.name}
                                                            </Menu.ItemOption>
                                                        ) : <></>}
                                                        <Menu.ItemOption
                                                            value=""
                                                            style={{ borderRadius: 15 }}
                                                            onPress={() => {
                                                                setChoosingExternal(true);
                                                            }}
                                                        >
                                                            Select a different location
                                                        </Menu.ItemOption>
                                                    </Menu.Group>
                                                ) : (
                                                    null
                                                )}
                                            </View>
                                        </ScrollView>
                                    )
                                }
                            })()}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
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

    let tipComponent = (
        <>
            <Text style={{ fontWeight: "300", marginLeft: 15 }}>This time is in your local device timezone.</Text>
            <Text style={{ fontWeight: "300", marginLeft: 15 }}></Text>
            <Text style={{ fontWeight: "300", marginLeft: 15 }}>You will see the time in your university's timezone</Text>
            <Text style={{ fontWeight: "300", marginLeft: 15 }}>on the home screen after you create the request.</Text>
        </>
    )

    // if (new Date().getTimezoneOffset() !== 300) {
    //     tipComponent = (
    //         <>
    //             <Text style={{ fontWeight: "300", marginLeft: 15 }}>This time is in your local device timezone.</Text>
    //             <Text style={{ fontWeight: "300", marginLeft: 15 }}></Text>
    //             <Text style={{ fontWeight: "300", marginLeft: 15 }}>Warning: Your device timezone is NOT</Text>
    //             <Text style={{ fontWeight: "300", marginLeft: 15 }}>set to UMich's Eastern Time.</Text>
    //             <Text style={{ fontWeight: "300", marginLeft: 15 }}></Text>
    //             <Text style={{ fontWeight: "300", marginLeft: 15 }}>You will see the time in your university's timezone</Text>
    //             <Text style={{ fontWeight: "300", marginLeft: 15 }}>on the home screen after you create the request.</Text>
    //         </>
    //     )
    // }

    if (Platform.OS === 'ios') {
        return (
            <View>
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
                {tipComponent}
            </View>
        )
    } else if (Platform.OS === "android") {
        return (
            <View>
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
                            minuteInterval={minuteInterval}
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
                            minuteInterval={minuteInterval}
                        />
                    )}
                </HStack>
                {tipComponent}
            </View>
        )
    } else {
        return <Text>Unknown</Text>
    }
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
    const [fieldDisabled, setFieldDisabled] = useState(false);

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
        width: "90%",
        height: "90%",
    },
    alignRight: {
        marginRight: "auto"
    },
    placeSelector: {
        borderRadius: 20,
        padding: 10,
        width: "90%",
        height: "90%",
    },
    flexiblePickerView: {
        width: "100%",
        paddingHorizontal: 15,
        marginVertical: 15,
    }
})