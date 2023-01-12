import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { FadeInView } from '../../components/Animation';
import Text from '../../components/StyledText';
import { BlockedUser, getBlockedUsers, unblockUser } from '../../dataAccess/safety';
import { RootTabScreenProps } from '../../types';
import * as Logging from '../../Logging';
import { Loading } from '../../components/Display';
import { Avatar } from 'native-base';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import compatiblePrompt from '../../components/PromptProvider';
import Toast from 'react-native-toast-message';
import { BlocksEmpty } from '../../components/Empties';

export default function BlocksScreen() {
    const [blocks, setBlocks] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleDelete = (blockId: number) => () => {
        compatiblePrompt(
            "Unblock User?",
            "This will unblock the user and allow them to contact or match with you again.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Unblock",
                    onPress: async () => {
                        try {
                            await unblockUser({ blockId });
                            Toast.show({
                                type: "success",
                                text1: "User Unblocked."
                            });
                            onRefreshFactory(false)();
                        } catch (error) {
                            Logging.Error(error);
                        }
                    }
                }
            ],
            {
                type: "default"
            }
        );
    }

    const onRefreshFactory = (shouldSetRefresh: boolean) => async () => {
        shouldSetRefresh && setRefreshing(true);
        try {
            const resp = await getBlockedUsers();
            setBlocks(resp);
            setLoading(false);
        } catch (error) {
            Logging.Error(error);
        } finally {
            shouldSetRefresh && setRefreshing(false);
        }
    }

    useEffect(() => {
        if (loading) {
            onRefreshFactory(false)();
        }
    }, []);

    if (loading) return <Loading shouldCenter defaultDelay />

    return (
        <FadeInView>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefreshFactory(true)}
                    />
                }
                style={{ height: "100%" }}
            >
                <Text variant="h1">Blocked Users</Text>
                {(() => {
                    if (blocks.length === 0) {
                        return (
                            <BlocksEmpty />
                        )
                    }

                    return blocks.map((block) => {
                        return (
                            <TouchableOpacity
                                key={block.blockId}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: 15,
                                }}
                                onPress={handleDelete(block.blockId)}
                            >
                                <View style={{
                                    margin: 15,
                                }}>
                                    <Avatar
                                        source={{
                                            uri: block.photoURL,
                                        }}
                                        size="lg"
                                    />
                                </View>
                                <View style={{
                                    flex: 1,
                                    flexDirection: "column"
                                }}>
                                    <Text variant="h2">{block.displayName}</Text>
                                    <Text variant="body">Blocked {moment(block.blockedAt).fromNow()}</Text>
                                </View>
                                {/* trashcan icon */}
                                <View>
                                    <Ionicons name="trash" size={24} color="black" />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                })()}
            </ScrollView>
        </FadeInView>
    );
}