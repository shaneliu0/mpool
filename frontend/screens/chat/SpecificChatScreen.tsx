import * as React from 'react';
import { useState, useEffect } from 'react';

import { ScrollView, StyleSheet, Button, TouchableOpacity, ActivityIndicator } from 'react-native';

import {
  Heading,
  HStack,
  useMediaQuery,
  useTheme,
  Skeleton,
  Select,
  CheckIcon,
  Box,
  Input,
  Row,
  Center
} from 'native-base';

import { View as ThemedView } from '../../components/Themed';
import useColorScheme from '../../hooks/useColorScheme';

import DateTimePicker from '@react-native-community/datetimepicker';
import SkeletonContent from 'react-native-skeleton-content';

import { Text, View } from '../../components/Themed';
import { RootTabScreenProps, PoolSearchQuery, Pool, AvailableChat } from '../../types';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';

import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

export default function Chats({ route, navigation }: RootTabScreenProps<'ChatRoot'>) {
  const [chats, setChats] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // wait for 0.5 seconds
      await new Promise(resolve => setTimeout(resolve, 500));

      setChats(new Array(6).fill(0).map((e, idx) => ({
        _id: idx,
        text: 'Hello developer',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'GiftedChat',
          avatar: 'https://placeimg.com/140/140/any',
        },
      })));

      setLoading(false);
    })();
  }, [])

  if (!route.params) return <Heading>Couldn't find the requested chat.</Heading>
  const { chatId } = route.params;

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" style={{ margin: 35 }} />}
      <GiftedChat
        messages={chats}
        onSend={messages => {
          setChats(previousMessages => GiftedChat.append(previousMessages, messages));
        }}
        user={{
          _id: 1,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  datePicker: {
    width: '30%',
  },
  verticalSpacing: {
    marginVertical: 15
  },
  horizontalSpacing: {
    marginHorizontal: 15
  },
  sideMargins: {
    marginLeft: 10,
    marginRight: 10
  },
  scheduleText: {
    margin: 5,
    marginLeft: 15,
    fontSize: 16,
    width: 200
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: '100%',
  },
});
