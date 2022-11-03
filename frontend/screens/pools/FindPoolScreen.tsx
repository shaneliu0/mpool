import * as React from 'react';
import { useState, useEffect } from 'react';

import { ScrollView, StyleSheet, Button, TouchableOpacity, Alert, Pressable } from 'react-native';

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
  IconButton
} from 'native-base';

import useColorScheme from '../../hooks/useColorScheme';

import SkeletonContent from 'react-native-skeleton-content';
import { GooglePlaceData, GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Toast from 'react-native-toast-message';

import { Text, View, } from '../../components/Themed';
import { RootTabScreenProps, PoolSearchQuery, Pool } from '../../types';
import axios from 'axios';

import { MaterialIcons } from '@expo/vector-icons';
import { selectUser } from '../../slices/authSlice';
import { useSelector } from 'react-redux';
import { authAsync } from 'expo-app-auth';

import { Modal } from 'react-native';

import { PlacesSelector, DateTimeSelector } from '../../components/Pickers';

import { GOOGLE_PLACES_API_KEY } from '../../config';
import { convertAbsoluteToRem } from 'native-base/lib/typescript/theme/tools';
import * as Logging from '../../Logging';

interface PlaceInputModalProps {
  onSelect: (place: GooglePlaceData, details: GooglePlaceDetail | null) => void;
  fieldText: string;
  fieldValue: string;
}
function PlaceInputModal(props: PlaceInputModalProps) {
  const { onSelect, fieldText, fieldValue } = props;
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [fieldDisabled, FieldDisabled] = useState(false);

  const onSelectProxy = (place: GooglePlaceData, details: GooglePlaceDetail | null) => {
    setModalVisible(false);
    onSelect(place, details);
  }

  return (
    <>
      <Input
        placeholder={fieldText}
        onPressOut={() => setModalVisible(true)}
        value={fieldValue}
        isDisabled={modalVisible}
      />
      <Modal
        animationType="slide"
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
        style={{
          margin: 50
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <HStack justifyContent="flex-start" style={styles.alignRight}>
              <IconButton
                onPress={() => setModalVisible(!modalVisible)}
              >
                <MaterialIcons name='close' size={24} color={colorScheme === 'light' ? '#000' : '#FFF'} />
              </IconButton>
              {true ? (
                <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600" }}>Start typing a location...</Heading>

              ) : (
                <Heading style={{ fontSize: 20, marginTop: -8, fontWeight: "600", color: 'black' }}>Start typing a location...</Heading>
              )}
            </HStack>
            <View style={[styles.placeSelector, { width: "90%" }]}>
              <PlacesSelector
                onSelect={onSelectProxy}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

interface PoolSearchProps {
  onSubmit: (query: PoolSearchQuery) => void;
}

function PoolSearch(props: PoolSearchProps) {
  const { onSubmit } = props;
  const [date, setDate] = useState(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw;
  });
  const [hasSelectedDate, setHasSelectedDate] = useState(false);
  const [location, setLocation] = useState<GooglePlaceData | null>(null);
  const [destination, setDestination] = useState<string | undefined>(undefined);
  const user = useSelector(selectUser);

  const onChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || date;
    setHasSelectedDate(true);
    setDate(currentDate);
  };

  const handleSubmit = () => {
    if (!hasSelectedDate) {
      return alert('Please select a date');
    }
    if (location === null) {
      return alert('Please select a location');
    }
    if (destination === undefined) {
      return alert('Please select a destination');
    }

    const query: PoolSearchQuery = {
      time: date.toString(),
      startPoint: location.place_id,
      endPoint: destination,
    }

    onSubmit(query);
  }

  return (
    <View style={styles.fullWidth}>
      <Heading size="xl">Hi {user?.displayName.split(' ')[0]}! Where do you need to go?</Heading>
      <Heading size="sm">Date</Heading>
      <View>
        <DateTimeSelector
          onSelect={onChange}
          value={date}
          minuteInterval={15}
        />
      </View>
      <Heading size="sm">Preferred Pick Up Location</Heading>
      <Box style={[styles.horizontalSpacing, styles.verticalSpacing, { marginTop: 5, marginBottom: 25 }]}>
        <PlaceInputModal
          onSelect={(place, details) => {
            setLocation(place);
          }}
          fieldText="Select Pick Up Location"
          fieldValue={location?.description || ''}
        />
      </Box>
      <Heading size="sm">DTW Terminal</Heading>
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
        // fill with dummy pools
        // setPools(new Array(5).fill(null).map((_, index) => ({
        //   id: `${index}`,
        //   name: `Pool ${index}`,
        //   description: `Pool ${index} description`,
        //   time: 'Sunday at 12:45 PM',
        //   startPoint: 'Oxford Housing',
        //   endPoint: 'McNamara Terminal',
        // })));
        let query = searchQuery;
        try {
          const { data } = await axios.get('/pool/search', {
            params: {
              time: query.time,
              startPlaceId: query.startPoint,
              endPlaceId: query.endPoint
            }
          });

          setPools(data.map((p: any) => ({
            id: p.pool_id,
            name: p.title,
            time: p.time.toLowerCase(),
            startPoint: p.start_place_name,
            endPoint: p.end_place_name,
          })));
        } catch (error) {
          Logging.Error(error);
        }

        setLoadingPools(false);
      })();
    }
  }, [loadingPools, searchQuery]);

  const onSubmit = async (query: PoolSearchQuery) => {
    setSearchQuery(query);
  }

  if (searchQuery === null) {
    return (
      <View style={styles.container}>
        <PoolSearch
          onSubmit={onSubmit}
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
              <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
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
              <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    marginTop: 100,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%"
  },
  placeSelector: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: "90%",
    height: "90%",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  },
  alignRight: {
    marginRight: "auto"
  },
  modalContainer: {
    flex: 1,
    //backgroundColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
