import * as React from 'react';
import { useState, useEffect } from 'react';

import { StyleSheet, ActivityIndicator, TouchableOpacity, Clipboard, Alert } from 'react-native';
import {
  Heading
} from 'native-base';

import prompt from '../../components/PromptProvider';
import { getDatabase, ref, onValue } from "firebase/database";

import { View } from '../../components/Themed';
import { RootTabScreenProps } from '../../types';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
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
import { getPoolStatus, leavePool } from '../../dataAccess/poolData';
import { MatchedPoolView } from '../pools/MatchedPoolScreen';
import { blockUser, postReport } from '../../dataAccess/safety';

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

  const handleReportMessage = async (message: IMessage) => {
    try {
      prompt(
        'Report message',
        'Enter a reason for reporting this message.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report', onPress: reason => postReport({ reason, messageId: typeof message._id === 'string' ? parseInt(message._id) : message._id }).then(() => {
              Toast.show({
                type: 'success',
                text1: 'Message reported!'
              })
            }).catch(e => {
              Logging.Error(e, { text1: "Error: couldn't report message." });
            })
          },
        ],
        {
          type: 'plain-text'
        }
      );
    } catch (error) {
      Logging.Error(error);
    }
  }

  const executeBlock = async (userId: string | number) => {
    try {
      const parsedUserId: string = typeof userId === 'string' ? userId : userId.toString();
      const resp = await blockUser({ userId: parsedUserId });
      if (resp.msg) {
        return prompt(
          resp.msg,
        );
      }
      Toast.show({
        type: "success",
        text1: "User blocked.",
      });
      prompt(
        'User blocked.',
        'Would you also like to leave this pool?',
        [
          {
            text: "No",
          },
          {
            text: "Yes",
            style: "destructive",
            onPress: () => {
              const handleLeavePool = () => {
                prompt(
                  'Leave Pool',
                  'Are you sure? You can\'t join back.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Leave',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await leavePool(chatId);
                          navigation.navigate('Chat', {
                            screen: "Chats"
                          } as never);
                          setTimeout(() => {
                            navigation.navigate('Pool', {
                              screen: "Home"
                            } as never);
                            Toast.show({
                              text1: 'Pool left.',
                              type: 'success'
                            })
                          }, 1000);
                        } catch (error) {
                          Logging.Error(error);
                        }
                      }
                    }
                  ]
                )
              };
              handleLeavePool();
            }
          }
        ]
      )
    } catch (error) {
      Logging.Error(error, { text1: "Error: couldn't block user.", });
    }
  }

  const handleBlockMessageUser = async (message: IMessage) => {
    try {
      prompt(
        "Block this user?",
        "Blocking a user will prevent them from contacting or matching with you.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            onPress: () => executeBlock(message.user._id),
            style: "destructive"
          }
        ],
        {
          type: "default"
        }
      );
    } catch (error) {
      Logging.Error(error);
    }
  }

  const handleMsgLongPress = (context: any, message: IMessage) => {
    const options = [
      'Copy Text',
      'Report Message',
      'Block User',
      'Cancel',
    ];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = 2;
    context.actionSheet().showActionSheetWithOptions({
      options,
      cancelButtonIndex,
      destructiveButtonIndex,
    },
      (buttonIndex: number) => {
        switch (buttonIndex) {
          case 0:
            Clipboard.setString(message.text);
            break;
          case 1:
            handleReportMessage(message);
            break;
          case 2:
            handleBlockMessageUser(message);
        }
      });
  }

  const handleAvatarPress = (user: User) => {
    const parsedUserId = String(user._id);
    navigation.navigate('Chat', {
      screen: "ProfileView",
      params: { userId: parsedUserId },
    } as never);
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
          onLongPress={handleMsgLongPress}
          onPressAvatar={handleAvatarPress}
          wrapInSafeArea={false}
          bottomOffset={0}
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
