import { Avatar, Input } from 'native-base';
import React, { useState, useEffect, useContext } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { FadeInView } from '../components/Animation';
import StyledButton from '../components/Button';
import { Loading } from '../components/Display';

import EditScreenInfo from '../components/EditScreenInfo';
import { PageSheetModal } from '../components/Modal';
import { View } from '../components/Themed';
import { defaultProfile, getOwnProfile, Profile, ProfileContentBlock } from '../dataAccess/users';
import { ProfileDisplay } from './pools/ProfileViewScreen';
import Text from '../components/StyledText';
import { ThemeContext } from '../App';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Button from '../components/Button';
import { useRef } from 'react';
import { Chip, ChipContainer } from '../components/Chip';
import { Ionicons } from '@expo/vector-icons';

function capitalizeFirstLetter(str: string) {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface EditableKeyProps {
  open: boolean;
  profileKey: keyof Profile;
  content: string;
  handleOpen: () => void;
  handleClose: () => void;
  handleEdit: (k: keyof Profile, newContent: string) => void;
}
function EditableKey(props: EditableKeyProps) {
  const {
    open,
    profileKey,
    content,
    handleOpen,
    handleClose,
    handleEdit,
  } = props;
  const [value, setValue] = useState(content);
  const [realOpen, setRealOpen] = useState(false);

  const handleChange = (t: string) => setValue(t);
  const createEdit = () => {
    handleEdit(profileKey, value);
    initiateClose();
  }
  const initiateClose = () => {
    handleClose();
  }

  const translateOffsets = useSharedValue(200);
  const opacities = useSharedValue(0);

  const SPRING_OPTIONS: Animated.WithSpringConfig = {
    damping: 20,
    stiffness: 90,
  };

  const animatedHeaderViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(-(translateOffsets.value), SPRING_OPTIONS) }],
      opacity: withSpring(opacities.value, SPRING_OPTIONS),
    }
  });
  const animatedButtonsViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(translateOffsets.value, SPRING_OPTIONS) }],
      opacity: withSpring(opacities.value, SPRING_OPTIONS),
    }
  });
  const animatedTextFieldViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(-(translateOffsets.value), SPRING_OPTIONS) }],
      opacity: withSpring(opacities.value, SPRING_OPTIONS),
    }
  });

  useEffect(() => {
    const DURATION = 200;
    const BLUR_DURATION = DURATION * 3;
    const timingOptions = { duration: DURATION };
    if (open) {
      setRealOpen(true);
      setValue(content);
      translateOffsets.value = withTiming(0, timingOptions);
      opacities.value = withTiming(1, timingOptions);
    } else {
      translateOffsets.value = withTiming(200, timingOptions);
      opacities.value = withTiming(0, timingOptions);
      setTimeout(() => {
        setRealOpen(false);
      }, BLUR_DURATION);
    }
  }, [open])

  const dname = capitalizeFirstLetter(profileKey);

  return (
    <>
      <View style={{
        width: "100%",
        padding: 25,
        paddingTop: 0,
      }}>
        <TouchableOpacity style={styles.profileItem} onPress={handleOpen}>
          <Text variant="body" style={styles.profileItemName}>{dname}</Text>
          <Text variant="body" style={styles.profileItemValue} numberOfLines={1} ellipsizeMode="tail">{content}</Text>
        </TouchableOpacity>
      </View>
      {realOpen && (
        <BlurView intensity={open ? 95 : 0} style={[StyleSheet.absoluteFill, styles.contentEditBlur]}>
          <View style={styles.transparent}>
            <Animated.View style={animatedHeaderViewStyle}>
              <Text variant="h1">{dname}</Text>
            </Animated.View>
            <Animated.View style={[animatedTextFieldViewStyle, styles.transparent, { padding: 15 }]}>
              <Input multiline autoFocus value={value} onChangeText={handleChange} variant="underlined" placeholder={`New ${dname}`} />
            </Animated.View>
            <Animated.View style={[animatedButtonsViewStyle, styles.editCancel]}>
              <Button style={styles.editCancelItem} color='secondary' variant='outlined' onPress={initiateClose}>Cancel</Button>
              <Button style={styles.editCancelItem} color='secondary' onPress={createEdit}>Edit</Button>
            </Animated.View>
          </View>
        </BlurView>
      )}
    </>
  )
}

/* 
1. allow the user to add/remove content blocks as needed.
2. inside a content block, fetch possible options from the server and then display them.
    some options might only allow tiles, some only text, some both.
    an option might only allow the user to select from a set of predetermined tile options.
    these options need IDs
3. If both are allowed, allow the user to choose to use either or both.
*/

