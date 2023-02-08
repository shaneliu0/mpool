import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { RootTabScreenProps } from '../../types';

import Text from '../../components/StyledText';
import { PoolPlace, defaultPoolSeasonDetails, getPoolSeasonDetails, PoolSeasonDetails, postPoolRequest, validatePoolRequest } from '../../dataAccess/poolData';
import { DoubleText, ExpandableBox, BulletList, Loading, PositionedMap } from '../../components/Display';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { DateTimeSelector, FlexiblePlacesSelector } from '../../components/Pickers';
import StyledButton from '../../components/Button';
import { FadeInView } from '../../components/Animation';
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

export default function PoolRequestCreationScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {
    const [loadingPoolDetails, setLoadingPoolDetails] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [poolSeasonDetails, setPoolSeasonDetails] = useState<PoolSeasonDetails>(defaultPoolSeasonDetails);
    const [hasSelectedDate, setHasSelectedDate] = useState(false);
    const [expandedPickerId, setExpandedPickerId] = useState(-1);
    const [from, setFrom] = useState<PoolPlace | null>(null);
    const [to, setTo] = useState<PoolPlace | null>(null);
    const [date, setDate] = useState(() => {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        return tmrw;
    });

    useEffect(() => {
        if (loadingPoolDetails) {
            (async () => {
                try {
                    const data = await getPoolSeasonDetails(seasonId);
                    if (data.infoAlert) {
                        Alert.alert(data.infoAlert);
                    }
                    setPoolSeasonDetails(data);
                    if (data.defaultTime) {
                        setDate(new Date(data.defaultTime));
                    }
                    setLoadingPoolDetails(false);
                } catch (e) {
                    Logging.Error(e);
                }
            })();
        }
        if (!loadingPoolDetails) {
            setTimeout(() => {
                setExpandedPickerId(timePickerId);
            }, 250);
        }
    }, [loadingPoolDetails]);

    if (!route.params) return <Text variant='body'>Season not found!</Text>
    const { seasonId } = route.params;
    const { displayTitle, destinations, enforceFromAirport, enforceToAirport } = poolSeasonDetails;

    const timePickerId = 0;
    const placePickerId = 1;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (!hasSelectedDate || !from || !to) return Alert.alert("Please fill out all fields.");
            const valResp = await validatePoolRequest(seasonId, {
                departDate: date.getTime(),
                fromId: from.id,
                toId: to.id,
            });
            if (valResp.errorMsg) return Alert.alert(valResp.errorMsg);
            const resp = await postPoolRequest(seasonId, {
                departDate: date.getTime(),
                fromId: from.id,
                toId: to.id,
            });
            navigation.navigate('Pool', {
                screen: 'PoolRequestView',
                params: { requestId: resp.requestId, seasonId: seasonId }
            } as never);
        } catch (e: any) {
            Logging.Error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExpand = (pid: number) => () => {
        if (expandedPickerId === pid) return setExpandedPickerId(-1);
        setExpandedPickerId(pid);
    };

    const onDateChange = (_: any, selectedDate: any) => {
        const currentDate = selectedDate || date;
        setHasSelectedDate(true);
        setDate(currentDate);
    };

    if (loadingPoolDetails) return <Loading shouldCenter defaultDelay />

    const locationsSelected = !!(to && from);
    return (
        <FadeInView>
            <ScrollView style={[{ marginBottom: "auto", height: "100%", }, styles.fullWidth]} keyboardShouldPersistTaps="handled">
                <View style={{ marginBottom: 150, }}>
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
                                top={locationsSelected ? `From: ${from.name}` : PLACE_FROM_PLACEHOLD}
                                bottom={locationsSelected ? `To: ${Conversion.removeInParentheses(to.name)}` : PLACE_TO_PLACEHOLD}
                            />
                        }
                        expanded={placePickerId === expandedPickerId}
                        onToggleExpand={handleExpand(placePickerId)}
                        expandedHeight={350}
                    >
                        <View style={styles.innerPickerView}>
                            <Text variant="bodylarge">Pickup Location</Text>
                            <FlexiblePlacesSelector
                                onSelect={setFrom}
                                items={destinations}
                                placeholder="Select your departure location"
                                value={from}
                                enforceOnlyAirports={enforceFromAirport}
                                enforceNotAirports={enforceToAirport}
                            />
                            <Text variant="bodylarge">Destination</Text>
                            <FlexiblePlacesSelector
                                onSelect={setTo}
                                items={destinations}
                                placeholder="Select your destination"
                                value={to}
                                enforceOnlyAirports={enforceToAirport}
                                enforceNotAirports={enforceFromAirport}
                            />
                            <Text variant="bodylarge">Select your pickup location.</Text>
                            <BulletList
                                items={[
                                    "Set the location you would like to be picked up from.",
                                    "This isn't your final pickup location, which might change as you're matched.",
                                ]}
                                variant="bodylarge"
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
                        const { latitude: flat, longitude: flng } = from.coords;
                        const { latitude: tlat, longitude: tlng } = to.coords;
                        return (
                            <PositionedMap
                                fromCoords={{ latitude: flat, longitude: flng }}
                                toCoords={{ latitude: tlat, longitude: tlng }}
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
        </FadeInView>
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
