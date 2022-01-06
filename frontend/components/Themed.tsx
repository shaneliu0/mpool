/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import * as React from 'react';
import { Text as DefaultText, View as DefaultView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];
export type CheckIconProps = ThemeProps & DefaultView['props'];


export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function CheckIcon(props: CheckIconProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: "#009F6B", dark: darkColor }, 'text');

  return <Ionicons name="checkmark" size={24} style={[{ color }, style]} {...otherProps} />;
}
export function CrossIcon(props: CheckIconProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: "#C40233", dark: darkColor }, 'text');

  return <Ionicons name="close" size={24} style={[{ color }, style]} {...otherProps} />;
}

export function InfoIcon(props: CheckIconProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: "#0087BD", dark: darkColor }, 'text');

  return <Ionicons name="information-circle-outline" size={24} style={[{ color }, style]} {...otherProps} />;
}

export function WarningIcon(props: CheckIconProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: "#FFD300", dark: darkColor }, 'text');

  return <Ionicons name="warning" size={24} style={[{ color }, style]} {...otherProps} />;
}

export function NotFoundIcon(props: CheckIconProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: "#000000", dark: darkColor }, 'text');

  return <Ionicons name="chevron-forward-outline" size={24} style={[{ color }, style]} {...otherProps} />;
}