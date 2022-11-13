import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';


interface FadeInViewProps {
    show?: boolean;
    children: React.ReactNode;
}
export function FadeInView(props: FadeInViewProps) {
    const { show, children } = props;
    const opacity = useSharedValue(0);
    const cshow = show === undefined ? true : show;

    const animatedViewStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        }
    });

    useEffect(() => {
        opacity.value = withTiming(cshow ? 1 : 0);
    }, [cshow])

    return (
        <Animated.View
            style={animatedViewStyle}
        >
            {children}
        </Animated.View>
    )
}