import React, { useContext, useEffect, useState } from 'react';
import Maze from '../models/maze';
import { View, Modal, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import PlayableMaze from '../components/maze/PlayableMaze';
import { getMaze, beatRecord, registerPlay, setFavorite, getUser } from '../firebase/functions';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Loading from '../components/Loading';
import { UserContext } from '../context/UserContext';
import { MenuContext } from '../context/MenuContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The screen for playing a maze.
 * @return {JSX.Element} the rendered screen
 */
export default function PlayScreen({ navigation, route }): JSX.Element {
    const [maze, setMaze] = useState(null);
    const [name, setName] = useState(null);
    const [record, setRecord] = useState(null);
    const [completionTime, setCompletionTime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const { user, setUser } = useContext(UserContext);
    const { mazes, setMazes } = useContext(MenuContext);

    // possible contradulatory messages for completing the maze
    const congrats = [
        'A-maze-ing!',
        'Fantastic!',
        'Wowza!',
        'Alright!',
        'Killed it!',
        'Great work!',
        'Maze-sanity!',
    ];

    async function evaluateRecord() {
        if (completionTime < record) {
            setLoading(true);
            setRecord(completionTime);
            const time = Number(completionTime);
            // update record in Cloud Firestore
            await beatRecord(user.id, route.params.id, time);
            // update user info
            const updatedUser = await getUser(user.id);
            setUser(updatedUser);
            // update menu
            const updatedMazes = { ...mazes };

            updatedMazes[route.params.id] = {
                ...updatedMazes[route.params.id],
                recordHolder: user.email.slice(0, user.email.indexOf('@')),
                recordTime: time
            };

            setMazes(updatedMazes);
            await AsyncStorage.setItem('mazes', JSON.stringify(updatedMazes));
            setLoading(false);
        }
    }

    /**
     * The modal displayed after completing the maze.
     */
    function CompletionModal() {
        if (maze === null) {
            return <></>;
        }

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => { setModalVisible(!modalVisible) }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>
                            {congrats[Math.floor(Math.random() * congrats.length)]}
                        </Text>
                        <Text style={styles.modalText}>
                            You completed {name} in {completionTime} seconds
                            {completionTime < record ? " - that's the new record!" : '!'}
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                style={[styles.button, { flex: 2, backgroundColor: '#519e5e' }]}
                                onPress={async () => {
                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    await evaluateRecord();

                                    if (!(route.params.id in user.plays)) {
                                        const updatedUser = { ...user };
                                        updatedUser.plays[route.params.id] = 3;
                                        setUser(updatedUser);
                                        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                                    }

                                    if (user.plays[route.params.id] === 0) {                                 
                                        alert('Out of attempts!');
                                        setLoading(true);
                                        // TODO earn more attempts by watching an ad
                                        // navigation.navigate('Ad', { 
                                        //     id: route.params.id,
                                        //     refresh: route.params.refresh,
                                        // });
                                        navigation.navigate('Home');
                                    } else {
                                        setModalVisible(false);
                                        await buildMaze();
                                        const updatedUser = { ...user };
                                        updatedUser.plays[route.params.id]--;
                                        setUser(updatedUser);
                                        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                                        await registerPlay(user.id, route.params.id);
                                    }
                                }}
                            >
                                <FontAwesome name="undo" size={20} color="#ddd" style={{ transform: [{ scaleX: -1 }] }} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, { flex: 2, backgroundColor: '#bbb' }]}
                                onPress={async () => {
                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    await evaluateRecord();
                                    navigation.navigate('Home');
                                }}
                            >
                                <FontAwesome name="home" size={20} color="#ddd" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, { flex: 1, backgroundColor: '#bbb' }]}
                                onPress={async () => {
                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    Alert.alert('Coming soon!');
                                }}
                            >
                                <FontAwesome name="share" size={20} color="#ddd" />
                            </TouchableOpacity>
                            {
                                user.favorites.filter(favorite => favorite.id === route.params.id).length === 0 &&
                                <TouchableOpacity
                                    style={[styles.button, { flex: 1, backgroundColor: '#f7ce6f' }]}
                                    onPress={async () => {
                                        try {
                                            await setFavorite(user.id, route.params.id);
                                            const updatedUser = { ...user };
                                            updatedUser.favorites.unshift(route.params.doc);
                                            setUser(updatedUser);
                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            Alert.alert('Favorite added!');
                                        } catch (error) {
                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            Alert.alert(error.message);
                                        }
                                    }}
                                >
                                    <FontAwesome name="star" size={20} color="#ddd" />
                                </TouchableOpacity>
                            }
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    async function buildMaze() {
        setLoading(true);
        const doc = await getMaze(route.params.id);
        const loadedMaze = new Maze(Object.keys(doc.template).length);
        await loadedMaze.build(route.params.id);
        setMaze(loadedMaze);
        setName(doc.name);
        setRecord(doc.recordTime);
        loadedMaze.start = new Date().getTime();
        setLoading(false);
    }

    // construct the maze on initial render
    useEffect(() => {
        buildMaze().catch(error => {
            console.log(error);
            Alert.alert('Failed to load maze.', 'Sorry about that!');
            navigation.navigate('Home');
        });
    }, []);

    return (
        <View style={styles.container}>
            <Loading active={loading} />
            {
                !loading &&
                <View>
                    <CompletionModal />
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {name}
                        </Text>
                    </View>
                    <PlayableMaze 
                        maze={maze}
                        color={route.params.color}
                        setCompletionTime={to => { setCompletionTime(to) }}
                        showModal={to => { setModalVisible(to) }}
                    />
                    <TouchableOpacity
                        onPress={async () => {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Home');
                        }}
                        style={styles.home}
                    >
                        <FontAwesome name="home" size={48} color="#000" />
                    </TouchableOpacity>
                </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        margin: 10,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    title: {
        fontSize: 30,
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: 'bold',
    },
    back: {
        height: 48,
        alignItems: 'center',
        marginBottom: Dimensions.get('window').height / 14,
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
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
        aspectRatio: 1,
        padding: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        justifyContent: 'space-between',
        backdropFilter: 'blur(3px)',
    },
    modalHeader: {
        fontSize: 32,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    modalText: {
        fontSize: 24,
        alignSelf: 'center',
        textAlign: 'center',
    },
    home: {
        marginTop: 50,
        padding: 10,
        alignItems: 'center',
    },
    button: {
        width: '95%',
        flex: 1,
        height: 50,
        marginLeft: 5,
        marginRight: 5,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
