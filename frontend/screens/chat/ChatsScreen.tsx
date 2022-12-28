import * as React from 'react';
import { useState, useEffect } from 'react';

import { ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Animated } from 'react-native';

import {
  Avatar
} from 'native-base';


import { Text, View } from '../../components/Themed';
import StyledText from '../../components/StyledText';
import { RootTabScreenProps, AvailableChat } from '../../types';

import { Entypo } from '@expo/vector-icons';
import axios from 'axios';
import * as Logging from '../../Logging';
import { ChatEmpty } from '../../components/Empties';
import { Loading } from '../../components/Display';

interface ChatContainerProps {
  chat: AvailableChat;
  onPress: () => void;
  loading: boolean;
}

function ChatContainer(props: ChatContainerProps) {
  const { chat, onPress, loading, } = props;
  const { id, name, lastMessage, lastMessageTime, avatars } = chat;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true
    }).start()
  }

  useEffect(() => {
    if (!loading) {
      fadeIn();
    }
  }, [loading])

  const renderAvatars = () => {
    return avatars && avatars.map((data, idx) => {
      return <Avatar
        source={{
          uri: data
        }}
        key={data}
      />
    })
  }

  return (
    <TouchableOpacity onPress={onPress} style={{ marginLeft: 25, marginRight: "auto" }}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        marginRight: 15,
      }}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            width: "100%",
            flexDirection: 'row'
          }}
        >
          <View style={{ width: 100, marginRight: 20 }}>
            {(avatars && avatars.length) ? (
              <Avatar.Group size="lg" max={2}>
                {renderAvatars()}
              </Avatar.Group>
            ) : null}
          </View>
          <View style={[styles.nested, { marginRight: 0, marginLeft: 0 }]}>
            <Text style={[styles.normalText, styles.boldText]}>{name}</Text>
            <Text style={[styles.normalText, { marginTop: 5 }]}>{lastMessage}</Text>
            {lastMessageTime && <Text style={[styles.normalText, styles.lightText]}>{lastMessageTime}</Text>}
          </View>
          <Entypo name="chevron-right" size={24} color="black" />
        </Animated.View>
      </View>
    </TouchableOpacity>
  )
}

export default function Chats({ route, navigation }: RootTabScreenProps<'Chat'>) {
  const [chats, setChats] = useState<AvailableChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    onRefresh();
    setRefreshing(false);

    const willFocusSub = navigation.addListener('focus', () => {
      onRefresh(false);
    });

    return willFocusSub;
  }, []);

  const onRefresh = React.useCallback(async (shouldSetRefresh = true) => {
    shouldSetRefresh && setRefreshing(true);
    try {
      const { data } = await axios.get('/chat');
      setChats(data);
      setLoading(false);
    } catch (error) {
      Logging.Error(error);
    }
    shouldSetRefresh && setRefreshing(false);
  }, [])

  const renderChats = () => {
    if (loading) return null;
    const arr = (!loading) ? chats : [];

    if (!arr.length) {
      return (
        <ChatEmpty />
      )
    }

    return arr.map((chat, index) => {
      return <ChatContainer key={index} loading={loading} chat={chat} onPress={() => {
        navigation.navigate('Chat', {
          screen: 'SpecificChat',
          params: {
            chatId: chat.id
          }
        } as never)
      }} />
    })
  }

  if (loading) return <Loading defaultDelay shouldCenter />

  return (
    <View style={styles.containerNoCenter}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <StyledText variant='h1'>Pool Chats</StyledText>
        <View style={styles.chatsInnerView}>
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
  chatsInnerView: {
    paddingTop: 15,
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
