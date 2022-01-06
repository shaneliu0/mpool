import * as React from 'react';
import { useState, useEffect } from 'react';

import { ScrollView, StyleSheet, TouchableOpacity, Image, RefreshControl } from 'react-native';

import {
  Heading,
  Avatar
} from 'native-base';


import SkeletonContent from 'react-native-skeleton-content';
import Toast from 'react-native-toast-message';

import { Text, View } from '../../components/Themed';
import { RootTabScreenProps, AvailableChat } from '../../types';

import { Entypo } from '@expo/vector-icons';
import axios from 'axios';

interface ChatContainerProps {
  chat: AvailableChat;
  onPress: () => void;
  loading: boolean;
}

function ChatContainer(props: ChatContainerProps) {
  const { chat, onPress, loading } = props;
  const { id, name, lastMessage, lastMessageTime, avatars } = chat;

  const profilePicture = avatars && avatars[0];

  const renderAvatars = () => {
    return avatars && avatars.map((data, idx) => {
      return <Avatar
        source={{
          uri: data
        }}
      />
    })
  }

  return (
    <TouchableOpacity onPress={onPress} style={{ marginLeft: 0, marginRight: "auto" }}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        marginRight: 15,
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
          <View style={{ width: 175, marginRight: 20 }}>
            <Avatar.Group size="lg" max={2}>
              {renderAvatars()}
            </Avatar.Group>
          </View>
          <View style={[styles.nested, { marginRight: 0, marginLeft: 0 }]}>
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    onRefresh();
    setRefreshing(false);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await axios.get('/chat');
      setChats(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong.'
      });
    }
    setRefreshing(false);
  }, [])

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
      <ScrollView
        style={styles.chats}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
