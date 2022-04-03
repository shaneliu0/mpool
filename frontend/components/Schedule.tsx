import * as React from 'react';
import {
    StyleSheet,
    Platform,
    View,
    TouchableOpacity,
} from 'react-native';

import {
    Alert,
    Collapse,
    Button,
    IconButton,
    Box,
    ArrowForwardIcon,
    Center,
    Heading,
    Container,
    VStack,
    HStack,
    useTheme,
    useMediaQuery,
    Row,
    Column,
    Accordion,
    Checkbox,
    Divider,
    Avatar,
    Skeleton
} from 'native-base';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Collapsible from 'react-native-collapsible';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Text, View as ThemedView, CheckIcon, CrossIcon, InfoIcon, WarningIcon, NotFoundIcon } from './Themed';

import { ScheduleDay, TimeSlot, Student, SlotTip } from '../types';
import useColorScheme from '../hooks/useColorScheme';
import { style } from 'styled-system';
import { useEffect } from 'react';

const styles = StyleSheet.create({
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
    sideMargins: {
        marginLeft: 10,
        marginRight: 10,
    },
    signUpMenu: {
        marginTop: 10,
    },
    avatarStyle: {
        marginRight: 10
    },
    horizontalSpacing: {
        marginHorizontal: 15
    },
    alignRight: {
        marginRight: 15,
        marginLeft: "auto",
    },
});

export function RecommendationAlert(props: { title: string, description: string, action: () => void, loaded: boolean }) {
    const { title, description, action, loaded } = props;
    if (loaded) {
        return (
            <Box width="100%">
                <Alert status="info" style={styles.sideMargins} borderRadius={15}>
                    <Alert.Icon />
                    <Box flex={1} ml={2}>
                        <Alert.Title>{title}</Alert.Title>
                        <Alert.Description mt={2}>
                            {description}
                        </Alert.Description>
                    </Box>
                    <IconButton
                        icon={<ArrowForwardIcon color="blue.500" size="sm" />}
                        onPress={action}
                    />
                </Alert>
            </Box>
        )
    } else {
        return (
            <Skeleton variant="rect" mx={10} my={1} height={"75px"} style={styles.sideMargins} />
        )
    }
}

export function StudentContainer(props: { studentList: Student[], loaded: boolean }) {
    const { loaded } = props;

    return (
        <VStack space={4} width="100%">
            {/* render out the timeSlotArray into TimeSlotBar instances */}
            {props.studentList.map((student: Student, idx: number) => {
                return (
                    <StudentBar
                        key={idx}
                        student={student}
                        loaded={loaded}
                    />
                );
            }
            )}
        </VStack>
    )
}

export function DaySlotBar(props: { key: number, day: ScheduleDay, action: () => void, loaded: boolean }) {
    const theme = useTheme();
    const [isSmallScreen] = useMediaQuery({ maxWidth: theme.breakpoints.md });
    const isDarkTheme = useColorScheme() === "dark";

    const { day, action, loaded } = props;
    if (!day) return null;
    const { date, classType, status, classId } = day;

    if (isSmallScreen) {
        if (loaded) {
            return (
                <>
                    <TouchableOpacity onPress={action}>
                        <View
                            style={styles.sideMargins}
                        >
                            <ThemedView style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                            <Row alignItems="center">
                                <Box>
                                    <Text style={styles.scheduleText}>{date}</Text>
                                    <Text style={styles.scheduleText}>{classType}</Text>
                                    <Text style={styles.scheduleText}>{status}</Text>
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
                <Skeleton variant="rect" mx={10} my={2} height={20} style={styles.sideMargins} />
            )
        }
    } else {
        if (loaded) {
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
                                    {classType}
                                </Text>
                            </Center>
                            <Center height={60}>
                                <Text style={styles.scheduleText}>
                                    {date}
                                </Text>
                            </Center>
                            <Center height={60}>
                                <Text style={styles.scheduleText}>
                                    {status}
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
                <Skeleton variant="rect" mx={10} my={2} height={60} style={styles.sideMargins} />
            )
        }
    }
}

