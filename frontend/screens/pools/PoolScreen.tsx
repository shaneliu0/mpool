import { AntDesign, MaterialCommunityIcons, MaterialIcons, } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, ScrollView, View, TouchableOpacity } from "react-native";
import { FadeInView } from "../../components/Animation";
import { BulletList, DoubleText, ExpandableBox, Loading, PositionedMap } from "../../components/Display";
import Text from "../../components/StyledText";
import { defaultPoolData, getPool, PoolMember } from "../../dataAccess/poolData";
import { RootTabScreenProps } from "../../types";
import * as Conversion from '../../constants/Conversion';
import { Avatar } from "native-base";
import StyledButton from "../../components/Button";
import * as Logging from '../../Logging';
import { PopUpModal } from "../../components/Modal";
import LottieView from 'lottie-react-native';
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface NavigationProp {
    navigation: RootTabScreenProps<'Pool'>['navigation'];
    embedMode?: boolean;
    onCloseModal?: () => void;
}

function PoolMemberTile(props: PoolMember & NavigationProp) {
    const { userId, name, photoUrl, username, navigation, embedMode, onCloseModal } = props;

    const handlePress = () => {
        if (embedMode && onCloseModal) {
            navigation.navigate('Chat', {
                screen: "ProfileView",
                params: { userId: userId },
            } as never);
            onCloseModal();
        } else {
            navigation.navigate('Pool', {
                screen: "ProfileView",
                params: { userId: userId },
            } as never);
        }
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <View
                style={{
                    borderRadius: 15,
                    borderStyle: "solid",
                    borderColor: "black",
                    borderWidth: 1,
                    marginHorizontal: 15,
                    marginVertical: 5,
                    display: "flex",
                    flexDirection: "row",
                    padding: 15,
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <View style={{
                    margin: 15,
                    display: "flex",
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Avatar
                        source={{
                            uri: photoUrl,
                        }}
                    />
                </View>
                <View style={{
                    margin: 15,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    marginRight: 150,
                }}>
                    <Text variant="h2">{name}</Text>
                    {username && <Text variant="body">{username}</Text>}
                </View>
                <AntDesign name="arrowright" size={24} color="black" style={{ marginRight: 15, }} />
            </View>
        </TouchableOpacity>
    )
}

interface PotentialPoolProps {
    canSubmit: boolean;
    onFinish: () => void;
    poolId: number;
    navigation: RootTabScreenProps<'Pool'>['navigation'];
}
function PotentialPool(props: PotentialPoolProps) {
    const { canSubmit, onFinish, poolId, navigation } = props;
    const [confirming, setConfirming] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const animation = useRef(null);

    const handleModalClose = () => setModalOpen(false);

    const handleConfirm = async () => {
        if (!canSubmit) return alert("Please check the times and location!");
        setConfirming(true);
        try {
            await new Promise<void>((resolve, reject) => setTimeout(() => resolve(), 1000));
            setModalOpen(true);
        } catch (e) {
            Logging.Error(e);
        } finally {
            setConfirming(false);
            onFinish
        }
    }

    const handleGoToChat = () => {
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
                    <StyledButton color="primary" onPress={handleGoToChat}>Go to chat</StyledButton>
                </View>
            </PopUpModal>
            <View
                style={{
                    width: "100%",
                    padding: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <StyledButton onPress={handleConfirm} loading={confirming} color='primary' disabled={!canSubmit}>Confirm and Join Pool</StyledButton>
            </View>
        </>
    )
}

interface PoolViewProps {
    poolId: number;
    navigation: RootTabScreenProps<'Pool'>['navigation'];
    embedMode?: boolean;
    onCloseModal?: () => void;
}
export function PoolView(props: PoolViewProps) {
    const { poolId, navigation, embedMode, onCloseModal } = props;

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
        const resp = await getPool(poolId);
        setPool(resp);
        setLoading(false);
    };

    const canSubmit = dateConfirmed && locationConfirmed;

    useEffect(() => {
        if (loading) {
            refreshPool();
        }
    }, []);

    if (loading) return <Loading shouldCenter defaultDelay />

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
                                top={from.name}
                                bottom={to.name}
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
                            top={from.name}
                            bottom={to.name}
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
            </ScrollView>
            {(!embedMode && status === "potential") && (
                <PotentialPool canSubmit={canSubmit} onFinish={refreshPool} poolId={poolId} navigation={navigation} />
            )}
        </FadeInView>
    )
}

function PoolScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {
    if (!route.params) return <Text variant="subtitle">Something went wrong!</Text>
    const { poolId } = route.params;

    return (
        <PoolView poolId={poolId} navigation={navigation} />
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
});


export default PoolScreen;