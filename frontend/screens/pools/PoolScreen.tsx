import { AntDesign, MaterialCommunityIcons, MaterialIcons, } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert } from "react-native";
import { FadeInView } from "../../components/Animation";
import { DoubleText, Loading, PositionedMap } from "../../components/Display";
import Text from "../../components/StyledText";
import { declinePotentialPool, defaultPoolData, getPool, leavePool, PoolMember } from "../../dataAccess/poolData";
import { RootTabScreenProps } from "../../types";
import * as Conversion from '../../constants/Conversion';
import { Avatar } from "native-base";
import StyledButton from "../../components/Button";
import * as Logging from '../../Logging';

interface NavigationProp {
    navigation: RootTabScreenProps<'Pool'>['navigation'];
    embedMode?: boolean;
    onCloseModal?: () => void;
}

export function PoolMemberTile(props: PoolMember & NavigationProp) {
    const { userId, name, photoUrl, username, status, navigation, embedMode, onCloseModal } = props;

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
                }}>
                    <Text variant="h2">{name}</Text>
                    {username && <Text variant="body">{username}</Text>}
                </View>
                <View style={{ marginRight: 15 }}>
                    {Conversion.getIconFromPoolMemberStatus(status)}
                </View>
            </View>
        </TouchableOpacity>
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
    const [leaving, setLeaving] = useState(false);
    const [declining, setDeclining] = useState(false);

    const toggleDateConfirmed = () => setDateConfirmed(!dateConfirmed);
    const toggleLocationConfirmed = () => setLocationConfirmed(!locationConfirmed);

    const handleLeavePool = () => {
        Alert.alert(
            'Leave Pool',
            'Are you sure? You can\'t join back.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        setLeaving(true);
                        try {
                            await leavePool(poolId);
                            onCloseModal && onCloseModal();
                            navigation.navigate('Chat', {
                                screen: "Chats"
                            } as never);
                            setTimeout(() => {
                                navigation.navigate('Pool', {
                                    screen: "Home"
                                } as never);
                            }, 1000);
                        } catch (error) {
                            Logging.Error(error);
                        } finally {
                            setLeaving(false);
                        }
                    }
                }
            ]
        )
    }

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
            const resp = await getPool(poolId);
            setPool(resp);
            setLoading(false);
        } catch (error) {
            Logging.Error(error);
        }
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
                                    top={Conversion.truncateAndEllipsis(from.name, 20)}
                                    bottom={Conversion.truncateAndEllipsis(to.name, 20)}
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
                                top={Conversion.truncateAndEllipsis(from.name, 20)}
                                bottom={Conversion.truncateAndEllipsis(to.name, 20)}
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
                    <Text variant="h2">Actions</Text>
                    <View style={styles.buttonViewStyle}>
                        <StyledButton color="danger" loading={leaving} onPress={handleLeavePool}>Leave Pool</StyledButton>
                    </View>
                </View>
            </ScrollView>
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