export function TimeSlotBar(props: { key: number, timeSlot: TimeSlot, loaded: boolean }) {
    const theme = useTheme();
    const [isSmallScreen] = useMediaQuery({ maxWidth: theme.breakpoints.md });
    const isDarkTheme = useColorScheme() === "dark";

    // destructure props
    const { timeSlot, loaded } = props;
    // destructure TimeSlot from the interface TimeSlot
    const { startTime, endTime, availability, } = timeSlot;

    // useState open
    const [isOpen, setIsOpen] = React.useState(false);
    const action = () => setIsOpen(!isOpen);

    if (isSmallScreen) {
        if (loaded) {
            return (
                <>
                    <TouchableOpacity onPress={action}>
                        <View
                            style={[styles.sideMargins, { height: 90 }]}
                        >
                            <ThemedView style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                            <Row alignItems="center">
                                <Box>
                                    <Text style={styles.scheduleText}>{startTime}-{endTime}</Text>
                                    <Text style={styles.scheduleText}>{availability}</Text>
                                </Box>
                                <Box marginRight={15} marginLeft={"auto"} style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}>
                                    <MaterialIcons name="keyboard-arrow-right" size={24} color={isDarkTheme ? "#ffffff" : "#000000"} />
                                </Box>
                            </Row>
                            <ThemedView style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                        </View>

                    </TouchableOpacity>
                    <SignUpMenu
                        isOpen={isOpen}
                        timeSlot={timeSlot}
                        loaded={loaded}
                    />
                </>
            );
        } else {
            return (
                <Skeleton variant="rect" mx={10} my={2} height={20} style={styles.sideMargins} />
            )
        }
    } else {
        if (loaded) {
            return (
                <>
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
                                    <Text style={styles.scheduleText}>{startTime}-{endTime}</Text>
                                </Center>
                                <Center height={60}>
                                    <Text style={styles.scheduleText}>
                                        {availability}
                                    </Text>
                                </Center>
                                <Center height={60} marginRight={15} marginLeft={"auto"} style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}>
                                    <MaterialIcons name="keyboard-arrow-right" size={24} color={isDarkTheme ? "#ffffff" : "#000000"} />
                                </Center>
                            </Row>
                        </Box>
                    </TouchableOpacity>
                    <SignUpMenu
                        isOpen={isOpen}
                        timeSlot={timeSlot}
                        loaded={loaded}
                    />
                </>
            )
        } else {
            return (
                <Skeleton variant="rect" mx={10} my={2} height={60} style={styles.sideMargins} />
            )
        }
    }
};

