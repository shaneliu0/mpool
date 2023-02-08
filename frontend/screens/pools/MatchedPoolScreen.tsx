import { AntDesign, MaterialCommunityIcons, MaterialIcons, } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert } from "react-native";
import { FadeInView } from "../../components/Animation";
import { BulletList, DoubleText, ExpandableBox, Loading, PositionedMap } from "../../components/Display";
import Text from "../../components/StyledText";
import { acceptPotentialPool, declinePotentialPool, defaultPoolData, getMatchedPoolId, getPool, getPotentialPool, PoolMember } from "../../dataAccess/poolData";
import { RootTabScreenProps } from "../../types";
import * as Conversion from '../../constants/Conversion';
import { Avatar } from "native-base";
import StyledButton from "../../components/Button";
import * as Logging from '../../Logging';
import { PopUpModal } from "../../components/Modal";
import LottieView from 'lottie-react-native';
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { PoolMemberTile } from "./PoolScreen";
import * as Haptics from 'expo-haptics';

interface PotentialPoolProps {
    canSubmit: boolean;
    onFinish: () => void;
    matchId: number;
    navigation: RootTabScreenProps<'Pool'>['navigation'];
    embedMode?: boolean;
}
function PotentialPool(props: PotentialPoolProps) {
    const { canSubmit, onFinish, matchId, navigation, embedMode } = props;
    const [confirming, setConfirming] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const animation = useRef(null);

    const handleModalClose = () => {
        onFinish();
        setModalOpen(false);
    };

    const handleConfirm = async () => {
        if (confirming) return;
        if (!canSubmit) return alert("Please check the times and location!");
        setConfirming(true);
        try {
            await acceptPotentialPool(matchId);
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );
            if (embedMode) {
                onFinish();
            } else {
                setModalOpen(true);
            }
        } catch (e) {
            Logging.Error(e);
        } finally {
            setConfirming(false);
        }
    }

    const handleDecline = () => {
        const _decline = async () => {
            setDeclining(true);
            try {
                await declinePotentialPool(matchId);
            } catch (e) {
                Logging.Error(e);
            } finally {
                setDeclining(false);
                onFinish();
            }
        }
        Alert.alert(
            'Decline Request',
            'Are you sure? We\'ll get back on finding a different match for you. This cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: _decline,
                }
            ]
        )
    }

    const handleGoToChat = () => {
        getMatchedPoolId(matchId).then((data) => {
            const { poolId, error } = data;
            if (error) {
                Alert.alert(error);
            }

            navigation.navigate('Chat');
            setTimeout(() => {
                navigation.navigate('Chat', {
                    screen: 'SpecificChat',
                    params: {
                        chatId: poolId
                    }
                } as never);
            }, 250);
            handleModalClose();
        })
    }

    return (
        <>
            <PopUpModal
                onClose={handleModalClose}
                open={modalOpen}
                title="Successfully Joined!"
            >
                <View style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <LottieView
                        autoPlay
                        loop={false}
                        ref={animation}
                        source={require('../../assets/lottie/confirmationCheck.json')}
                    />
                </View>
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                }}>
                    <Text variant="h1">What's next:</Text>
                    <BulletList
                        variant="body"
                        items={[
                            "Your poolmates have been notified.",
                            "Chat with them to finalize your meetup time and location."
                        ]}
                    />
                    {!embedMode && <StyledButton color="primary" onPress={handleGoToChat}>Go to chat</StyledButton>}
                </View>
            </PopUpModal>
            <View
                style={{
                    width: "100%",
                    padding: 15,
                    paddingLeft: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                }}
            >
                <View style={{ width: "50%" }}>
                    <StyledButton onPress={handleDecline} loading={declining} variant="outlined" color='secondary'>Decline</StyledButton>
                </View>
                <View style={{ width: "50%" }}>
                    <StyledButton onPress={handleConfirm} loading={confirming} color='primary' disabled={!canSubmit}>Confirm and Join</StyledButton>
                </View>
            </View>
        </>
    )
}

