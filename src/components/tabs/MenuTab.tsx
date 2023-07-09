import { ScrollView, Text, View, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useContext, useState } from 'react';
import { registerPlay, searchMazes } from '../../firebase/functions';
import { MazeDocument } from '../../types/firebase';
import { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuTabProps } from '../../types/props';
import { UserContext } from '../../context/UserContext';
import { MenuContext } from '../../context/MenuContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tab } from '../../types/enums';

export default function MenuTab(props: MenuTabProps): JSX.Element {
    const [menuItems, setMenuItems] = useState([]);
    const { user, setUser } = useContext(UserContext);
    const { mazes } = useContext(MenuContext);

    function SearchTool(): JSX.Element {
        const [search, setSearch] = useState('');
        const [lastSearched, setLastSearched] = useState('');

        async function submitSearch() {
            if (search === '') {
                props.setDefaultResults(true);
                setLastSearched('');
                setMenuItems([]);
            } else {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                let newResults;

                if (lastSearched !== '' && search.includes(lastSearched)) {
                    newResults = menuItems.filter(maze => maze.name.toLowerCase().includes(search.toLowerCase()));
                } else {
                    try {
                        props.setLoading(true);
                        newResults = await searchMazes(search);
                        props.setLoading(false);
                    } catch (error) {
                        Alert.alert(error.message);
                        setLastSearched('');
                        setSearch('');
                        setMenuItems([]);
                    }
                }

                props.setDefaultResults(false);
                setMenuItems(newResults);
                setLastSearched(search);
            }
        }

        return (
            <View style={styles.searchContainer}>
                <View style={styles.search}>
                    <TextInput
                        style={styles.input}
                        placeholder="Search..."
                        placeholderTextColor="#aaa"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={submitSearch}
                    />
                    <TouchableOpacity onPress={submitSearch}>
                        <FontAwesome
                            name="search"
                            size={20}
                            color="#aaa"
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        props.failed && Object.keys(mazes).length === 0 ?
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', alignSelf: 'center' }}>
                Failed to load mazes.
            </Text>
            <Text style={{ marginTop: 15, fontSize: 20, alignSelf: 'center' }}>
                Sorry about that! Try again later.
            </Text>
        </View> :
        <View style={[styles.container, { display: props.tab === Tab.Menu ? 'flex' : 'none' }]}>
            <SearchTool />
            {
                menuItems.length > 0 || props.defaultResults ?
                    <ScrollView
                        style={styles.menu}
                        refreshControl={
                            <RefreshControl
                                refreshing={props.loading}
                                onRefresh={async () => {
                                    props.setLoading(true);
                                    await props.refresh().catch((_) => { props.fail() });
                                    props.setDefaultResults(true);
                                    setMenuItems([]);
                                    props.setLoading(false);
                                }}
                            />
                        }
                    >
                        {(props.defaultResults ? Object.values(mazes) : menuItems).map((maze: MazeDocument, key: number) =>
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
                                                    const updatedUser = {...user};
                                                    updatedUser.plays[maze.id]--;
                                                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                                                    setUser(updatedUser);
                                                } else {
                                                    const updatedUser = {...user};
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
                                                    <FontAwesome name="trophy" size={16} color="#888" />
                                                    &nbsp; {maze.recordTime}s <Text style={{ fontSize: 14 }}>({maze.recordHolder})</Text>
                                                </Text>
                                            }
                                            <Text style={styles.creator}>
                                                Created: {maze.created && maze.created + '\n'}by {maze.creator}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.line}/>
                                    <View style={{ flexDirection: 'row' }}>
                                        {
                                            key < 3 && props.defaultResults && maze.plays > 0 &&
                                            <View style={styles.popularContainer}>
                                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                                    <Text style={{ textAlign: 'left', fontSize: 11 }}>
                                                        🔥&nbsp;
                                                    </Text>
                                                    <Text style={styles.popular}>
                                                        Popular
                                                    </Text>
                                                </View>
                                            </View>
                                        }
                                        <Text
                                            style={[styles.attempts, { color: maze.id in user.plays && user.plays[maze.id] === 0 ? '#ed1d0e' : '#666' }]}>
                                            Attempts remaining: {maze.id in user.plays ? user.plays[maze.id] : 3}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        <View style={{ height: 140 }} />
                    </ScrollView> :
                    <Text style={styles.none}>No matches!</Text>
            }
            <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: .5 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 30,
        width: '100%',
        height: '100%',
    },
    searchContainer: {
        paddingTop: 34,
        paddingBottom: 24,
        width: '95%',
        alignSelf: 'center',
        borderColor: '#666',
        borderBottomWidth: 1,
    },
    search: {
        borderColor: '#666',
        borderWidth: 1,
        flexDirection: 'row',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    input: {
        color: '#777',
        fontSize: 18,
        overflow: 'hidden',
        width: '95%',
    },
    menu: {
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
    icon: {
        marginRight: 10,
        margin: 5,
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
    creator: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'right',
    },
    popularContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
    },
    popular: {
        textAlign: 'left',
        fontSize: 14,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 217, 201, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        color: '#fa7b48'
    },
    attempts: {
        textAlign: 'right',
        flex: 3,
        fontSize: 14,
    },
    line: {
        borderBottomColor: '#ddd',
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginVertical: 8,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 85,
        zIndex: 1,
    },
    none: {
        alignSelf: 'center',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 25,
        textAlign: 'center',
    },
});