interface EditableContentProps {
  open: boolean;
  content: ProfileContentBlock;
  contentIdx: number;
  handleOpen: () => void;
  handleClose: () => void;
  handleEdit: (idx: number, newContent: ProfileContentBlock) => void;
  handleDeleteBlock: () => void;
}
function EditableContent(props: EditableContentProps) {
  const {
    open,
    content,
    contentIdx,
    handleOpen,
    handleClose,
    handleEdit,
    handleDeleteBlock
  } = props;
  const [value, setValue] = useState<ProfileContentBlock>(content);
  const [realOpen, setRealOpen] = useState(false);
  const DURATION = 200;
  const BLUR_DURATION = DURATION * 3;

  const createEdit = () => {
    handleEdit(contentIdx, value);
    initiateClose();
  }
  const initiateClose = () => {
    handleClose();
    setTimeout(() => {
      setValue(content);
    }, 1000)
  }
  const handleTextChange = (t: string) => {
    setValue({
      ...value,
      text: t,
    })
  }
  const handleTileRemove = (tidx: number) => {
    Alert.alert(
      'Remove tile',
      'Are you sure you want to remove this tile?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: () => {
            setValue({
              ...value,
              tiles: value.tiles && value.tiles.filter((_, idx) => idx !== tidx)
            })
          },
        },
      ],
      {
        cancelable: true,
      }
    );
  }
  const handleTileAdd = () => {
    Alert.prompt(
      "Add an item",
      undefined,
      (t: string) => {
        setValue({
          ...value,
          tiles: [...(tiles || []), t]
        })
      }
    )
  }
  const handleBlockDelete = () => {
    Alert.alert(
      'Remove block',
      'Are you sure you want to remove this entire block?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: () => {
            handleClose();
            setTimeout(() => {
              handleDeleteBlock();
            }, BLUR_DURATION);
          },
        },
      ],
      {
        cancelable: true,
      }
    );
  }

  const translateOffsets = useSharedValue(200);
  const opacities = useSharedValue(0);

  const SPRING_OPTIONS: Animated.WithSpringConfig = {
    damping: 20,
    stiffness: 90,
  };

  const animatedHeaderViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(-(translateOffsets.value), SPRING_OPTIONS) }],
      opacity: withSpring(opacities.value, SPRING_OPTIONS),
    }
  });
  const animatedButtonsViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(translateOffsets.value, SPRING_OPTIONS) }],
      opacity: withSpring(opacities.value, SPRING_OPTIONS),
    }
  });
  const animatedTextFieldViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(-(translateOffsets.value), SPRING_OPTIONS) }],
      opacity: withSpring(opacities.value, SPRING_OPTIONS),
    }
  });

  useEffect(() => {
    const timingOptions = { duration: DURATION };
    if (open) {
      setRealOpen(true);
      setValue(content);
      translateOffsets.value = withTiming(0, timingOptions);
      opacities.value = withTiming(1, timingOptions);
    } else {
      translateOffsets.value = withTiming(200, timingOptions);
      opacities.value = withTiming(0, timingOptions);
      setTimeout(() => {
        setRealOpen(false);
      }, BLUR_DURATION);
    }
  }, [open])

  const {
    heading,
    text,
    tiles,
  } = value;

  const {
    text: ctext,
    tiles: ctiles
  } = content;

  return (
    <>
      <View style={{
        width: "100%",
        padding: 25,
        paddingTop: 0,
      }}>
        <TouchableOpacity style={styles.profileItem} onPress={handleOpen}>
          <Text variant="body" style={styles.profileItemName}>{heading}</Text>
          <View>
            {(() => {
              if (ctext) {
                return <Text variant="body" style={styles.profileItemValue} numberOfLines={1} ellipsizeMode="tail">{ctext}</Text>
              }
              return null;
            })()}
            {ctiles && (
              <View style={styles.profileItemValue}>
                <ChipContainer hideOverflow>
                  {ctiles.map((t, idx) => {
                    return <Chip key={idx} content={t} />;
                  })}
                </ChipContainer>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      {realOpen && (
        <BlurView intensity={open ? 95 : 0} style={[StyleSheet.absoluteFill, styles.contentEditBlur]}>
          <View style={styles.transparent}>
            <Animated.View style={animatedHeaderViewStyle}>
              <Text variant="h1">{heading}</Text>
            </Animated.View>
            <Animated.View style={[animatedTextFieldViewStyle, styles.transparent, { padding: 15 }]}>
              <Input multiline value={text} onChangeText={handleTextChange} variant="underlined" placeholder={`New ${heading.toLowerCase()}`} />
              <ChipContainer noPadding>
                {(tiles || []).map((t, idx) => {
                  return (
                    <TouchableOpacity onPress={() => handleTileRemove(idx)}>
                      <Chip key={idx} content={t + "  ⓧ"} />
                    </TouchableOpacity>
                  )
                })}
                <TouchableOpacity onPress={handleTileAdd}>
                  <Chip key="add" content=" + " />
                </TouchableOpacity>
              </ChipContainer>
            </Animated.View>
            <Animated.View style={[animatedButtonsViewStyle, styles.editCancel]}>
              <View style={[{
                height: 40,
                margin: 12,
                marginLeft: 0,
              }, styles.transparent]}>
                <TouchableOpacity onPress={handleBlockDelete}>
                  <Ionicons name="trash" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <Button style={styles.editCancelItem} color='secondary' variant='outlined' onPress={initiateClose}>Cancel</Button>
              <Button style={styles.editCancelItem} color='secondary' onPress={createEdit}>Edit</Button>
            </Animated.View>
          </View>
        </BlurView>
      )}
    </>
  )
}

interface EditProfileProps {
  initProfile: Profile;
  onProfileRefresh: () => void;
}
function EditProfile(props: EditProfileProps) {
  const { initProfile, onProfileRefresh } = props;
  const theme = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const [changed, setChanged] = useState(false);
  const [profile, setProfile] = useState(initProfile);
  const [openContentIdx, setOpenContentIdx] = useState(-1);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setOpenContentIdx(-1);
    // onProfileRefresh();
  };
  const handleElementOpen = (idx: number) => () => {
    setOpenContentIdx(idx);
  };
  const handleElementClose = (idx: number) => () => {
    setOpenContentIdx(-1);
  }
  const handleEditKey = (k: keyof Profile, newContent: string) => {
    setProfile({
      ...profile,
      [k]: newContent,
    })
  };
  const handleEditContent = (idx: number, newContent: ProfileContentBlock) => {
    setProfile({
      ...profile,
      content: editContentAtIdx(profile.content, idx, newContent),
    })
  };
  const handleDeleteBlock = (bidx: number) => () => {
    const spliceAndDelete = () => {
      setProfile({
        ...profile,
        content: profile.content.filter((_, idx) => idx !== bidx),
      });
    }
    contentOpacity.value = withTiming(0, {}, () => {
      runOnJS(spliceAndDelete)();
      contentOpacity.value = withTiming(1);
    })
  }

  let openIdx = 0;

  const renderContent = () => {
    return profile.content.map((c, idx) => {
      return (
        <EditableContent
          key={idx}
          open={openIdx === openContentIdx}
          content={c}
          contentIdx={idx}
          handleOpen={handleElementOpen(openIdx)}
          handleClose={handleElementClose(openIdx++)}
          handleEdit={handleEditContent}
          handleDeleteBlock={handleDeleteBlock(idx)}
        />
      );
    });
  };

  const contentOpacity = useSharedValue(1);

  const animatedContentViewStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    }
  })

  useEffect(() => {

  });

  const {
    photoUrl,
  } = initProfile;
  const somethingOpen = openContentIdx !== -1;

  return (
    <>
      <PageSheetModal
        open={open}
        title="Edit Profile"
        onClose={handleClose}
      >
        <ScrollView style={{ height: "100%", }}>
          <Animated.View style={[animatedContentViewStyle, { marginBottom: somethingOpen ? 300 : 100, }]}>
            <View style={{
              width: "100%",
              height: 200,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Avatar
                source={{
                  uri: photoUrl,
                }}
                size="20"
              />
            </View>
            <EditableKey
              profileKey="description"
              content={profile.description}
              open={openContentIdx === openIdx}
              handleOpen={handleElementOpen(openIdx)}
              handleClose={handleElementClose(openIdx++)}
              handleEdit={handleEditKey}
            />
            {renderContent()}
          </Animated.View>
        </ScrollView>
      </PageSheetModal>
      <View style={{
        width: "100%",
        padding: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <StyledButton color="secondary" onPress={handleOpen}>Edit Profile</StyledButton>
      </View>
    </>
  )
}

export default function AccountScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  const handleProfileRefresh = () => setLoading(true);

  useEffect(() => {
    if (loading) {
      (async () => {
        const resp = await getOwnProfile();
        setProfile(resp);
        setLoading(false);
      })();
    }
  }, [loading]);

  if (loading) return <Loading shouldCenter defaultDelay />

  return (
    <FadeInView>
      <ScrollView style={{
        marginBottom: "auto",
        height: "100%",
      }}>
        <ProfileDisplay {...profile} />
      </ScrollView>
      <EditProfile initProfile={profile} onProfileRefresh={handleProfileRefresh} />
    </FadeInView>
  );
}

function editContentAtIdx(prevArray: ProfileContentBlock[], targetIdx: number, newContent: ProfileContentBlock) {
  return prevArray.map((d, idx) => {
    if (idx === targetIdx) {
      return newContent;
    }
    return d;
  })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  profileItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  profileItemName: {
    width: 100,
  },
  profileItemValue: {
    fontWeight: '400',
    width: 250,
  },
  contentEditBlur: {
    flex: 1,
    paddingTop: 200,
    height: 1000,
    paddingHorizontal: 10,
    zIndex: 99,
  },
  editCancel: {
    flex: 1,
    flexDirection: "row",
    width: 150,
    marginHorizontal: 15,
    backgroundColor: "transparent",
  },
  editCancelItem: {
    margin: 5,
  },
  transparent: {
    backgroundColor: "transparent"
  }
});
