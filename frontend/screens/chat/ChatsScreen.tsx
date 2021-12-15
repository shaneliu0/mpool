import * as React from 'react';
import { useState, useEffect } from 'react';

import { ScrollView, StyleSheet, Button, TouchableOpacity, Image } from 'react-native';

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
  Center,
  Container
} from 'native-base';

import { View as ThemedView } from '../../components/Themed';
import useColorScheme from '../../hooks/useColorScheme';

import DateTimePicker from '@react-native-community/datetimepicker';
import SkeletonContent from 'react-native-skeleton-content';

import { Text, View } from '../../components/Themed';
import { RootTabScreenProps, PoolSearchQuery, Pool, AvailableChat } from '../../types';

import { MaterialIcons, Entypo } from '@expo/vector-icons';

interface ChatContainerProps {
  chat: AvailableChat;
  onPress: () => void;
  loading: boolean;
}

function ChatContainer(props: ChatContainerProps) {
  const { chat, onPress, loading } = props;
  const { id, name, lastMessage, lastMessageTime, profilePicture } = chat;

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
      }}>
        <SkeletonContent
          containerStyle={{
            width: 300,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 20,
          }}
          layout={[
            {
              width: 60,
              height: 60,
              borderRadius: 30,
            },
            {
              flexDirection: 'column',
              marginRight: 10,
              children: [
                {
                  width: '100%',
                  height: '50%',
                  marginBottom: 10,
                },
                {
                  width: '50%',
                  height: '20%',
                  marginBottom: 10,
                },
                {
                  width: 100,
                  height: 20,
                },
              ],
            },
          ]}
          isLoading={loading}
        >
          <Image
            source={{ uri: profilePicture }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30
            }}
          />
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: profilePicture }}
              style={styles.image}
            />
          </View>
          <View style={styles.nested}>
            <Text style={[styles.normalText, styles.boldText]}>{name}</Text>
            <Text style={[styles.normalText, { marginTop: 5 }]}>{lastMessage}</Text>
            <Text style={[styles.normalText, styles.lightText]}>{lastMessageTime}</Text>
          </View>
          <Entypo name="chevron-right" size={24} color="black" />
        </SkeletonContent>
      </View>
    </TouchableOpacity>
  )
}

export default function Chats({ route, navigation }: RootTabScreenProps<'ChatRoot'>) {
  const [chats, setChats] = useState<AvailableChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // wait for 0.5 seconds
      await new Promise(resolve => setTimeout(resolve, 500));

      setChats(new Array(6).fill(0).map((data, index) => ({
        id: `${index}`,
        name: "Tony Stark",
        lastMessage: "Hey, how are you?",
        lastMessageTime: "1 hour ago",
        profilePicture: `https://i.pravatar.cc/300?img=${index}`,
      })));

      setLoading(false);
    })();
  }, []);

  const renderChats = () => {
    const arr = chats.length > 0 ? chats : new Array(6).fill({});

    return arr.map((chat, index) => {
      return <ChatContainer key={index} loading={loading} chat={chat} onPress={() => {
        // @ts-ignore
        navigation.navigate('ChatRoot', {
          screen: 'SpecificChat',
          params: {
            chatId: chat.id
          }
        })
      }} />
    })
  }

  return (
    <View style={styles.containerNoCenter}>
      <ScrollView style={styles.chats}>
        <Heading size="xl">Chats</Heading>
        <View>
          {renderChats()}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    direction: 'ltr',
  },
  top: {
    width: 300,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  containerNoCenter: {
    flex: 1,
    direction: 'ltr',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
  chat: {
    height: 100
  },
  chats: {

  },
  nested: {
    flexDirection: 'column',
    marginRight: 20,
  },
  normalText: {
    fontSize: 18,
  },
  boldText: {
    fontWeight: 'bold',
  },
  lightText: {
    color: '#aaa',
  },
  image: {
    resizeMode: 'contain',
    height: 36,
  },
});
