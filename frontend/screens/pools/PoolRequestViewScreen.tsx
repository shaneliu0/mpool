import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Text from '../../components/StyledText';
import { cancelPoolRequest, defaultPoolRequestData, getPoolRequest, PoolPlace, PoolRequestData, updatePoolRequest, UpdatePoolRequestData, validateUpdatePoolRequest } from '../../dataAccess/poolData';
import { RootTabScreenProps } from '../../types';
import * as Logging from '../../Logging';
import { BulletList, DoubleText, ExpandableBox, Loading, PositionedMap } from '../../components/Display';
import { FadeInView } from '../../components/Animation';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import * as Conversion from '../../constants/Conversion';
import { GooglePlaceData, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import { DateTimeSelector, FlexiblePlacesSelector, PlaceInputModal, SingleSelect } from '../../components/Pickers';
import Toast from 'react-native-toast-message';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import StyledButton from '../../components/Button';

interface PoolRequestProps {
    seasonId: number;
    requestId: number;
    navigation: RootTabScreenProps<'Pool'>['navigation'];
}
function PoolRequest(props: PoolRequestProps) {
    const { seasonId: isid, requestId: irid, navigation } = props;
    const [request, setRequest] = useState<PoolRequestData>(defaultPoolRequestData);
    const [loadingRequest, setLoadingRequest] = useState<boolean>(true);
    const [cancelling, setCancelling] = useState(false);
    const [editingIdx, setEditingIdx] = useState<number>(-1);

    const [newDate, setNewDate] = useState(() => {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        return tmrw;
    });
    const [newFrom, setNewFrom] = useState<PoolPlace | null>(null);
    const [newTo, setNewTo] = useState<PoolPlace | null>(null);
    const [hasEditedDate, setHasEditedDate] = useState(false);
    const [hasEditedFrom, setHasEditedFrom] = useState(false);
    const [hasEditedTo, setHasEditedTo] = useState(false);
    const [dtsKey, setDtsKey] = useState(0);
    const viewPadding = useSharedValue(0);

    const handleCancelRequest = async () => {
        Alert.alert(
            'Cancel Request',
            'Are you sure? This can\'t be undone.',
            [
                {
                    text: 'Keep',
                    style: 'cancel',
                },
                {
                    text: 'Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            await cancelPoolRequest(requestId);
                            navigation.navigate('Pool', {
                                screen: "Home" 
                            } as never)
                        } catch (error) {
                            Logging.Error(error);
                        } finally {
                            setCancelling(false);
                        }
                    }
                }
            ]
        )
    }

    const onDateChange = (_: any, selectedDate: any) => {
        const currentDate = selectedDate || newDate;
        setHasEditedDate(true);
        setNewDate(currentDate);
    };

    const handleExpandEdit = (eidx: number) => () => {
        if (eidx == editingIdx) return setEditingIdx(-1);
        setEditingIdx(eidx);
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
                    const resp = await getPoolRequest(irid);
                    setRequest(resp);
                    setNewDate(new Date(resp.departTime));
                    setNewFrom(resp.from);
                    setNewTo(resp.to);
                    setLoadingRequest(false);
                } catch (e) {
                    Logging.Error(e);
                }
            })();
        }
    }, [editingIdx]);

    useEffect(() => {
        if (!hasEditedDate && !hasEditedFrom && !hasEditedTo) return;
        const updateObj: UpdatePoolRequestData = {};

        if (hasEditedDate) {
            updateObj.departDate = newDate.getTime();
        }
        if (hasEditedTo && newTo) {
            updateObj.toId = newTo.id;
        }
        if (hasEditedFrom && newFrom) {
            updateObj.fromId = newFrom.id;
        }

        (async () => {
            try {
                const valResp = await validateUpdatePoolRequest(irid, updateObj);
                if (valResp.errorMsg) return Alert.alert(valResp.errorMsg);
                const resp = await updatePoolRequest(irid, updateObj);
                setRequest(resp);
                setNewDate(new Date(resp.departTime));
                setNewFrom(resp.from);
                setNewTo(resp.to);
                Toast.show({
                    type: 'success',
                    text1: 'Saved!',
                    visibilityTime: 1000,
                });
            } catch (error) {
                Logging.Error(error);
            } finally {
                setHasEditedDate(false);
                setHasEditedFrom(false);
                setHasEditedTo(false);
            }
        })();

    }, [hasEditedDate, hasEditedFrom, hasEditedTo])

    if (loadingRequest) return <Loading shouldCenter defaultDelay />;
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
            <ScrollView style={[{ marginBottom: "auto", height: "100%", }, styles.fullWidth]} keyboardShouldPersistTaps="handled">
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
                                key={dtsKey}
                                onSelect={onDateChange}
                                value={newDate}
                                minuteInterval={15}
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
                            <FlexiblePlacesSelector
                                onSelect={(p) => {
                                    setNewFrom(p);
                                    setHasEditedFrom(true);
                                }}
                                items={request.destinations}
                                placeholder="Select your departure location"
                                value={newFrom}
                            />
                            <Text variant="bodylarge">Select your pickup location.</Text>
                            <BulletList
                                items={[
                                    "Set the location you would like to be picked up from.",
                                    "This isn't your final pickup location, which might change as you're matched.",
                                ]}
                                variant="bodylarge"
                            />
                            <Text variant="bodylarge">Destination</Text>
                            <FlexiblePlacesSelector
                                onSelect={(p) => {
                                    setNewTo(p);
                                    setHasEditedTo(true);
                                }}
                                items={request.destinations}
                                placeholder="Select your destination"
                                value={newTo}
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
                <Text variant="h2">Actions</Text>
                <View style={styles.buttonViewStyle}>
                    <StyledButton color="danger" loading={cancelling} onPress={handleCancelRequest}>Cancel Request</StyledButton>
                </View>
                {/* <View style={{ padding: 15, }}>
                    <Text variant="subtitle">Don't want to wait?</Text>
                    <View style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        marginVertical: 15,
                    }}>
                        <StyledButton color='secondary'>Browse</StyledButton>
                    </View>
                </View> */}
            </ScrollView>
        </FadeInView>
    );
}

export default function PoolRequestViewScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {

    if (!route.params) return null;
    const { requestId, seasonId } = route.params;

    return (
        <View>
            <PoolRequest seasonId={seasonId} requestId={requestId} navigation={navigation} />
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
    buttonViewStyle: {
        width: "100%",
        padding: 15,
        paddingLeft: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    }
});
