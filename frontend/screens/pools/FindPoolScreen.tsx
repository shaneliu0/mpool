import * as React from 'react';
import { useState, useEffect } from 'react';

import { ScrollView, StyleSheet, Button, TouchableOpacity } from 'react-native';

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
import { RootTabScreenProps, PoolSearchQuery, Pool } from '../../types';

import { MaterialIcons } from '@expo/vector-icons';
import { selectUser } from '../../slices/authSlice';
import { useSelector } from 'react-redux';
import { authAsync } from 'expo-app-auth';

interface PoolSearchProps {
  onSubmit: (query: PoolSearchQuery) => void;
}

function PoolSearch(props: PoolSearchProps) {
  const [date, setDate] = useState(new Date());
  const [hasSelectedDate, setHasSelectedDate] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | undefined>(undefined);
  const user = useSelector(selectUser);

  const onChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || date;
    setHasSelectedDate(true);
    setDate(currentDate);
  };

  const handleSubmit = () => {
    return props.onSubmit({
      time: '2020-04-01T00:00:00.000Z',
      startPoint: 'mcnamara',
      endPoint: 'north',
    });

    if (!hasSelectedDate) {
      return alert('Please select a date');
    }
    if (location === null) {
      return alert('Please select a location');
    }
    if (destination === undefined) {
      return alert('Please select a destination');
    }

    // const query: PoolSearchQuery = {
    //   time: date.toString(),
    //   startPoint: location,
    //   endPoint: destination,
    // }

    // props.onSubmit(query);
  }

  return (
    <View style={styles.fullWidth}>
      <Heading size="xl">Hi {user?.displayName.split(' ')[0]}! Where do you need to go?</Heading>
      <Heading size="sm">Date</Heading>
      <View>
        <HStack space={3} alignItems="center">
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={'date'}
            is24Hour={true}
            display="default"
            onChange={onChange}
            style={styles.datePicker}
          />
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={'time'}
            is24Hour={true}
            display="default"
            onChange={onChange}
            style={styles.datePicker}
          />
        </HStack>
      </View>
      <Heading size="sm">Preferred Pick Up Location</Heading>
      <Box style={[styles.horizontalSpacing, styles.verticalSpacing, { marginTop: 5 }]}>
        <Input onChange={(e) => setLocation(e.nativeEvent.text)} placeholder="Location" />
      </Box>
      <Heading size="sm">Destination</Heading>
      <Box style={[styles.horizontalSpacing, styles.verticalSpacing, { marginTop: 5 }]}>
        <Select
          selectedValue={destination}
          accessibilityLabel="Select Option"
          placeholder="Select Option"
          onValueChange={(itemValue) => setDestination(itemValue)}
          _selectedItem={{
            bg: "cyan.600",
            endIcon: <CheckIcon size={4} />,
          }}
        >
          <Select.Item label="McNamara Terminal (AirFrance/Delta)" value="mcnamara" />
          <Select.Item label="North Terminal (all other airlines)" value="north" />
        </Select>
      </Box>
      <Button title="Search" onPress={handleSubmit} />
    </View>
  );
}

// export interface Pool {
//   id: string;
//   name: string;
//   description: string;
//   time: string;
//   startPoint: string;
//   endPoint: string;
// }

interface PossiblePoolProps {
  isLoading: boolean;
  pool?: Pool;
  childKey: number;
  navigation: any;
}

function PossiblePool(props: PossiblePoolProps) {
  const { isLoading, pool, childKey, navigation } = props;

  if (!pool && !isLoading) {
    return <Heading>Something went wrong. Couldn't display pool @{childKey}.</Heading>;
  }

  return (
    <PoolDisplayBar
      pool={pool}
      key={childKey}
      action={() => {
        navigation.navigate('PoolRoot', {
          screen: 'PoolScreen',
          params: {
            poolId: pool?.id,
          }
        })
      }}
      loaded={!isLoading}
    />
  )
}

interface ViewPoolsProps {
  pools: any[];
  loadingPools: boolean;
  navigation: any
}

function ViewPools(props: ViewPoolsProps) {
  // destructure the props
  const { pools, loadingPools, navigation } = props;

  const renderPools = () => {
    return pools.map((pool: Pool, idx) => {
      return (
        <PossiblePool
          isLoading={loadingPools}
          pool={pool}
          key={pool.id}
          childKey={idx}
          navigation={navigation}
        />
      );
    });
  }

  return (
    <>
      <ScrollView style={styles.fullWidth}>
        <Heading size="xl">Viewing Pools</Heading>
        {loadingPools ? (
          new Array(5).fill(null).map((_, index) => (
            <PossiblePool
              isLoading={loadingPools}
              key={index}
              childKey={index}
              navigation={navigation}
            />
          ))
        ) : (
          renderPools()
        )}
      </ScrollView>
    </>
  )
}