function SignUpMenu({ isOpen, timeSlot, loaded }: { isOpen: boolean, timeSlot: TimeSlot, loaded: boolean }) {
    const { startTime, endTime, availability, slotId, alreadySignedUp } = timeSlot;

    const navigation = useNavigation();
    const [options, setOptions] = React.useState({});

    useEffect(() => {
        if (loaded) {
            const newOptions: any = {};
            timeSlot.tips && timeSlot.tips.forEach(tip => {
                if (tip.identifier) {
                    newOptions[tip.identifier] = true;
                }
            })
            setOptions(newOptions);
        }
    }, [loaded]);

    const handleCustom = () => {
        navigation.navigate("SignUp", {
            slotId: slotId,
            custom: 1,
            options: Object.entries(options).map(([key, value]) => {
                return key + ":" + value;
            }).join(","),
        })
    }

    const handleDefault = () => {
        navigation.navigate("SignUp", {
            slotId: slotId,
            options: Object.entries(options).map(([key, value]) => {
                return key + ":" + value;
            }).join(","),
        })
    }

    if (timeSlot.signedUp) {
        return (
            <Collapsible collapsed={!isOpen}>
                <Box marginTop={15}>
                    <VStack space={4}>
                        {timeSlot.signedUp.map((data, idx) => {
                            return (
                                <StudentScheduleSlot
                                    key={idx}
                                    student={data.student}
                                    endComponent={
                                        <Button
                                            colorScheme="secondary"
                                            onPress={() => alert('Went to edit sign up page.')}
                                        >
                                            Edit
                                        </Button>
                                    }
                                    loaded={loaded}
                                    altText={`${data.startTime} - ${data.endTime}`}
                                />
                            );
                        })}
                    </VStack>
                </Box>
            </Collapsible>
        );
    } else {
        return (
            <Collapsible collapsed={!isOpen}>
                <Box
                    style={[styles.sideMargins, { marginLeft: 20 }]}
                    marginTop={15}
                >
                    <VStack space={4}>
                        {timeSlot.tips && timeSlot.tips.map((tip: SlotTip, idx) => {
                            switch (tip.type) {
                                case "check":
                                    return (
                                        <HStack alignItems="center" space={4} key={idx}>
                                            <CheckIcon />
                                            <Text>{tip.displayText}</Text>
                                        </HStack>
                                    )
                                case "cross":
                                    return (
                                        <HStack alignItems="center" space={4} key={idx}>
                                            <CrossIcon />
                                            <Text>{tip.displayText}</Text>
                                        </HStack>
                                    )
                                case "info":
                                    return (
                                        <HStack alignItems="center" space={4} key={idx}>
                                            <InfoIcon />
                                            <Text>{tip.displayText}</Text>
                                        </HStack>
                                    )
                                case "warning":
                                    return (
                                        <HStack alignItems="center" space={4} key={idx}>
                                            <WarningIcon />
                                            <Text>{tip.displayText}</Text>
                                        </HStack>
                                    )
                                case "checkbox":
                                    if (tip.identifier) {
                                        return (
                                            <HStack alignItems="center" space={4} key={idx}>
                                                <Checkbox
                                                    value={tip.identifier}
                                                    onChange={(value) => setOptions({ ...options, [tip.identifier!]: value })}
                                                    defaultIsChecked={true}
                                                />
                                                <Text>{tip.displayText}</Text>
                                            </HStack>
                                        )
                                    }
                                default:
                                    return (
                                        <HStack alignItems="center" space={4} key={idx}>
                                            <NotFoundIcon />
                                            <Text>{tip.displayText}</Text>
                                        </HStack>
                                    )
                            }
                        })}
                        {(timeSlot.availability !== "Unavailable") && (
                            <HStack alignItems="flex-end" space={4}>
                                <Button onPress={handleCustom} variant="outline" size={"sm"}>{alreadySignedUp ? "Customize and move" : "Customize sign up"}</Button>
                                <Button onPress={handleDefault} size={"sm"}>{alreadySignedUp ? "Move here" : "Sign up"}</Button>
                            </HStack>
                        )}
                    </VStack>
                </Box>
            </Collapsible>
        )
    }
}

export function StudentBar({ student, loaded, altText }: { key?: number, student: Student, loaded: boolean, altText?: string }) {
    const { firstName, lastName, studentId, mathLevel, readingLevel } = student;
    const isDarkTheme = useColorScheme() === "dark";

    if (loaded) {
        return (
            <HStack space={1}>
                <Avatar
                    size="md"
                    style={{ backgroundColor: "#FD5E53" }}
                    _text={{ color: isDarkTheme ? "#ffffff" : "#000000" }}
                >
                    {firstName.charAt(0) + lastName.charAt(0)}
                </Avatar>
                <VStack>
                    <Text style={[styles.scheduleText, { width: "auto", }]}>{firstName} {lastName}</Text>
                    {altText ? (
                        <Text style={[styles.scheduleText, { width: "auto", fontSize: 14, marginLeft: 15 }]}>{altText}</Text>
                    ) : (
                        <Text style={[styles.scheduleText, { width: "auto", fontSize: 14, marginLeft: 15 }]}>{mathLevel && `Math ${mathLevel}`}{mathLevel && readingLevel && ` · `}{readingLevel && `Reading ${readingLevel}`}</Text>
                    )}
                </VStack>
            </HStack>
        )
    } else {
        return (
            <HStack space={1}>
                <Skeleton my={2} height={6} variant="circle" size={"48px"} />
                <VStack>
                    <Skeleton mx={4} mr={12} variant="text" height={16} width={140} />
                </VStack>
            </HStack>
        )
    }
}

export function StudentScheduleSlot(props: { student: Student, endComponent: any, loaded: boolean, altText?: string }) {
    const { student, endComponent, loaded } = props;

    const theme = useTheme();
    const [isSmallScreen] = useMediaQuery({ maxWidth: theme.breakpoints.md });

    return (
        <HStack style={styles.horizontalSpacing} space={2}>
            <StudentBar
                student={student}
                loaded={loaded}
                altText={props.altText}
            />
            {!isSmallScreen && (
                <Center style={styles.alignRight}>
                    <Divider orientation="horizontal" style={{ width: 300 }} />
                </Center>
            )}
            <Center style={styles.alignRight}>
                {endComponent}
            </Center>
        </HStack>
    );
}