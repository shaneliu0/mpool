import React, { useState } from "react";
import { Platform, StyleSheet, Button, } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

import { Text, View } from '../components/Themed';

import { GooglePlaceData, GooglePlaceDetail, GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_PLACES_API_KEY } from "../config";
import { HStack } from "native-base";

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
            onFail={(error) => console.error(error)}
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
            <HStack space={3} alignItems="center">
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

const styles = StyleSheet.create({
    datePicker: {
        width: '30%',
        height: Platform.OS === 'ios' ? 40 : 50,
    },
    androidDatePickerButton: {
        borderRadius: 30
    },
})