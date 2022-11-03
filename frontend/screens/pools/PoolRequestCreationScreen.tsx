import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, Modal, useColorScheme, ScrollView, ViewPagerAndroidBase } from 'react-native';
import { RootTabScreenProps } from '../../types';
import Toast from 'react-native-toast-message';

import Text from '../../components/StyledText';
import { getPoolSeasonDetails, PoolSeasonDetails } from '../../dataAccess/poolData';
import { DoubleText, ExpandableBox, BulletList, Loading, PositionedMap } from '../../components/Display';
import { AntDesign, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { DateTimeSelector, PlaceInputModal, PlacesSelector, SingleSelect } from '../../components/Pickers';
import { Heading, HStack, IconButton, Input } from 'native-base';
import { GooglePlaceData, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import { ThemeContext } from '../../App';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import StyledButton from '../../components/Button';
import * as Logging from '../../Logging';

import * as Conversion from '../../constants/Conversion';

const PLACE_FROM_PLACEHOLD = "From: ---";
const PLACE_TO_PLACEHOLD = "To: ---";

interface SendingRequestProps {

}
function SendingRequest(props: SendingRequestProps) {
    const { } = props;

    return (
        <View>
            <Text variant='h1'>One moment please...</Text>
        </View>
    )
}

export default function PoolRequestCreationScreen({ route, navigation }: RootTabScreenProps<'PoolRoot'>) {
    const [loadingPoolDetails, setLoadingPoolDetails] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [poolSeasonDetails, setPoolSeasonDetails] = useState<PoolSeasonDetails>({ id: -1, displayTitle: "", destinations: [] });
    const [hasSelectedDate, setHasSelectedDate] = useState(false);
    const [expandedPickerId, setExpandedPickerId] = useState(-1);
    const [location, setLocation] = useState<GooglePlaceData & GooglePlaceDetail | null>(null);
    const [dest, setDest] = useState<string | undefined>(undefined);
    const [date, setDate] = useState(() => {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        return tmrw;
    });

    const viewOpacity = useSharedValue(0);

    useEffect(() => {
        if (loadingPoolDetails) {
            (async () => {
                try {
                    const data = await getPoolSeasonDetails(seasonId);
                    setPoolSeasonDetails(data);
                    setLoadingPoolDetails(false);
                } catch (e) {
                    Logging.Error(e);
                }
            })();
        }
        if (!loadingPoolDetails) {
            viewOpacity.value = withTiming(1);
            setTimeout(() => {
                setExpandedPickerId(timePickerId);
            }, 250);
        }
    }, [loadingPoolDetails]);

    if (!route.params) return <Text variant='body'>Season not found!</Text>
    const { seasonId } = route.params;
    const { displayTitle, destinations } = poolSeasonDetails;

    const timePickerId = 0;
    const placePickerId = 1;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
            setSubmitting(false);
        } catch (e) {
            Logging.Error(e);
        }
    };

    const handleExpand = (pid: number) => () => {
        if (expandedPickerId === pid) return setExpandedPickerId(-1);
        setExpandedPickerId(pid);
    };

    const onDateChange = (event: any, selectedDate: any) => {
        const currentDate = selectedDate || date;
        setHasSelectedDate(true);
        setDate(currentDate);
    };

    const onDestChange = (newDest: string) => {
        setDest(newDest);
    };

    const animatedViewStyle = useAnimatedStyle(() => {
        return {
            opacity: viewOpacity.value,
        };
    });
    if (loadingPoolDetails) return <Loading shouldCenter delay={500} />

    const destObj = dest && poolSeasonDetails.destinations.find(e => e.value === dest);
    const locationsSelected = !!(location && dest && destObj);
    return (
        <Animated.View
            style={[animatedViewStyle]}
        >
            <ScrollView style={[{ marginBottom: "auto", height: "100%", }, styles.fullWidth]}>
                <View style={{ paddingBottom: 150 }}>
                    <Text variant="h1">{displayTitle}</Text>
                    <Text variant="h2">You're creating a new pool request.</Text>
                    <ExpandableBox
                        head={
                            <DoubleText
                                icon={<AntDesign name="clockcircle" size={30} color="black" />}
                                top={Conversion.formatTime(date, hasSelectedDate)}
                                bottom={Conversion.formatDate(date, hasSelectedDate)}
                            />
                        }
                        expanded={timePickerId === expandedPickerId}
                        onToggleExpand={handleExpand(timePickerId)}
                        expandedHeight={350}
                    >
                        <View style={styles.innerPickerView}>
                            <DateTimeSelector
                                onSelect={onDateChange}
                                value={date}
                                minuteInterval={15}
                            />
                            <Text variant="bodylarge">Select your depart time.</Text>
                            <BulletList
                                items={[
                                    "Set the time you would like to leave for your destination.",
                                    "Don't worry, this doesn't have to be exact."
                                ]}
                                variant="bodylarge"
                            />
                        </View>
                    </ExpandableBox>
                    <ExpandableBox
                        head={
                            <DoubleText
                                icon={<MaterialIcons name="place" size={35} color="black" />}
                                top={locationsSelected ? `From: ${location.structured_formatting.main_text}` : PLACE_FROM_PLACEHOLD}
                                bottom={locationsSelected ? `To: ${Conversion.removeInParentheses(destObj?.label || "")}` : PLACE_TO_PLACEHOLD}
                            />
                        }
                        expanded={placePickerId === expandedPickerId}
                        onToggleExpand={handleExpand(placePickerId)}
                        expandedHeight={350}
                    >
                        <View style={styles.innerPickerView}>
                            <Text variant="bodylarge">Pickup Location</Text>
                            <View style={{
                                width: "100%",
                                paddingHorizontal: 15,
                                marginVertical: 15,
                            }}>
                                <PlaceInputModal
                                    onSelect={(place, details) => {
                                        if (!details) {
                                            return Toast.show({
                                                type: 'error',
                                                text1: 'Something went wrong!',
                                                text2: 'Try selecting a different place',
                                            })
                                        }
                                        setLocation({ ...place, ...details });
                                    }}
                                    fieldText="Select Pickup Location"
                                    fieldValue={location?.description || ''}
                                />
                            </View>
                            <Text variant="bodylarge">Select your pickup location.</Text>
                            <BulletList
                                items={[
                                    "Set the location you would like to be picked up from.",
                                    "This isn't your final pickup location, which might change as you're matched.",
                                ]}
                                variant="bodylarge"
                            />
                            <Text variant="bodylarge">Destination</Text>
                            <SingleSelect
                                selectedValue={dest}
                                items={destinations}
                                label="Select Option"
                                onValueChange={onDestChange}
                            />
                        </View>
                    </ExpandableBox>
                </View>
                <View
                    style={{
                        width: "100%",
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {(() => {
                        if (!locationsSelected) return null;
                        const { lat, lng } = location.geometry.location;
                        const { latitude, longitude } = destObj.location;
                        return (
                            <PositionedMap
                                fromCoords={{ latitude: lat, longitude: lng }}
                                toCoords={{ latitude: latitude, longitude: longitude }}
                            />
                        );
                    })()}
                </View>
            </ScrollView>
            <View
                style={{
                    width: "100%",
                    padding: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <StyledButton onPress={handleSubmit} loading={submitting} color='primary'>Create Request</StyledButton>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        direction: 'ltr',
    },
    fullWidth: {
        width: '100%',
    },
    innerPickerView: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingHorizontal: 15,
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
});
