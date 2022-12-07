import React, { useEffect, useState } from 'react';
import { RootTabScreenProps } from '../../types';

import { Notification, getNotifications } from '../../dataAccess/notifications';
import { FlatList, TouchableOpacity, View } from 'react-native';

import * as Logging from '../../Logging';
import { Loading } from '../../components/Display';
import Text from '../../components/StyledText';
import { FadeInView } from '../../components/Animation';
import { AntDesign } from '@expo/vector-icons';
import moment from 'moment';

interface NotificationProps {
    navigation: RootTabScreenProps<'Pool'>['navigation'];
}

function PoolMatched(props: Notification & NotificationProps) {
    const { body, payload, title, type, createdAt, navigation } = props;

    const handlePress = () => {
        try {
            navigation.navigate('Pool', {
                screen: "PoolScreen",
                params: { poolId: payload.poolId }
            } as never)
        } catch (e) {
            Logging.Error(e);
        }
    };

    const timeText = moment(createdAt).fromNow();

    return (
        <TouchableOpacity
            style={{
                display: "flex",
                flexDirection: "row",
                padding: 15,
                alignItems: "center",
                marginLeft: 40,
            }}
            onPress={handlePress}
        >
            <AntDesign name="link" size={24} color="black" />
            <View style={{ marginLeft: 15, }}>
                <Text variant="bodylarge" style={{ marginTop: 5, fontWeight: '400', fontSize: 18 }}>{title}</Text>
                <Text variant="body" style={{ marginTop: 5, fontSize: 15 }}>{body} <Text style={{ fontWeight: '100' }}>{timeText}</Text></Text>
            </View>
            <AntDesign name="arrowright" size={24} color="black" style={{
                margin: 20,
            }} />
        </TouchableOpacity>
    )
}

function NotificationsScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (loading) {
            (async () => {
                try {
                    const data = await getNotifications();
                    setNotifications(data);
                    setLoading(false);
                } catch (e) {
                    Logging.Error(e);
                }
            })();
        }
    }, [])

    const renderNotification = (n: Notification) => {
        switch (n.type) {
            case 'poolmatched':
                return <PoolMatched key={n.notificationId} navigation={navigation} {...n} />
            default:
                return null;
        }
    }

    if (loading) return <Loading shouldCenter defaultDelay />

    return (
        <FadeInView>
            <FlatList
                data={notifications}
                renderItem={({ item }) => {
                    return renderNotification(item);
                }}
                style={{ height: "100%" }}
            />
        </FadeInView>
    );
}

export default NotificationsScreen;