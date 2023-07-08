import { View, StatusBar, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { getMazes } from '../firebase/functions';
import BuildTab from '../components/tabs/BuildTab';
import MenuTab from '../components/tabs/MenuTab';
import UserTab from '../components/tabs/UserTab';
import * as Haptics from 'expo-haptics';
import Loading from '../components/Loading';
import { MenuContext } from '../context/MenuContext';
import React from 'react';
import { MazeCollection, MazeDocument } from '../types/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tab } from '../types/enums';

/**
 * The home screen, which contains the maze selection menu and the maze builder.
 * @return {JSX.Element} the rendered screen
 */
export default function HomeScreen({ navigation }): JSX.Element {
    const [failed, setFailed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [defaultResults, setDefaultResults] = useState<boolean>(true);
    const [tab, setTab] = useState<Tab>(Tab.Menu);
    const { mazes, setMazes } = useContext(MenuContext);

    /**
     * Updates the menu's maze options by querying Cloud Firestore.
     */
    async function fetchMazes() {
        const storage = await AsyncStorage.getItem('mazes');

        if (storage === null) {
            setLoading(true);
        } else {
            setMazes(JSON.parse(storage));
        }

        const docs = await getMazes();

        // TODO this might be redundant at this point; keys might no longer be needed
        const updatedMazes = docs.reduce((collection: MazeCollection, doc: MazeDocument) => {
            collection[doc.id] = doc;
            return collection;
        }, {});

        if (storage === null) {
            setMazes(updatedMazes);
            setLoading(false);
        } else {
            setLoading(true);
            setTimeout(() => {
                setMazes(updatedMazes);
                setLoading(false);
            }, 500);
        }

        await AsyncStorage.setItem('mazes', JSON.stringify(updatedMazes));
    }

    // fetch mazes on initial render
    useEffect(() => {
        fetchMazes().catch(error => { 
            console.log(error);
            setFailed(true);
        });
    }, []);

    return (
        <View style={styles.container}>
            <Loading active={loading} />
            <MenuTab
                navigation={navigation}
                refresh={fetchMazes}
                loading={loading}
                setLoading={to => { setLoading(to) }}
                defaultResults={defaultResults}
                setDefaultResults={to => { setDefaultResults(to) }}
                failed={failed}
                fail={() => { setFailed(true) }}
                tab={tab}
            />
            <BuildTab setLoading={to => { setLoading(to) }} tab={tab} />
            <UserTab
                navigation={navigation}
                refresh={fetchMazes}
                fail={() => { setFailed(true) }}
                setLoading={to => { setLoading(to) }}
                tab={tab}
            />
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.iconContainer, tab === Tab.Menu && styles.activeTab]}
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDefaultResults(true);
                        setTab(Tab.Menu);
                    }}
                >
                    <FontAwesome name="list-ul" size={24} style={styles.icon} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconContainer, tab === Tab.Build && styles.activeTab]}
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTab(Tab.Build);
                    }}
                >
                    <FontAwesome name="pencil" size={24} style={styles.icon} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconContainer, tab === Tab.User && styles.activeTab]}
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTab(Tab.User);
                    }}
                >
                    <FontAwesome name="user" size={24} style={styles.icon} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        paddingTop: Platform.OS == 'android' ? StatusBar.currentHeight : 30,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 0
        },
        backgroundColor: '#535a78',
        width: '85%',
        fontSize: 30,
        height: 80,
        marginHorizontal: 10,
        marginTop: 15,
        marginBottom: 25,
        borderRadius: 25,
        color: '#fff',
        fontWeight: 'bold',
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconContainer: {
        padding: 10,
        alignItems: 'center',
    },
    icon: {
        margin: 5,
    },
    activeTab: {
        backgroundColor: '#41465e',
        borderRadius: 15,
    },
    tab: {
        justifyContent: 'center',
        textAlign: 'center',
    },
});
