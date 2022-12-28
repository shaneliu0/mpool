import * as React from 'react';
import { useState, useEffect } from 'react';

import { StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

import {
  Heading
} from 'native-base';


import { getDatabase, ref, onValue } from "firebase/database";

import { View } from '../../components/Themed';
import { RootTabScreenProps } from '../../types';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import {
  selectUser
} from '../../slices/authSlice';
import * as Logging from '../../Logging';

import axios from 'axios';
import { PageSheetModal } from '../../components/Modal';
import Text from '../../components/StyledText';
import { AntDesign } from '@expo/vector-icons';
import { PoolView } from '../pools/PoolScreen';
import { markPoolAsRead } from '../../dataAccess/chats';
import { getPoolStatus } from '../../dataAccess/poolData';
import { MatchedPoolView } from '../pools/MatchedPoolScreen';

const db = getDatabase();

interface PoolPeekProps {
  navigation: RootTabScreenProps<'Chat'>['navigation'];
  poolId: number;
}
function PoolPeek(props: PoolPeekProps) {
  const { navigation, poolId } = props;
  const [open, setOpen] = useState(false);
  const [matchId, setMatchId] = useState<number | null>(null);

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  useEffect(() => {
    (async () => {
      try {
        const pstatus = await getPoolStatus(poolId);
        if (pstatus.matchId) setMatchId(pstatus.matchId);
      } catch (error) {
        Logging.Error(error);
      }
    })();
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleOpen}>
          <AntDesign name="infocirlceo" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <>
      <PageSheetModal
        open={open}
        onClose={handleClose}
        title='Current Pool'
      >
        {matchId ? (
          <MatchedPoolView
            navigation={navigation}
            matchId={matchId}
            poolId={undefined}
            embedMode
            onCloseModal={handleClose}
          />
        ) : (
          <PoolView
            navigation={navigation}
            poolId={poolId}
            embedMode
            onCloseModal={handleClose}
          />
        )}
      </PageSheetModal>
    </>
  );
}

export default function Chats({ route, navigation }: RootTabScreenProps<'Chat'>) {
  const [chats, setChats] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(true);
  const user = useSelector(selectUser);

  let mUnsub: () => void;
  useEffect(() => {
    mUnsub && mUnsub();
    if (loading) {
      (async () => {
        try {
          const { data } = await axios.get(`/chat/${chatId}`);
          setChats(data);
          setLoading(false);
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Something went wrong.'
          })
        }
      })();
    } else {
      const chatListenRef = ref(db, `${user.uid}/message/${chatId}`);
      mUnsub = onValue(chatListenRef, snap => {
        const data = snap.val();
        if (!data) return;
        markPoolAsRead(chatId);
        setChats((previousMessages: IMessage[]) => {
          if (previousMessages.find(m => m._id === data._id)) {
            return previousMessages;
          }
          if (previousMessages.some(m => m.pending)) {
            const pending = previousMessages.find(m => m.pending);
            if (!pending || pending.text != data.text) return GiftedChat.append(previousMessages, [data]);
            pending.sent = true;
            return previousMessages;
          }
          return GiftedChat.append(previousMessages, [data]);
        });
      });
    }

    return () => {
      mUnsub && mUnsub();
    }
  }, [loading]);

  const handleMessageSend = async (messages: IMessage[]) => {
    messages.forEach(m => m.pending = true);
    const previousMessages = chats.slice();
    setChats(previousMessages => GiftedChat.append(previousMessages, messages));
    try {
      let mResp = await (await Promise.all(messages.map(m => {
        return axios.post(`/chat/${chatId}`, {
          text: m.text
        });
      }))).map(r => r.data);
      mResp = mResp.filter(m => !previousMessages.find(p => p._id === m._id));
      mResp.forEach(m => m.pending = false);
      mResp.forEach(m => m.sent = true);
      setChats(GiftedChat.append(previousMessages, mResp));
    } catch (error) {
      Logging.Error(error, {
        text1: 'Couldn\'t send message.'
      })
    }
  }

  const handleLoadEarlier = async () => {
    setLoadingEarlier(true);
    try {
      // retrieve more messages, with an offset equal to messages.length
      const { data } = await axios.get(`/chat/${chatId}?offset=${chats.length}`);
      if (data && data.length === 0) return setHasEarlier(false);
      setChats(GiftedChat.prepend(chats, data));
    } catch (error) {
      Logging.Error(error, {
        text1: 'Something went wrong. Couldn\'t load more messages.',
      });
    }
    setLoadingEarlier(false);
  }

  if (!route.params) return <Heading>Couldn't find the requested chat.</Heading>
  const { chatId } = route.params;

  return (
    <>
      <PoolPeek navigation={navigation} poolId={chatId} />
      <View style={styles.container}>
        {loading && <ActivityIndicator size="large" style={{ margin: 35 }} />}
        <GiftedChat
          messages={chats}
          onSend={handleMessageSend}
          user={{
            _id: user?.uid,
          }}
          loadEarlier={hasEarlier && !loading}
          onLoadEarlier={handleLoadEarlier}
          isLoadingEarlier={loadingEarlier}
          infiniteScroll={true}
          renderUsernameOnMessage={true}
        />
      </View>
    </>
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