export default function FindPoolScreen({ navigation }: RootTabScreenProps<'PoolRoot'>) {
  const [searchQuery, setSearchQuery] = useState<PoolSearchQuery | null>(null);
  const [loadingPools, setLoadingPools] = useState(true);
  const [pools, setPools] = useState<any[]>([]);

  useEffect(() => {
    if (loadingPools && searchQuery) {
      (async () => {
        // wait for 0.5 seconds
        await new Promise((resolve) => setTimeout(resolve, 500));
        // fill with dummy pools
        setPools(new Array(5).fill(null).map((_, index) => ({
          id: `${index}`,
          name: `Pool ${index}`,
          description: `Pool ${index} description`,
          time: 'Sunday at 12:45 PM',
          startPoint: 'Oxford Housing',
          endPoint: 'McNamara Terminal',
        })));
        // const { data } = await axios.get('/pools/search', { params: searchQuery });

        setLoadingPools(false);
      })();
    }
  }, [loadingPools, searchQuery]);

  if (searchQuery === null) {
    return (
      <View style={styles.container}>
        <PoolSearch
          onSubmit={setSearchQuery}
        />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <ViewPools
          pools={pools}
          loadingPools={loadingPools}
          navigation={navigation}
        />
      </View>
    );
  }
}

function PoolDisplayBar(props: { key: number, pool?: Pool, action: () => void, loaded: boolean }) {
  const theme = useTheme();
  const [isSmallScreen] = useMediaQuery({ maxWidth: theme.breakpoints.md });
  const isDarkTheme = useColorScheme() === "dark";

  const { pool, action, loaded } = props;
  if (!pool && loaded) return <Heading>Something went wrong @pool</Heading>;

  const text1 = pool?.startPoint && `Depart ${pool?.startPoint}`;
  const text2 = pool?.endPoint && `Arrive ${pool?.endPoint}`;
  const text3 = pool?.time && `Leave ${pool?.time}`;

  if (isSmallScreen) {
    if (pool && loaded) {
      return (
        <>
          <TouchableOpacity onPress={action}>
            <View
              style={styles.sideMargins}
            >
              <ThemedView style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
              <Row alignItems="center">
                <Box>
                  <Text style={styles.scheduleText}>{text1}</Text>
                  <Text style={styles.scheduleText}>{text2}</Text>
                  <Text style={styles.scheduleText}>{text3}</Text>
                </Box>
                <Box marginRight={15} marginLeft={"auto"}>
                  <MaterialIcons name="keyboard-arrow-right" size={24} color={isDarkTheme ? "#ffffff" : "#000000"} />
                </Box>
              </Row>
              <ThemedView style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            </View>
          </TouchableOpacity>
        </>
      );
    } else {
      return (
        // <Skeleton mx={10} my={2} height={20} style={styles.sideMargins} />
        <View style={{ marginTop: 20 }}>
          <SkeletonContent
            containerStyle={[styles.sideMargins, { height: 110 }]}
            isLoading={true}
            layout={[
              { key: 'a', width: '100%', height: 100 },
            ]}
          />
        </View>
      )
    }
  } else {
    if (loaded && pool) {
      return (
        <TouchableOpacity onPress={action}>
          <Box
            borderWidth={1}
            borderColor={isDarkTheme ? "#ffffff" : "#000000"}
            borderRadius={15}
            height={60}
            style={styles.sideMargins}
          >
            <Row>
              <Center height={60}>
                <Text style={styles.scheduleText}>
                  {text1}
                </Text>
              </Center>
              <Center height={60}>
                <Text style={styles.scheduleText}>
                  {text2}
                </Text>
              </Center>
              <Center height={60}>
                <Text style={styles.scheduleText}>
                  {text3}
                </Text>
              </Center>
              <Center height={60} marginRight={15} marginLeft={"auto"}>
                <MaterialIcons name="keyboard-arrow-right" size={24} color={isDarkTheme ? "#ffffff" : "#000000"} />
              </Center>
            </Row>
          </Box>
        </TouchableOpacity>
      )
    } else {
      return (
        <Skeleton mx={10} my={2} height={60} style={styles.sideMargins} />
      )
    }
  }
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
});
