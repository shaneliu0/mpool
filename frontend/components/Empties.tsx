import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { FadeInView } from './Animation';
import StyledText from './StyledText';

const windowHeight = Dimensions.get('window').height;
const componentHeight = windowHeight / 1.5;

export function ChatEmpty() {
  return (
    <FadeInView style={styles.container}>
      <StyledText variant="bodylarge">Nothing here yet</StyledText>
      <StyledText style={styles.text}>Join a pool and it will show up here.</StyledText>
    </FadeInView>
  )
}

export function NotificationEmpty() {
  return (
    <FadeInView style={styles.container}>
      <StyledText variant="bodylarge">Nothing here yet</StyledText>
      <StyledText style={styles.text}>When you receive a notification, it will show up here.</StyledText>
    </FadeInView>
  )
}

export function BlocksEmpty() {
  return (
    <View style={styles.container}>
      <StyledText variant="bodylarge">You have not blocked any users.</StyledText>
      <StyledText style={styles.text}>Block a user using the menu on their profile and they will show up here.</StyledText>
    </View>
  )
}

export function ProfileContentEmpty() {
  return (
    <View style={[
      styles.container,
      {
        marginTop: -100,
      }
    ]}>
      <StyledText variant="bodylarge" style={styles.text}>This profile does not have any content.</StyledText>
    </View>
  )
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    height: componentHeight,
    paddingHorizontal: 15,
  }
})