import * as React from 'react';
import { StyleProp, TextPropTypes, TextStyle } from 'react-native';

import { Text as BaseText, TextProps } from './Themed';

const baseTextStyle: StyleProp<TextStyle> = {
  fontFamily: 'System',
};

export function MonoText(props: TextProps) {
  return <BaseText {...props} style={[props.style, { fontFamily: 'space-mono' }]} />;
}

export interface CustomTextProps {
  variant:
  "h1" |
  "h2" |
  "subtitle" |
  "body" |
  "bodylarge";
}

// ex: "Hi <name>!"
function Heading1(props: TextProps) {
  return <BaseText {...props} style={[{
    fontSize: 36,
    fontWeight: '500',
    marginTop: 15,
    marginLeft: 15,
    lineHeight: 43,
  }, props.style, baseTextStyle]} />;
}

// ex: "Fall Break is just around the corner!"
function Heading2(props: TextProps) {
  return <BaseText {...props} style={[{
    fontSize: 24,
    fontWeight: '300',
    marginTop: 15,
    marginLeft: 15,
    lineHeight: 24,
  }, props.style, baseTextStyle]} />;
}
// ex: "Upcoming Pools"
function Subtitle1(props: TextProps) {
  return <BaseText {...props} style={[{
    fontSize: 24,
    fontWeight: '400',
    marginTop: 15,
    marginLeft: 15,
    lineHeight: 29,
  }, props.style, baseTextStyle]} />;
}

function Body(props: TextProps) {
  return <BaseText {...props} style={[{
    fontSize: 16,
    fontWeight: '300',
    marginTop: 15,
    marginLeft: 15,
    lineHeight: 19,
  }, props.style, baseTextStyle]} />;
}

function BodyLarge(props: TextProps) {
  return <BaseText {...props} style={[{
    fontSize: 24,
    fontWeight: '300',
    marginTop: 15,
    marginLeft: 15,
    lineHeight: 29,
  }, props.style, baseTextStyle]} />
}

export default function Text(props: TextProps & CustomTextProps) {
  const { variant } = props;

  switch (variant) {
    case "h1":
      return <Heading1 {...props} />
    case "h2":
      return <Heading2 {...props} />
    case "subtitle":
      return <Subtitle1 {...props} />
    case "body":
      return <Body {...props} />
    case "bodylarge":
      return <BodyLarge {...props} />
  }
}
