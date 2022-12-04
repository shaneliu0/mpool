import * as React from 'react';
import { useState, useEffect } from 'react';

import { StyleSheet, Dimensions, Alert } from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import {
  Heading,
  Container,
  useTheme,
  Button
} from 'native-base';

import useColorScheme from '../../hooks/useColorScheme';

import SkeletonContent from 'react-native-skeleton-content';
import Toast from 'react-native-toast-message';

import { Text, View } from '../../components/Themed';
import { RootTabScreenProps, PoolDetails } from '../../types';

interface PositionedMapProps {
  pool: PoolDetails;
}

function PositionedMap(props: PositionedMapProps) {
  const { colors } = useTheme();
  const scheme = useColorScheme();

  const { pool } = props;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 42.2545488,
        longitude: -83.5171204,
        latitudeDelta: 0.0922 * 2.5,
        longitudeDelta: 0.0421 * 2.5
      }}
    >
      <Marker
        key="start"
        coordinate={pool.startCoords}
        title="Start"

      />
      <Marker
        key="end"
        coordinate={pool.endCoords}
        title="End"
      />
    </MapView>
  )
}

interface HandleJoinPoolButtonProps {
  poolId?: string;
}

function HandleJoinPoolButton(props: HandleJoinPoolButtonProps) {
  const [loading, setLoading] = useState(false);
  const [buttonInnerText, setButtonInnerText] = useState("Join Pool");
  const { poolId } = props;

  if (!poolId) {
    return <Button>Something went wrong. Couldn't determine pool id.</Button>
  }

  const confirmJoinPool = async () => {
    setLoading(true);
    setButtonInnerText("Joining...");
    Alert.alert(
      "Are you sure?",
      "Your name and uniqname will be shared with other pool members. We'll add you to a group chat with the other members.",
      [
        {
          text: "Cancel",
          onPress: () => {
            setButtonInnerText("Cancelled.")
            setLoading(false);
          },
          style: "cancel",
        },
        {
          text: "Join",
          onPress: handleJoinPool,
          style: "default",
        },
      ],
      {
        cancelable: true,
        onDismiss: () =>
          Alert.alert(
            "This alert was dismissed by tapping outside of the alert dialog."
          ),
      }
    );
  }

  const handleJoinPool = async () => {
    try {
      // wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      setButtonInnerText("Joined!");
      // const { data } = await axios.post(`/pools/:poolId/join`)
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong.'
      });
    }
    setLoading(false);
  }

  return (
    <View>
      <Button onPress={confirmJoinPool} isLoading={loading}>
        {buttonInnerText}
      </Button>
    </View>
  )
}

export default function PoolScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {
  const [pool, setPool] = useState<PoolDetails | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    (async () => {
      // wait for 0.5 seconds
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!route.params) throw new Error('No Pool ID supplied!');
      const { id } = route.params;

      setPool({
        id: "1",
        startPoint: 'Oxford Housing',
        endPoint: 'McNamara Terminal',
        startCoords: {
          latitude: 42.27444,
          longitude: -83.72558
        },
        endCoords: {
          latitude: 42.21241,
          longitude: -83.35458
        },
        time: 'Dec 19th at 8:00 AM',
        estimatedCost: "$50",
        availableSeats: 2,
        description: "Looking to go to airport for winter break.",
      })

      // const { data } = await axios.get(`/pools/${id}`);
      // setPool(data);

      setLoading(false);
    })();
  }, [])

  const { id, startPoint, endPoint, time, estimatedCost, availableSeats, description } = pool || {};

  const shouldBeLoading = !pool || loading;

  return (
    <View style={styles.container}>
      <Heading size="xl">Pool Details</Heading>
      <View>
        {shouldBeLoading ? (
          <SkeletonContent
            containerStyle={[styles.sideMargins, { height: styles.map.height }]}
            isLoading={true}
            layout={[
              { key: 'a', width: styles.map.width, height: styles.map.height },
            ]}
          />
        ) : (
          <PositionedMap
            pool={pool}
          />
        )}
      </View>
      <Container centerContent={false} width="100%">
        {shouldBeLoading ? (
          <SkeletonContent
            containerStyle={[styles.sideMargins]}
            isLoading={true}
            layout={[
              { key: 'a', width: '100%', height: 50 },
              { key: 'b', width: '100%', height: 50 },
            ]}
          />
        ) : (
          <>
            <View style={{ marginTop: 25 }}>
              <Text style={styles.poolDescriptText}>{startPoint} to {endPoint}</Text>
              <Text style={styles.poolDescriptText}>{time}</Text>
              <Text style={styles.poolDescriptText}>Pool ID: {id}</Text>
            </View>
            <View style={{ marginTop: 25 }}>
              <Text>Estimated Total Cost: ~{estimatedCost}</Text>
            </View>
          </>
        )}
        <View style={[styles.sideMargins, { marginTop: 25 }]}>
          <HandleJoinPoolButton poolId={id} />
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    direction: 'ltr',
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
  map: {
    width: Dimensions.get('window').width - 20,
    height: Dimensions.get('window').height / 5,
    borderRadius: 10,
  },
  poolDescriptText: {
    marginVertical: 5,
    fontSize: 16
  }
});
