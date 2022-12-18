import { Avatar, Input } from 'native-base';
import React, { useState, useEffect, useContext } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { FadeInView } from '../../components/Animation';
import StyledButton from '../../components/Button';
import { Loading } from '../../components/Display';

import EditScreenInfo from '../../components/EditScreenInfo';
import { PageSheetModal } from '../../components/Modal';
import { View } from '../../components/Themed';
import { defaultContentBlock, defaultProfile, getOwnProfile, getProfileContentPrompts, Profile, ProfileContentBlock, ProfileContentPrompt, saveProfile } from '../../dataAccess/users';
import { ProfileDisplay } from '../pools/ProfileViewScreen';
import Text from '../../components/StyledText';
import { ThemeContext } from '../../App';
import Animated, { runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming, } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Button from '../../components/Button';
import { useRef } from 'react';
import { Chip, ChipContainer } from '../../components/Chip';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Logging from '../../Logging';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

function capitalizeFirstLetter(str: string) {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
            const removeTile = () => {
              setValue({
                ...value,
                tiles: value.tiles && value.tiles.filter((_, idx) => idx !== tidx)
              })
            };
            tilesOpacity.value = withTiming(0, {}, () => {
              runOnJS(removeTile)();
              tilesOpacity.value = withTiming(1);
            });
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
        const addTile = () => {
          setValue({
            ...value,
            tiles: [...(tiles || []), t]
          })
        };

        tilesOpacity.value = withTiming(0, {}, () => {
          runOnJS(addTile)();
          tilesOpacity.value = withTiming(1);
        });
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
  const tilesOpacity = useSharedValue(1);

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
  const aniamtedTilesStyle = useAnimatedStyle(() => {
    return {
      opacity: tilesOpacity.value,
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
            <Animated.View style={[animatedTextFieldViewStyle, styles.transparent, { padding: 15, }]}>
              <Input multiline value={text} onChangeText={handleTextChange} variant="underlined" placeholder={`New ${heading.toLowerCase()}`} />
              <Animated.View style={aniamtedTilesStyle}>
                <ChipContainer noPadding>
                  {(tiles || []).map((t, idx) => {
                    return (
                      <TouchableOpacity key={idx} onPress={() => handleTileRemove(idx)}>
                        <Chip key={idx} content={t + "  ⓧ"} />
                      </TouchableOpacity>
                    )
                  })}
                  <TouchableOpacity onPress={handleTileAdd}>
                    <Chip key="add" content=" + " />
                  </TouchableOpacity>
                </ChipContainer>
              </Animated.View>
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

interface AddContentProps {
  open: boolean;
  prompts: ProfileContentPrompt[] | null;
  handleOpen: () => void;
  handleClose: () => void;
  handleAdd: (newContent: ProfileContentBlock) => void;
}
function AddContent(props: AddContentProps) {
  const {
    open,
    prompts,
    handleOpen,
    handleClose,
    handleAdd,
  } = props;
  const [value, setValue] = useState<ProfileContentBlock>(defaultContentBlock);
  const [chosenPromptIdx, setChosenPromptIdx] = useState(-1);
  const [realOpen, setRealOpen] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const DURATION = 200;
  const BLUR_DURATION = DURATION * 3;
  const initialPromptsOpacity = 0.8;
  const timingOptions = { duration: DURATION };

  const handleTextChange = (t: string) => {
    setValue({
      ...value,
      text: t,
    })
  };
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
            const removeTile = () => {
              setValue({
                ...value,
                tiles: value.tiles && value.tiles.filter((_, idx) => idx !== tidx)
              })
            };
            tilesOpacity.value = withTiming(0, {}, () => {
              runOnJS(removeTile)();
              tilesOpacity.value = withTiming(1);
            });
          },
        },
      ],
      {
        cancelable: true,
      }
    );
  };
  const handleTileAdd = () => {
    Alert.prompt(
      "Add an item",
      undefined,
      (t: string) => {
        const addTile = () => {
          setValue({
            ...value,
            tiles: [...(tiles || []), t]
          })
        };

        tilesOpacity.value = withTiming(0, {}, () => {
          runOnJS(addTile)();
          tilesOpacity.value = withTiming(1);
        });
      }
    )
  }
  const handleChange = (idx: number) => {
    handlePromptsClose();
    setChosenPromptIdx(idx);
    setValue({
      ...value,
      heading: prompts ? prompts[idx].title : "",
      promptId: prompts ? prompts[idx].promptId : -1
    })
  };
  const createEdit = () => {
    initiateClose();
    setTimeout(() => {
      handleAdd(value);
    }, BLUR_DURATION);
  }
  const initiateClose = () => {
    handleClose();
  }
  const handlePromptsOpen = () => {
    if (!prompts) return;
    translateOffsets.value = withTiming(200, timingOptions);
    opacities.value = withTiming(0, timingOptions);
    setTimeout(() => {
      setPromptsOpen(true);
    }, BLUR_DURATION);
  }
  const handlePromptsClose = () => {
    promptsScale.value = withTiming(initialPromptsOpacity, timingOptions);
    promptsOpacity.value = withTiming(0, timingOptions);
    setTimeout(() => {
      setPromptsOpen(false);
      translateOffsets.value = withTiming(0, timingOptions);
      opacities.value = withTiming(1, timingOptions);
    }, BLUR_DURATION)
  }

  const translateOffsets = useSharedValue(200);
  const opacities = useSharedValue(0);
  const promptsScale = useSharedValue(initialPromptsOpacity);
  const promptsOpacity = useSharedValue(0);
  const tilesOpacity = useSharedValue(1);


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
  const animatedPromptsViewStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(promptsScale.value, SPRING_OPTIONS) }],
      opacity: withSpring(promptsOpacity.value),
    }
  });
  const aniamtedTilesStyle = useAnimatedStyle(() => {
    return {
      opacity: tilesOpacity.value,
    }
  });

  useEffect(() => {
    if (open) {
      setRealOpen(true);
      translateOffsets.value = withTiming(0, timingOptions);
      opacities.value = withTiming(1, timingOptions);
    } else {
      translateOffsets.value = withTiming(200, timingOptions);
      opacities.value = withTiming(0, timingOptions);
      setTimeout(() => {
        setRealOpen(false);
        setValue(defaultContentBlock);
        setChosenPromptIdx(-1);
      }, BLUR_DURATION);
    }
  }, [open])

  useEffect(() => {
    if (promptsOpen) {
      promptsScale.value = withTiming(1, timingOptions);
      promptsOpacity.value = withTiming(1, timingOptions);
    } else {
      promptsScale.value = initialPromptsOpacity;
      promptsOpacity.value = 0;
    }
  }, [promptsOpen]);

  const renderPrompts = () => {
    if (!prompts) return null;
    return prompts.map((p, idx) => {
      const { title, promptId } = p;
      return (
        <TouchableOpacity
          style={{
            paddingBottom: 10,
            marginHorizontal: 10,
          }}
          onPress={() => handleChange(idx)}
        >
          <Text variant="subtitle">{title}</Text>
        </TouchableOpacity>
      )
    });
  };

  const loadingPrompts = !prompts;
  const notChosenPrompt = chosenPromptIdx === -1;

  let dname = "";
  if (loadingPrompts) {
    dname = "[still loading...]";
  } else if (chosenPromptIdx !== -1) {
    dname = prompts[chosenPromptIdx].title;
  } else {
    dname = "[tap to edit]";
  }

  const {
    heading,
    text,
    tiles,
  } = value;

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.addContentButtonStyle} onPress={handleOpen}>
          <Ionicons name="add" size={50} color="black" />
        </TouchableOpacity>
      </View>
      {realOpen && (
        <BlurView intensity={open ? 95 : 0} style={[StyleSheet.absoluteFill, styles.contentEditBlur]}>
          <View style={styles.transparent}>
            {promptsOpen ? (
              <>
                <Animated.View style={animatedPromptsViewStyle}>
                  <View style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: -70,
                    marginBottom: 30,
                  }}>
                    <TouchableOpacity onPress={handlePromptsClose}>
                      <AntDesign name="closecircleo" size={50} color="black" />
                    </TouchableOpacity>
                  </View>
                  <Text variant="h1">Select an option</Text>
                  {renderPrompts()}
                </Animated.View>
              </>
            ) : (
              <>
                <Animated.View style={animatedHeaderViewStyle}>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", }} onPress={handlePromptsOpen}>
                    <Text variant="h1">{dname}</Text>
                    <View style={{
                      position: "absolute",
                      left: "90%",
                      top: 15,
                    }}>
                      {loadingPrompts ? (
                        <MaterialIcons name="hourglass-full" size={24} color="black" />
                      ) : (
                        <MaterialIcons name="edit" size={24} color="black" />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={[animatedTextFieldViewStyle, styles.transparent, { padding: 15 }]}>
                  <Input multiline autoFocus value={text} onChangeText={handleTextChange} variant="underlined" placeholder={`Share something...`} />
                  <Animated.View style={aniamtedTilesStyle}>
                    <ChipContainer noPadding>
                      {(tiles || []).map((t, idx) => {
                        return (
                          <TouchableOpacity key={idx} onPress={() => handleTileRemove(idx)}>
                            <Chip key={idx} content={t + "  ⓧ"} />
                          </TouchableOpacity>
                        )
                      })}
                      <TouchableOpacity onPress={handleTileAdd}>
                        <Chip key="add" content=" + " />
                      </TouchableOpacity>
                    </ChipContainer>
                  </Animated.View>
                </Animated.View>
                <Animated.View style={[animatedButtonsViewStyle, styles.editCancel]}>
                  <Button style={styles.editCancelItem} color='primary' variant='outlined' onPress={initiateClose}>Cancel</Button>
                  <Button style={styles.editCancelItem} color='primary' disabled={notChosenPrompt} onPress={notChosenPrompt ? () => undefined : createEdit}>Add</Button>
                </Animated.View>
              </>
            )}
          </View>
        </BlurView>
      )}
    </>
  )
}

