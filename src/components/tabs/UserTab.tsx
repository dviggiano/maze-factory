import React, { useContext, useState } from 'react';
import { Alert, Button, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext } from '../../context/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth, deleteAccount, registerPlay, removeFavorite } from '../../firebase/functions';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { UserTabProps } from '../../types/props';
import { MazeDocument } from '../../types/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import PlayableMaze from '../maze/PlayableMaze';
import Maze from '../../models/maze';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Info, List, Tab } from '../../types/enums';
import InfoContent from '../InfoContent';

export default function UserTab(props: UserTabProps): JSX.Element {
    const [list, setList] = useState<List>(List.MyMazes);
    const [modalMaze, setModalMaze] = useState(null);
    const [color, setColor] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [infoSelectVisible, setInfoSelectVisible] = useState(false);
    const [info, setInfo] = useState(Info.TermsOfUse);
    const { user, setUser } = useContext(UserContext);

    function MazeModal() {
        if (modalMaze === null) {
            return <></>;
        }

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <PlayableMaze
                            maze={modalMaze}
                            color={color}
                            setCompletionTime={() => {}}
                            showModal={() => {}}
                        />
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#4caf50' }]}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setModalVisible(false);
                            }}
                        >
                            <Text style={styles.buttonText}>Return</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    function InfoModal() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={infoVisible}
                onRequestClose={() => {
                    setInfoVisible(!infoVisible);
                }}
            >
                <View style={styles.infoContainer}>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoHeader}>
                            {
                                info === Info.TermsOfUse ?
                                'Terms of Use' :
                                'Privacy Policy'
                            }
                        </Text>
                        <InfoContent info={info} understand={() => {}} />
                        <TouchableOpacity
                            style={styles.closeInfo}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setInfoVisible(false);
                            }}
                        >
                            <Text style={styles.buttonText}>I Understand</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    function InfoSelectModal() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={infoSelectVisible}
                onRequestClose={() => {
                    setInfoSelectVisible(!infoSelectVisible);
                }}
            >
                <View style={styles.infoSelectContainer}>
                    <View style={styles.infoSelectContent}>
                        <Button
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setInfoSelectVisible(false);
                                setInfo(Info.TermsOfUse);
                                setInfoVisible(true);
                            }}
                            title={'Terms of Use'}
                        />
                        <Button
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setInfoSelectVisible(false);
                                setInfo(Info.PrivacyPolicy);
                                setInfoVisible(true);
                            }}
                            title={'Privacy Policy'}
                        />
                        <Button
                            color={'#e33b3b'}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Alert.alert(
                                    'Delete Account',
                                    `We're sorry to see you go, ${user.email.slice(0, user.email.indexOf('@'))}!`,
                                    [
                                        {
                                            text: 'Cancel',
                                            style: 'cancel',
                                        },
                                        {
                                            text: 'Delete',
                                            style: 'destructive',
                                            onPress: async () => {
                                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                Alert.alert(
                                                    'Are you sure?',
                                                    'By deleting your account, all of your user data will be erased forever and cannot be recovered!',
                                                    [
                                                        {
                                                            text: 'Cancel',
                                                            style: 'cancel',
                                                        },
                                                        {
                                                            text: 'Delete',
                                                            style: 'destructive',
                                                            onPress: async () => {
                                                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                                props.setLoading(true);
                                                                await deleteAccount();
                                                                props.navigation.navigate('Log In');
                                                            },
                                                        },
                                                    ]
                                                );
                                            },
                                        },
                                    ]
                                );
                            }}
                            title={'Delete Account'}
                        />
                        <TouchableOpacity
                            style={styles.closeInfo}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setInfoSelectVisible(false);
                            }}
                        >
                            <Text style={styles.buttonText}>Return</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <View style={[styles.container, { display: props.tab === Tab.User ? 'flex' : 'none' }]}>
            <InfoModal/>
            <InfoSelectModal/>
            <MazeModal/>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Text style={styles.title}>
                        {user.email.slice(0, user.email.indexOf('@')).toUpperCase()}
                        &nbsp;
                    </Text>
                    <TouchableOpacity
                        onPress={async () => {
                            await Haptics.impactAsync(ImpactFeedbackStyle.Light);
                            setInfoSelectVisible(true);
                        }}
                    >
                        <FontAwesome name="gear" size={20} color="#333"/>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>
                    <Text style={styles.subheading}>
                        Global Rank: {user.rank ? user.rank : '???'} &bull;
                    </Text>
                    <TouchableOpacity
                        onPress={async () => {
                            Alert.alert(
                                'Sign out?',
                                '',
                                [
                                    {
                                        text: 'OK',
                                        onPress: async () => {
                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            await signOut(auth);
                                            props.navigation.navigate('Log In');
                                        }
                                    },
                                    {
                                        text: 'Cancel',
                                        style: 'cancel'
                                    }
                                ],
                                { cancelable: true }
                            );
                        }}
                    >
                        <Text style={[styles.subheading, { color: '#5998de' }]}>
                            &nbsp;Sign Out &nbsp;
                            <FontAwesome name="sign-out" size={18} color="#5998de"/>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, { backgroundColor: list === List.MyMazes ? '#e0e0e0' : '#ededed' }]}
                    onPress={async () => {
                        if (list === List.Favorites) {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setList(List.MyMazes);
                        }
                    }}
                >
                    <Text
                        style={[styles.tabText, { textShadowColor: list === List.MyMazes ? 'rgba(0, 0, 0, 0.3)' : '#fff' }]}>
                        My Mazes
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, { backgroundColor: list === List.Favorites ? '#e0e0e0' : '#ededed' }]}
                    onPress={async () => {
                        if (list === List.MyMazes) {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setList(List.Favorites);
                        }
                    }}
                >
                    <Text
                        style={[styles.tabText, { textShadowColor: list === List.Favorites ? 'rgba(0, 0, 0, 0.3)' : '#fff' }]}>
                        Favorites
                    </Text>
                </Pressable>
            </View>
            <ScrollView style={[styles.menu, { display: list === List.MyMazes ? 'flex' : 'none' }]}>
                {
                    user.mazes.length > 0 ?
                        user.mazes.map((maze: MazeDocument, key: number) =>
                            // TODO map in reverse using keys and indexing to cut down time of other operations
                            <View
                                key={key}
                                style={[styles.menuItem, { shadowColor: 'color' in maze ? maze.color : '#a3abcc' }]}
                            >
                                <View style={styles.icon}>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            setColor(maze.color);
                                            const selectedMaze = new Maze(Object.keys(maze.template).length);
                                            selectedMaze.load(maze.template);
                                            setModalMaze(selectedMaze);
                                            setModalVisible(true);
                                        }}
                                    >
                                        <FontAwesome name="play-circle" size={60} color="#333"/>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ alignSelf: 'flex-end', flex: 5 }}>
                                    <View style={styles.mazeData}>
                                        <Text style={styles.mazeName}>{maze.name}</Text>
                                        <View style={{ flexDirection: 'column', flex: 3 }}>
                                            {
                                                maze.recordHolder !== null &&
                                                <Text style={styles.record}>
                                                    <FontAwesome name="trophy" size={16} color="#888"/>
                                                    &nbsp; {maze.recordTime}s <Text
                                                    style={{ fontSize: 14 }}>({maze.recordHolder})</Text>
                                                </Text>
                                            }
                                            <Text style={styles.creatorInfo}>
                                                Created: {maze.created && maze.created + '\n'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.line}/>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'flex-start',
                                                justifyContent: 'flex-start',
                                            }}
                                        >
                                            <Text style={styles.plays}>
                                                {` ${maze.plays}`} plays
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}
                                            onPress={async () => {
                                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                Alert.alert(
                                                    'Coming soon!',
                                                    `For now, tell your friends to search for ${maze.name}.`
                                                );
                                            }}
                                        >
                                            <Text style={styles.share}>
                                                {'Share  '}
                                                <FontAwesome name="share" size={14} color="#777"/>
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ) :
                        <Text style={styles.none}>You don't have any mazes yet!</Text>
                }
                <View style={{ height: 140 }}/>
            </ScrollView>
            <ScrollView style={[styles.menu, { display: list === List.Favorites ? 'flex' : 'none' }]}>
                {
                    user.favorites.length > 0 ?
                        user.favorites.map((maze: MazeDocument, key: number) =>
                            // TODO extract to component
                            <View
                                key={key}
                                style={[styles.menuItem, { shadowColor: 'color' in maze ? maze.color : '#a3abcc' }]}
                            >
                                <View style={styles.icon}>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

                                            if (user.plays[maze.id] === 0) {
                                                alert('Out of attempts!');
                                                // TODO earn more attempts by watching an ad
                                                // props.navigation.navigate('Ad', {
                                                //     id: maze.id,
                                                //     refresh: props.refresh,
                                                // });
                                            } else {
                                                if (maze.id in user.plays) {
                                                    const updatedUser = { ...user };
                                                    updatedUser.plays[maze.id]--;
                                                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                                                    setUser(updatedUser);
                                                } else {
                                                    const updatedUser = { ...user };
                                                    updatedUser.plays[maze.id] = 2;
                                                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                                                    setUser(updatedUser);
                                                }

                                                props.navigation.navigate('Play', {
                                                    doc: maze,
                                                    id: maze.id,
                                                    color: 'color' in maze ? maze.color : '#a3abcc',
                                                    refresh: props.refresh,
                                                    fail: props.fail
                                                });

                                                await registerPlay(user.id, maze.id);
                                            }
                                        }}
                                    >
                                        <FontAwesome name="play-circle" size={60} color="#333"/>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ alignSelf: 'flex-end', flex: 5 }}>
                                    <View style={styles.mazeData}>
                                        <Text style={styles.mazeName}>{maze.name}</Text>
                                        <View style={{ flexDirection: 'column', flex: 3 }}>
                                            {
                                                maze.recordHolder !== null &&
                                                <Text style={styles.record}>
                                                    <FontAwesome name="trophy" size={16} color="#888"/>
                                                    &nbsp; {maze.recordTime}s <Text
                                                    style={{ fontSize: 14 }}>({maze.recordHolder})</Text>
                                                </Text>
                                            }
                                            <Text style={styles.creator}>
                                                Created: {maze.created && maze.created + '\n'}by {maze.creator}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.line}/>
                                    <View style={{ flexDirection: 'row', paddingTop: 5 }}>
                                        <View
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'flex-start',
                                                justifyContent: 'flex-start',
                                            }}
                                        >
                                            <Pressable
                                                onPress={async () => {
                                                    Alert.alert(
                                                        `Remove ${maze.name} as a favorite?`,
                                                        '',
                                                        [
                                                            {
                                                                text: 'OK',
                                                                onPress: async () => {
                                                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                                    props.setLoading(true);
                                                                    try {
                                                                        await removeFavorite(user.id, maze.id);
                                                                        const updatedUser = { ...user };
                                                                        updatedUser.favorites = user.favorites.filter(favorite => favorite.id !== maze.id);
                                                                        setUser(updatedUser);
                                                                        props.setLoading(false);
                                                                    } catch (error) {
                                                                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                                        props.setLoading(false);
                                                                        Alert.alert(error.message);
                                                                    }
                                                                }
                                                            },
                                                            {
                                                                text: 'Cancel',
                                                                style: 'cancel'
                                                            }
                                                        ],
                                                        { cancelable: true }
                                                    );
                                                }}
                                            >
                                                <Text style={styles.remove}>
                                                    Remove
                                                </Text>
                                            </Pressable>
                                        </View>
                                        <Text
                                            style={[styles.attempts, { color: maze.id in user.plays && user.plays[maze.id] === 0 ? '#ed1d0e' : '#666' }]}
                                        >
                                            Attempts remaining: {maze.id in user.plays ? user.plays[maze.id] : 3}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) :
                        <Text style={styles.none}>You don't have any favorites yet!</Text>
                }
                <View style={{ height: 140 }}/>
            </ScrollView>
            <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                style={styles.bottomGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: .5 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginHorizontal: 30,
        width: '100%',
        height: '100%',
    },
    header: {
        width: '95%',
        height: 95,
        padding: 20,
        paddingBottom: 10,
        marginTop: 20,
        borderColor: '#666',
        borderBottomWidth: 1,
        marginHorizontal: 10,
        flexDirection: 'column',
    },
    tabs: {
        width: '95%',
        height: 60,
        marginHorizontal: 10,
        alignSelf: 'center',
        borderColor: '#666',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
    },
    tab: {
        height: 40,
        borderRadius: 15,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        color: '#444',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 1,
    },
    icon: {
        margin: 5,
    },
    title: {
        fontSize: 24,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    subheading: {
        fontSize: 18,
        marginTop: 8,
        textAlign: 'right',
        color: '#555',
    },
    menu: {
        width: '100%',
        padding: 20,
    },
    menuItem: {
        width: '100%',
        padding: 15,
        margin: 5,
        alignSelf: 'center',
        borderRadius: 5,
        backgroundColor: '#f0f0f0',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mazeData: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mazeName: {
        textAlign: 'center',
        flex: 2,
        fontSize: 20,
        fontWeight: 'bold',
    },
    record: {
        textAlign: 'right',
        fontSize: 16,
    },
    creatorInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'right',
    },
    plays: {
        fontSize: 14,
        marginTop: 5,
        color: '#222',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    remove: {
        fontSize: 14,
        color: '#222',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    creator: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'right',
    },
    share: {
        textAlign: 'right',
        fontSize: 14,
        textShadowColor: 'rgba(255, 217, 201, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        color: '#555',
    },
    bottomGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 85,
        zIndex: 1,
    },
    modalContainer: {
        flex: 1,
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        width: '92.5%',
        padding: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(3px)',
    },
    infoContainer: {
        flex: 1,
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        width: '70%',
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(3px)',
    },
    infoHeader: {
        fontWeight: 'bold',
        fontSize: 24,
    },
    infoSelectContainer: {
        flex: 1,
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSelectContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        width: '55%',
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(3px)',
    },
    infoButton: {
        borderRadius: 10,
        padding: 10,
        margin: 4,
        alignItems: 'center',
        backgroundColor: 'rgba(221, 221, 221, 0.9)',
        width: '100%',
    },
    infoLink: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeInfo: {
        marginTop: 5,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#4caf50',
        width: '60%',
        marginLeft: 5,
        marginRight: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: '100%',
        height: 55,
        marginLeft: 5,
        marginRight: 5,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    attempts: {
        textAlign: 'right',
        flex: 3,
        fontSize: 14,
    },
    none: {
        alignSelf: 'center',
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 25,
    },
    line: {
        borderBottomColor: '#ddd',
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginVertical: 8,
    },
    aboutText: {
        color: '#888',
        fontWeight: 'bold',
    }
});