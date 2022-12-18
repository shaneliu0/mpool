import React from 'react';
import { View, Dimensions } from 'react-native';
import { FadeInView } from './Animation';
import StyledText from './StyledText';

const windowHeight = Dimensions.get('window').height;
const componentHeight = windowHeight / 1.5;

export function ChatEmpty() {
  return (
    <FadeInView style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: componentHeight,
    }}>
      <StyledText variant="bodylarge">Nothing here yet</StyledText>
      <StyledText>Join a pool and it will show up here.</StyledText>
    </FadeInView>
  )
}