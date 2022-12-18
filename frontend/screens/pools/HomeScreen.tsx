import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

import { Modal, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import Toast from 'react-native-toast-message';

import Text from '../../components/StyledText';
import Button from '../../components/Button';
import { View } from '../../components/Themed';
import { RootTabScreenProps } from '../../types';

import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { ThemeContext } from '../../App';
import Layout from '../../constants/Layout';
import { selectUser } from '../../slices/authSlice';

import {
    getPoolSeasons, PoolSeasonData
} from '../../dataAccess/poolData';
import { } from '@react-navigation/core';
import * as Logging from '../../Logging';
import { Loading } from '../../components/Display';
import { FadeInView } from '../../components/Animation';

interface PoolSearchProps {
    navigation: RootTabScreenProps<'Pool'>['navigation'];
}

function HomeFeed(props: PoolSearchProps) {
    const { navigation } = props;
    const user = useSelector(selectUser);
    const [poolSeasons, setPoolSeasons] = useState<PoolSeasonData[]>([]);
    const [loadingPoolSeasons, setLoadingPoolSeasons] = useState<boolean>(true);
    const [expandedPoolIdx, setExpandedPoolIdx] = useState(-1);

    const onRefresh = (async () => {
        try {
            const resp = await getPoolSeasons();
            setPoolSeasons(resp);
            setLoadingPoolSeasons(false);
        } catch (e) {
            Logging.Error(e);
        }
    });

    useEffect(() => {
        if (loadingPoolSeasons) {
            onRefresh();
        }
    }, [loadingPoolSeasons])

    useEffect(() => {
        const willFocusSub = navigation.addListener('focus', () => {
            onRefresh();
        });

        return willFocusSub;
    }, []);

    const handleExpandPool = (poolIdx: number) => () => {
        if (expandedPoolIdx == poolIdx) return setExpandedPoolIdx(-1);
        setExpandedPoolIdx(poolIdx);
    }

    const renderPoolSeasons = () => {
        return (
            <FadeInView>
                {poolSeasons.map((season, idx) => (
                    <PoolSeason
                        key={idx}
                        navigation={navigation}
                        handleExpand={handleExpandPool(idx)}
                        expanded={expandedPoolIdx === idx}
                        {...season}
                    />
                ))}
            </FadeInView>
        )
    };

    return (
        <ScrollView style={styles.fullWidth}>
            <Text variant="h1">Hi {user?.displayName.split(' ')[0]}!</Text>
            <Text variant="h2">Break is just around the corner!</Text>
            <Text variant="subtitle">Upcoming Pools</Text>
            <View
                style={{
                    marginTop: 15,
                }}
            >
                {loadingPoolSeasons ? <Loading shouldCenter defaultDelay /> : renderPoolSeasons()}
            </View>
        </ScrollView>
    );
}

interface PoolSeasonComponentProps {
    navigation: RootTabScreenProps<'Pool'>['navigation'];
    handleExpand: () => void;
    expanded: boolean;
}

function PoolSeason(props: PoolSeasonData & PoolSeasonComponentProps) {
    const {
        id,
        name,
        collapsedBodyText,
        expandedBodyText,
        requestId,
        poolId,
        navigation,
        handleExpand,
        expanded,
    } = props;
    const EXPANDED_HEIGHT = 180;
    const COLLAPSED_HEIGHT = 120;

    const theme = useContext(ThemeContext);
    const height = useSharedValue(COLLAPSED_HEIGHT - 25);
    const buttonOpacity = useSharedValue(0);
    const toggleExpand = () => handleExpand();

    const handleViewRequest = () => {
        navigation.navigate('Pool', {
            screen: 'PoolRequestView',
            params: { requestId: requestId, seasonId: id }
        } as never);
    };

    const handleViewPool = () => {
    };

    const handleCreateRequest = () => {
        navigation.navigate('Pool', {
            screen: 'PoolRequestCreation',
            params: {
                seasonId: id,
            }
        } as never);
    };

    const animatedViewStyle = useAnimatedStyle(() => {
        return {
            height: height.value,
        }
    });

    const animatedButtomStyle = useAnimatedStyle(() => {
        return {
            opacity: buttonOpacity.value,
        };
    });

    useEffect(() => {
        height.value = withTiming(expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT);
        buttonOpacity.value = withDelay(200, withTiming(expanded ? 1 : 0));
    }, [expanded]);

    const textColor = theme.complementColors['primary'];

    return (
        <Animated.View
            style={[
                {
                    paddingHorizontal: 15,
                    marginVertical: 10,
                },
                animatedViewStyle
            ]}
        >
            <TouchableOpacity
                onPress={toggleExpand}
                style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: Layout.roundRadius,
                    height: "100%",
                }}
            >
                <Text variant="h2" style={{ color: textColor }}>{name}</Text>
                {(() => {
                    if (expanded && requestId) {
                        return (
                            <>
                                <Text variant="body" style={[{ color: textColor }, styles.poolSeasonBodyText]}>{expandedBodyText}</Text>
                                <Animated.View style={[animatedButtomStyle, styles.poolSeasonButtonView]}>
                                    <Button onPress={handleViewRequest} color="secondary" style={styles.poolSeasonButton}>View Request</Button>
                                </Animated.View>
                            </>
                        );
                    } else if (expanded && poolId) {
                        return (
                            <>
                                <Text variant="body" style={[{ color: textColor }, styles.poolSeasonBodyText]}>{expandedBodyText}</Text>
                                <Animated.View style={[animatedButtomStyle, styles.poolSeasonButtonView]}>
                                    <Button onPress={handleViewPool} color="secondary" style={styles.poolSeasonButton}>View Pool</Button>
                                </Animated.View>
                            </>
                        );
                    } else if (expanded) {
                        return (
                            <>
                                <Text variant="body" style={[{ color: textColor }, styles.poolSeasonBodyText]}>{expandedBodyText}</Text>
                                <Animated.View style={[animatedButtomStyle, styles.poolSeasonButtonView]}>
                                    <Button onPress={handleCreateRequest} color="secondary" style={styles.poolSeasonButton}>Create Request</Button>
                                </Animated.View>
                            </>
                        );
                    } else {
                        return (
                            <Text variant="body" style={[{ color: textColor }, styles.poolSeasonBodyText]}>{collapsedBodyText}</Text>
                        );
                    }
                })()}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function HomeScreen({ navigation }: RootTabScreenProps<'Pool'>) {
    return (
        <View style={styles.container}>
            <HomeFeed
                navigation={navigation}
            />
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
        width: '95%',
    },
    poolSeasonButtonView: {
        width: '95%',
        marginLeft: 10,
        marginRight: 'auto',
        marginBottom: 10,
        marginTop: 'auto',
    },
    poolSeasonBodyText: {
        marginBottom: 15
    },
    poolSeasonButton: {
        width: "100%",
    },
    poolSeasonComponent: {

    }
});