interface EditProfileProps {
  initProfile: Profile;
  onProfileRefresh: () => void;
  onNewProfile: (newProfile: Profile) => void;
}
function EditProfile(props: EditProfileProps) {
  const { initProfile, onNewProfile } = props;
  const theme = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const [changed, setChanged] = useState(false);
  const [profile, setProfile] = useState(initProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [prompts, setPrompts] = useState<ProfileContentPrompt[] | null>(null);
  const [openContentIdx, setOpenContentIdx] = useState(-1);
  const scrollRef = useRef(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setOpenContentIdx(-1);
    // onProfileRefresh();
  };
  const handleElementOpen = (idx: number) => () => {
    // @ts-ignore
    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
    setOpenContentIdx(idx);
  };
  const handleElementClose = (idx: number) => () => {
    setOpenContentIdx(-1);
  }
  const handleEditKey = (k: keyof Profile, newContent: string) => {
    setProfile({
      ...profile,
      [k]: newContent,
    });
    setChanged(true);
  };
  const handleEditContent = (idx: number, newContent: ProfileContentBlock) => {
    setProfile({
      ...profile,
      content: editContentAtIdx(profile.content, idx, newContent),
    });
    setChanged(true);
  };
  const handleAddContent = (newContent: ProfileContentBlock) => {
    const addContent = () => {
      setProfile({
        ...profile,
        content: [...profile.content, newContent]
      })
    }
    contentOpacity.value = withTiming(0, {}, () => {
      runOnJS(addContent)();
      contentOpacity.value = withTiming(1);
    });
    setChanged(true);
  }
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
    });
    setChanged(true);
  }
  const handleSave = async () => {
    setSavingProfile(true);
    try {
      const savedProfile = await saveProfile(profile);
      setProfile(savedProfile);
      onNewProfile(savedProfile);
    } catch (error) {
      Logging.Error(error);
    }
    setSavingProfile(false);
    setChanged(false);
    setOpen(false);
  }
  const handleReset = async () => {
    // prompt the user if they are sure they want to reset their progress.
    Alert.alert(
      'Reset Profile',
      'Are you sure you want to reset your changes?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const resetEdits = () => {
              setProfile(initProfile);
              setChanged(false);
            }
            contentOpacity.value = withTiming(0, {}, () => {
              runOnJS(resetEdits)();
              contentOpacity.value = withTiming(1);
            });
          }
        }
      ]
    )
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
    // if (open) setProfile(initProfile);
    if (open && !prompts) {
      (async () => {
        try {
          const res = await getProfileContentPrompts();
          setPrompts(res);
        } catch (error) {
          Logging.Error(error);
        }
      })();
    }
  }, [open]);

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
        altAction={(() => {
          if (!changed) return undefined;
          return {
            text: "Save",
            loadingText: "Saving...",
            loading: savingProfile,
            action: () => {
              handleSave();
            }
          }
        })()}
      >
        <ScrollView style={{ height: "100%", }} ref={scrollRef}>
          <Animated.View style={[animatedContentViewStyle, { marginBottom: somethingOpen ? 400 : 200, }]}>
            <View
              style={{
                width: "100%",
                height: 200,
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Your profile image and name are synced with your Google account. If you changed it recently, it will update here after 24-48 hours.')
                }}
              >
                <Avatar
                  source={{
                    uri: photoUrl,
                  }}
                  size="20"
                />
              </TouchableOpacity>
            </View>
            <View style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              {changed && (
                <TouchableOpacity
                  style={{
                    margin: 15,
                    marginLeft: 35,
                    marginTop: -50,
                    width: 35,
                  }}
                  onPress={handleReset}
                >
                  <MaterialIcons name="undo" size={24} color="black" />
                </TouchableOpacity>
              )}
              <View></View>
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
            <AddContent
              open={openContentIdx === openIdx}
              handleOpen={handleElementOpen(openIdx)}
              handleClose={handleElementClose(openIdx++)}
              handleAdd={handleAddContent}
              prompts={prompts}
            />
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
  const DURATION = 200;
  const timingOptions = { duration: DURATION };

  const handleProfileRefresh = () => setLoading(true);

  const handleNewProfile = (profile: Profile) => {
    const setNewProfile = () => {
      setProfile(profile);
    }
    profileOpacity.value = withTiming(0, timingOptions, () => {
      runOnJS(setNewProfile)();
      profileOpacity.value = withTiming(1, timingOptions);
    });
  }

  const profileOpacity = useSharedValue(1);

  const animatedProfileOpacity = useAnimatedStyle(() => {
    return {
      opacity: withSpring(profileOpacity.value),
    }
  })

  useEffect(() => {
    if (loading) {
      (async () => {
        try {
          const resp = await getOwnProfile();
          setProfile(resp);
          setLoading(false);
        } catch (error) {
          Logging.Error(error);
        }
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
        <Animated.View style={animatedProfileOpacity}>
          <ProfileDisplay {...profile} />
        </Animated.View>
      </ScrollView>
      <EditProfile initProfile={profile} onProfileRefresh={handleProfileRefresh} onNewProfile={handleNewProfile} />
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
  },
  addContentButtonStyle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "95%",
    height: 120,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 15,
  }
});