interface PoolViewProps {
    poolId: number | undefined;
    matchId: number | undefined;
    navigation: RootTabScreenProps<'Pool'>['navigation'];
    embedMode?: boolean;
    onCloseModal?: () => void;
}
export function MatchedPoolView(props: PoolViewProps) {
    const { poolId, matchId, navigation, embedMode, onCloseModal } = props;

    const [loading, setLoading] = useState(true);
    const [pool, setPool] = useState(defaultPoolData);
    const [dateConfirmed, setDateConfirmed] = useState(false);
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const toggleDateConfirmed = () => setDateConfirmed(!dateConfirmed);
    const toggleLocationConfirmed = () => setLocationConfirmed(!locationConfirmed);

    const renderPoolMembers = () => {
        return pool.members.map((m, idx) =>
            <PoolMemberTile
                key={idx}
                {...m}
                navigation={navigation}
                embedMode={embedMode}
                onCloseModal={onCloseModal}
            />
        )
    }

    const refreshPool = async () => {
        try {
            if (poolId) {
                const resp = await getPool(poolId);
                setPool(resp);
            } else if (matchId) {
                const resp = await getPotentialPool(matchId)
                setPool(resp);
            } else {
                throw new Error("Couldn't find match");
            }
        } catch (error) {
            Logging.Error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoToChat = () => {
        if (!matchId) return;
        getMatchedPoolId(matchId).then((data) => {
            const { poolId, error } = data;
            if (error) {
                Alert.alert(error);
            }

            navigation.navigate('Chat');
            setTimeout(() => {
                navigation.navigate('Chat', {
                    screen: 'SpecificChat',
                    params: {
                        chatId: poolId
                    }
                } as never);
            }, 250);
        })
    }

    const canSubmit = dateConfirmed && locationConfirmed;

    useEffect(() => {
        if (loading) {
            refreshPool();
        }
    }, []);

    if (loading) return <Loading shouldCenter defaultDelay />

    if (pool.error) {
        // prmopt the alert, then after the user taps ok, navigate back.
        Alert.alert(pool.error, "", [
            {
                text: "OK",
                onPress: () => navigation.goBack()
            }
        ]);
    }

    const {
        seasonName,
        status,
        statusMessage,
        departTime,
        from,
        to,
    } = pool;
    const departDate = new Date(departTime);
    const blankCheck = <MaterialCommunityIcons name="checkbox-blank-outline" size={24} color="black" />;
    const checkedCheck = <MaterialCommunityIcons name="checkbox-marked" size={24} color="black" />;
    return (
        <FadeInView>
            <ScrollView
                style={[{ marginBottom: "auto", height: "100%", }, styles.fullWidth]}
            >
                <View style={{ marginBottom: embedMode ? 100 : 25 }}>
                    <Text variant="h1">{seasonName}</Text>
                    <Text variant="h2">{statusMessage}</Text>
                    {(status === "potential" ? (
                        <>
                            <TouchableOpacity onPress={toggleDateConfirmed}>
                                <DoubleText
                                    icon={<AntDesign name="clockcircle" size={30} color="black" />}
                                    top={Conversion.formatTime(departDate)}
                                    bottom={Conversion.formatDate(departDate)}
                                    adornment={dateConfirmed ? checkedCheck : blankCheck}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleLocationConfirmed}>
                                <DoubleText
                                    icon={<MaterialIcons name="place" size={35} color="black" />}
                                    top={Conversion.truncateAndEllipsis(from.name, 15)}
                                    bottom={Conversion.truncateAndEllipsis(to.name, 15)}
                                    adornment={locationConfirmed ? checkedCheck : blankCheck}
                                />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <DoubleText
                                icon={<AntDesign name="clockcircle" size={30} color="black" />}
                                top={Conversion.formatTime(departDate)}
                                bottom={Conversion.formatDate(departDate)}
                            />
                            <DoubleText
                                icon={<MaterialIcons name="place" size={35} color="black" />}
                                top={Conversion.truncateAndEllipsis(from.name, 15)}
                                bottom={Conversion.truncateAndEllipsis(to.name, 15)}
                            />
                        </>
                    ))}
                    <View style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        marginVertical: 15,
                    }}>
                        {(() => {
                            return (
                                <PositionedMap
                                    fromCoords={from.coords}
                                    toCoords={to.coords}
                                />
                            )
                        })()}
                    </View>
                    <View>
                        <Text variant="h2">Pool Members</Text>
                        <View style={{
                            marginTop: 5,
                        }}>
                            {renderPoolMembers()}
                        </View>
                    </View>
                    {(embedMode && status === "potential") && (
                        <PotentialPool embedMode canSubmit={canSubmit} onFinish={refreshPool} matchId={matchId || -1} navigation={navigation} />
                    )}
                </View>
            </ScrollView>
            {(!embedMode && status === "potential") && (
                <PotentialPool canSubmit={canSubmit} onFinish={refreshPool} matchId={matchId || -1} navigation={navigation} />
            )}
            {(!embedMode && status === 'confirmed') && (
                <View
                    style={{
                        width: "100%",
                        padding: 15,
                        paddingLeft: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                    }}
                >
                    <StyledButton color="primary" onPress={handleGoToChat}>Go to chat</StyledButton>
                </View>
            )}
        </FadeInView>
    )
}

function PoolScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {
    if (!route.params) return <Text variant="subtitle">Something went wrong!</Text>
    const { poolId, matchId } = route.params;

    return (
        <MatchedPoolView poolId={poolId} matchId={matchId} navigation={navigation} />
    )
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


export default PoolScreen;