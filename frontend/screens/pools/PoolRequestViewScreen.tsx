import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Text from '../../components/StyledText';
import { defaultPoolRequestData, getPoolRequest, PoolRequestData } from '../../dataAccess/poolData';
import { RootTabScreenProps } from '../../types';
import * as Logging from '../../Logging';
import { BulletList, DoubleText, ExpandableBox, Loading, PositionedMap } from '../../components/Display';
import { FadeInView } from '../../components/Animation';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import * as Conversion from '../../constants/Conversion';
import { GooglePlaceData, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import { DateTimeSelector, PlaceInputModal, SingleSelect } from '../../components/Pickers';
import Toast from 'react-native-toast-message';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import StyledButton from '../../components/Button';

interface PoolRequestProps {
    seasonId: number;
    requestId: number;
}
function PoolRequest(props: PoolRequestProps) {
    const { seasonId: isid, requestId: irid } = props;
    const [request, setRequest] = useState<PoolRequestData>(defaultPoolRequestData);
    const [loadingRequest, setLoadingRequest] = useState<boolean>(true);
    const [editingIdx, setEditingIdx] = useState<number>(-1);

    const [newDate, setNewDate] = useState(() => {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        return tmrw;
    });
    const [newFrom, setNewFrom] = useState<GooglePlaceData & GooglePlaceDetail | null>(null);
    const [dest, setDest] = useState<string | undefined>(undefined);
    const [hasEditedDate, setHasEditedDate] = useState(false);
    const [hasEditedLoc, setHasEditedLoc] = useState(false);
    const viewPadding = useSharedValue(0);


    const onDateChange = (_: any, selectedDate: any) => {
        const currentDate = selectedDate || newDate;
        setHasEditedDate(true);
        setNewDate(currentDate);
    };

    const handleExpandEdit = (eidx: number) => () => {
        if (eidx == editingIdx) return setEditingIdx(-1);
        setEditingIdx(eidx);
    };

    const onDestChange = (newDest: string) => {
        setHasEditedLoc(true);
        setDest(newDest);
    };

    const animatedViewStyle = useAnimatedStyle(() => {
        return {
            paddingBottom: viewPadding.value,
        }
    })

    useEffect(() => {
        viewPadding.value = withTiming(editingIdx === 1 ? 150 : 0);
        if (loadingRequest) {
            (async () => {
                try {
                    const resp = await getPoolRequest(isid, irid);
                    setRequest(resp);
                    setLoadingRequest(false);

                    setNewDate(new Date(request.createdAt));

                } catch (e) {
                    Logging.Error(e);
                }
            })();
        }
    }, [editingIdx])

    if (loadingRequest) return <Loading shouldCenter defaultDelay />
    const {
        requestId,
        seasonName,
        seasonId,
        statusMessage,
        createdAt,
        updatedAt,
        departTime,
        from,
        to
    } = request;

    const timeEditIdx = 0;
    const locEditIdx = 1;

    const departDate = hasEditedDate ? newDate : new Date(request.departTime);

    return (
        <FadeInView>
            <ScrollView style={[{ marginBottom: "auto", height: "100%", }, styles.fullWidth]}>
                <Animated.View style={animatedViewStyle}>
                    <Text variant='h1'>{seasonName}</Text>
                    <Text variant='h2'>{statusMessage}</Text>
                    <ExpandableBox
                        head={
                            <DoubleText
                                icon={<AntDesign name="clockcircle" size={30} color="black" />}
                                top={Conversion.formatTime(departDate)}
                                bottom={Conversion.formatDate(departDate)}
                                adornment={<MaterialIcons name="mode-edit" size={24} color="black" />}
                            />
                        }
                        expanded={editingIdx === timeEditIdx}
                        onToggleExpand={handleExpandEdit(timeEditIdx)}
                        expandedHeight={350}
                    >
                        <View style={styles.innerPickerView}>
                            <DateTimeSelector
                                onSelect={onDateChange}
                                value={newDate}
                            // minuteInterval={15}
                            />
                            <Text variant="bodylarge">Edit your depart time.</Text>
                            <BulletList
                                items={[
                                    "Set the time you would like to leave for your destination.",
                                    "Remember, this doesn't have to be exact."
                                ]}
                                variant="bodylarge"
                            />
                        </View>
                    </ExpandableBox>
                    <ExpandableBox
                        head={
                            <DoubleText
                                icon={<MaterialIcons name="place" size={35} color="black" />}
                                top={from.name}
                                bottom={to.name}
                                adornment={<MaterialIcons name="mode-edit" size={24} color="black" />}
                            />
                        }
                        expanded={editingIdx === locEditIdx}
                        onToggleExpand={handleExpandEdit(locEditIdx)}
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
                                        setHasEditedLoc(true);
                                        setNewFrom({ ...place, ...details });
                                    }}
                                    fieldText="Select Pickup Location"
                                    fieldValue={newFrom?.description || ''}
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
                                items={request.destinations}
                                label="Select Option"
                                onValueChange={onDestChange}
                            />
                        </View>
                    </ExpandableBox>
                </Animated.View>
                <View
                    style={{
                        width: "100%",
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {(() => {
                        const { latitude: flat, longitude: flng } = request.from.coords;
                        const { latitude: tlat, longitude: tlng } = request.to.coords;
                        return (
                            <PositionedMap
                                fromCoords={{ latitude: flat, longitude: flng }}
                                toCoords={{ latitude: tlat, longitude: tlng }}
                            />
                        );
                    })()}
                </View>
                <View>
                    <View style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        margin: 32,
                        marginTop: 25,
                        marginBottom: 0,
                    }}>
                        <View style={{ marginTop: 10, }}>
                            <AntDesign name="hourglass" size={30} color="black" />
                        </View>
                        <Text variant="subtitle">Great matches take time.</Text>
                    </View>
                    <BulletList
                        items={[
                            "We're working to find you a match.",
                            "We'll send a notification when a match is found."
                        ]}
                        variant="bodylarge"
                    />
                </View>
                <View style={{ padding: 15, }}>
                    <Text variant="subtitle">Don't want to wait?</Text>
                    <View style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        marginVertical: 15,
                    }}>
                        <StyledButton color='secondary'>Browse</StyledButton>
                    </View>
                </View>
            </ScrollView>
        </FadeInView>
    );
}

export default function PoolRequestViewScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {

    if (!route.params) return null;
    const { requestId, seasonId } = route.params;

    return (
        <View>
            <PoolRequest seasonId={seasonId} requestId={requestId} />
        </View>
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
});
