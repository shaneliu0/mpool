import { iteratorSymbol } from "immer/dist/internal";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Platform, StyleProp, StyleSheet, useColorScheme, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Text, { CustomTextProps } from '../components/StyledText';
import MapView, { LatLng, Marker, Provider, PROVIDER_DEFAULT, PROVIDER_GOOGLE, } from 'react-native-maps';
import { useTheme } from "native-base";

const mapsProvider: Provider = Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

interface PositionedMapProps {
    fromCoords: LatLng;
    toCoords: LatLng;
}
export function PositionedMap(props: PositionedMapProps) {
    const { fromCoords, toCoords } = props;
    const { colors } = useTheme();
    const scheme = useColorScheme();

    return (
        <MapView
            style={styles.map}
            initialRegion={{
                latitude: 42.2545488,
                longitude: -83.5171204,
                latitudeDelta: 0.0922 * 2.5,
                longitudeDelta: 0.0421 * 2.5
            }}
            provider={mapsProvider}
        >
            <Marker
                key="start"
                coordinate={fromCoords}
                title="Start"

            />
            <Marker
                key="end"
                coordinate={toCoords}
                title="End"
            />
        </MapView>
    )
}

interface DoubleTextProps {
    icon: React.ReactNode;
    top: string,
    bottom: string,
    adornment?: React.ReactNode;
}
export function DoubleText(props: DoubleTextProps) {
    const { icon, top, bottom } = props;

    if (props.adornment) {
        return <AdornedDoubleText adornment={props.adornment} {...props} />
    }

    return (
        <View style={styles.container}>
            <View
                style={{
                    width: 100,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {icon}
            </View>
            <View>
                <Text variant="body">{top}</Text>
                <Text variant="subtitle">{bottom}</Text>
            </View>
        </View>
    );
}

interface AdornedDoubleTextProps extends DoubleTextProps {
    adornment: React.ReactNode;
}
function AdornedDoubleText(props: AdornedDoubleTextProps) {
    const { adornment, ...otherProps } = props;

    return (
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
        }}>
            <DoubleText
                {...otherProps}
            />
            <View style={{
                display: 'flex',
                justifyContent: 'center',
                padding: 30,
            }}>
                {adornment}
            </View>
        </View>
    )
}

interface ExpandableBoxProps {
    head: React.ReactNode;
    expanded: boolean;
    expandedHeight: NonNullable<React.CSSProperties['height']>;
    onToggleExpand: () => void;
    children: React.ReactNode;
}
const CHILDREN_ORIGINAL_HEIGHT = 0;
const CHILDREN_ORIGINAL_OPACITY = 0;
const CHILDREN_EXPANDED_OPACITY = 1;
export function ExpandableBox(props: ExpandableBoxProps) {
    const { head, expanded, expandedHeight, onToggleExpand, children } = props;
    const childrenHeight = useSharedValue(0);
    const childrenOpacity = useSharedValue(0);

    useEffect(() => {
        childrenHeight.value = withTiming(expanded ? expandedHeight : CHILDREN_ORIGINAL_HEIGHT);
        childrenOpacity.value = withDelay(expanded ? 200 : 0, withTiming(expanded ? CHILDREN_EXPANDED_OPACITY : CHILDREN_ORIGINAL_OPACITY));
    }, [expanded]);

    const animatedChildrenStyle = useAnimatedStyle(() => {
        return {
            height: childrenHeight.value,
            opacity: childrenOpacity.value,
        };
    });

    return (
        <>
            <TouchableOpacity onPress={onToggleExpand}>
                <View>{head}</View>
            </TouchableOpacity>
            <Animated.View
                style={animatedChildrenStyle}
                pointerEvents={expanded ? "auto" : "none"}
            >
                {children}
            </Animated.View>
        </>
    );
}

interface BulletListProps {
    items: string[];
    variant: CustomTextProps['variant'];
    textStyle?: StyleProp<any>;
}
export function BulletList(props: BulletListProps) {
    const { items, variant, textStyle } = props;

    return (
        <View style={styles.bulletListView}>
            {items.map((item, idx) => {
                return (
                    <View style={{ marginBottom: 10 }} key={idx}>
                        <Text variant={variant} style={{ fontSize: 20, marginTop: 0, }}>{`\u2022 ${item}`}</Text>
                    </View>
                );
            })}
        </View>
    )
}

interface LoadingProps {
    shouldCenter?: boolean;
    delay?: number;
    defaultDelay?: boolean;
}
const DEFAULT_DELAY = 1000;
export function Loading(props: LoadingProps) {
    const { shouldCenter, delay, defaultDelay } = props;
    const [show, setShow] = useState<boolean>((defaultDelay || delay) ? false : true);
    const cdelay = defaultDelay ? DEFAULT_DELAY : delay;

    useEffect(() => {
        if (!show) {
            setTimeout(() => {
                setShow(true);
            }, cdelay)
        }
    }, []);

    const viewStyle = shouldCenter ? styles.centerView : null;

    if (!show) return <View style={viewStyle} />;

    return (
        <View style={viewStyle}>
            <ActivityIndicator />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "row",
        height: 100
    },
    bulletListView: {
        padding: 20,
    },
    centerView: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: "center",
        height: "100%",
        width: "100%",
    },
    map: {
        width: Dimensions.get('window').width - 20,
        height: Dimensions.get('window').height / 5,
        borderRadius: 10,
    }
});