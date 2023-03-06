import {
    View,
    StatusBar,
    StyleSheet,
    Platform,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { auth, db } from '../firebase';
import { useEffect, useState} from 'react';
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { FontAwesome } from "@expo/vector-icons";
import * as React from "react";
import { signOut } from 'firebase/auth';
import BuildScreen from './BuildScreen';
import MenuScreen from './MenuScreen';

// @ts-ignore
export default function HomeScreen({navigation}) {
    const [mazes, setMazes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState(0);

    const fetchMazes = async () => {
        setLoading(false);
        const q = query(collection(db, 'mazes'));
        const querySnapshot = await getDocs(q);
        // @ts-ignore
        const rawMazes = querySnapshot.docs.slice(0, 20);
        // @ts-ignore
        const processedMazes = [];

        for (const rawMaze of rawMazes) {
            const maze = rawMaze.data();
            maze.id = rawMaze.id;
            // @ts-ignore
            const created = Date(maze.created).split(' ');
            maze.created = `${created[1]} ${created[2]}, ${created[3]}`;
            maze.creator = await getUserEmail(maze.creator);
            maze.recordHolder = maze.recordHolder ? await getUserEmail(maze.recordHolder) : null;
            processedMazes.push(maze);
        }

        // @ts-ignore
        processedMazes.sort((a, b) =>
            a.created !== b.created ? b.created - a.created : b.plays - a.plays
        );

        setLoading(true);
        // @ts-ignore
        setMazes(processedMazes);
    }

    useEffect(fetchMazes, []);

    const getUserEmail = async (uid: string) => {
        const docRef = doc(db, 'users', uid);
        const userDoc = await getDoc(docRef);
        const userData = userDoc.data();
        // @ts-ignore
        return userData.email.slice(0, userData.email.indexOf('@'));
    };

    // @ts-ignore
    return (
        <View style={styles.container}>
            {
                tab ?
                <BuildScreen refresh={fetchMazes} /> :
                loading ?
                    <MenuScreen
                        mazes = {mazes}
                        navigation={navigation}
                        fetchMazes={fetchMazes}
                    /> :
                    <View style={{justifyContent: "center", height: Dimensions.get('window').height - 130}}>
                        <ActivityIndicator size="large" color="#000000" />
                    </View>
            }
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={ () => { setTab(0) } }
                    style={[styles.iconContainer, tab == 0 && styles.activeTab]}
                >
                    <FontAwesome name="list-ul" size={24} style={styles.icon} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={ () => { setTab(1) } }
                    style={[styles.iconContainer, tab == 1 && styles.activeTab]}
                >
                    <FontAwesome name="pencil" size={24} style={styles.icon} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => { signOut(auth); navigation.navigate("Auth"); }}
                    style={styles.iconContainer}
                >
                    <FontAwesome name="sign-out" size={24} style={styles.icon} color="#fff" />
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
        paddingTop: Platform.OS == "android" ? StatusBar.currentHeight : 30,
    },
    footer: {
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: -5
        },
        backgroundColor: '#535a78',
        width: '100%',
        fontSize: 30,
        height: 100,
        color: "white",
        fontWeight: "bold",
        paddingHorizontal: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconContainer: {
        padding: 10,
        alignItems: "center"
    },
    icon: {
        marginRight: 10,
        margin: 5,
    },
    shadow: {
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 3.84,
    },
    activeTab: {
        backgroundColor: '#2f3542',
        borderRadius: 50,
    },
});
