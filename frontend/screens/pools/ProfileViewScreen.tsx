import { Avatar } from "native-base";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { FadeInView } from "../../components/Animation";
import { Chip, ChipContainer } from "../../components/Chip";
import { Loading } from "../../components/Display";
import Text from "../../components/StyledText";
import { defaultProfile, getProfile, Profile, ProfileContentBlock as ProfileContentBlockProps } from "../../dataAccess/users";
import { RootTabScreenProps } from "../../types";
import * as Logging from '../../Logging';

function ProfileContentBlock(props: ProfileContentBlockProps) {
    const {
        heading,
        text,
        tiles,
    } = props;

    const renderTiles = () => {
        return tiles?.map((t, idx) => {
            return <Chip key={idx} content={t} />
        })
    };

    return (
        <View style={{
            marginVertical: 5,
        }}>
            <Text variant="body" style={{ fontWeight: "500" }}>{heading}</Text>
            {text && <Text variant="body">{text}</Text>}
            {tiles && (
                <ChipContainer>
                    {renderTiles()}
                </ChipContainer>
            )}
        </View>
    )
}

export function ProfileDisplay(props: Profile) {
    const {
        photoUrl,
        content,
        description,
        name,
    } = props;

    const renderContent = () => {
        return content.map((d, idx) => {
            return <ProfileContentBlock key={idx} {...d} />
        })
    }

    return (
        <>
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                padding: 25,
                paddingLeft: 40,
            }}>
                <View style={{
                    marginTop: 25,
                    marginRight: 25,
                    width: 100,
                }}>
                    <Avatar
                        size="24"
                        source={{
                            uri: photoUrl
                        }}
                    />
                </View>
                <View style={{
                    flex: 1,
                    height: 100,
                }}>
                    <Text variant="h1">{name}</Text>
                    <Text variant="body">{description}</Text>
                </View>
            </View>
            <View style={{
                padding: 25,
                paddingTop: 0,
            }}>
                {renderContent()}
            </View>
        </>
    )
}

function ProfileViewScreen({ route, navigation }: RootTabScreenProps<'Pool'>) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile>(defaultProfile);

    useEffect(() => {
        if (loading) {
            (async () => {
                try {
                    const resp = await getProfile((route.params as any).userId);

                    setProfile(resp);
                    setLoading(false);
                } catch (error) {
                    Logging.Error(error);
                }
            })();
        }
    }, []);

    if (!route.params) return <Text variant="h1">Something went wrong!</Text>
    if (loading) return <Loading shouldCenter defaultDelay />

    return (
        <FadeInView>
            <ScrollView style={{
                height: "100%",
            }}>
                <ProfileDisplay {...profile} />
            </ScrollView>
        </FadeInView>
    )
}

export default ProfileViewScreen;