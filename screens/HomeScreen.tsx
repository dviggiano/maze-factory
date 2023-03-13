import {
    View,
    Text,
    StatusBar,
    StyleSheet,
    Platform,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import BuildTab from '../components/BuildTab';
import MenuTab from '../components/MenuTab';

export default function HomeScreen({ navigation }) {
    const [mazes, setMazes] = useState([]);
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);

    async function fetchMazes() {
        setLoading(true);
        const q = query(collection(db, 'mazes'));
        const querySnapshot = await getDocs(q);
        const rawMazes = querySnapshot.docs;

        // TODO figure out a better way to format this
        rawMazes.sort((a, b) => {
            // @ts-ignore
            a = a.data(); b = b.data();
            // @ts-ignore
            return a.created !== b.created ? b.created - a.created : b.plays - a.plays;
        });

        const processedMazes = [];

        for (let i = 0; i < Math.min(rawMazes.length, 25); i++) {
            const maze = rawMazes[i].data();
            const created = new Date(maze.created).toLocaleDateString();

            maze.created = created === 'Invalid Date' ? null : created;
            maze.id = rawMazes[i].id;
            maze.creator = await getUserEmail(maze.creator);
            maze.recordHolder = maze.recordHolder ? await getUserEmail(maze.recordHolder) : null;

            processedMazes.push(maze);
        }

        setLoading(false);
        setMazes(processedMazes);
    }

    async function getUserEmail(uid: string) {
        const docRef = doc(db, 'users', uid);
        const userDoc = await getDoc(docRef);
        const userData = userDoc.data();
        return userData.email.slice(0, userData.email.indexOf('@'));
    }

    useEffect(() => { fetchMazes().catch(_ => { setFailed(true) }) }, []);

    // @ts-ignore
    return (
        <View style={styles.container}>
            {
                tab ?
                <BuildTab refresh={fetchMazes} /> :
                loading ?
                    <View style={styles.tab}>
                        <ActivityIndicator size="large" color="#000000" />
                    </View> :
                    failed ?
                        <View style={styles.tab}>
                            <Text style={{ fontSize: 32, fontWeight: 'bold', alignSelf: 'center' }}>
                                Failed to load mazes.
                            </Text>
                            <Text style={{ marginTop: 15, fontSize: 20, alignSelf: 'center' }}>
                                Sorry about that! Try again later.
                            </Text>
                        </View>
                        : <MenuTab
                            mazes={mazes}
                            navigation={navigation}
                            refresh={fetchMazes}
                            loading={loading}
                            onRefresh={async () => {
                                setLoading(true);
                                await fetchMazes();
                                setLoading(false);
                            }}
                        />
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
                    onPress={() => { signOut(auth); navigation.navigate('Auth'); }}
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
        paddingTop: Platform.OS == 'android' ? StatusBar.currentHeight : 30,
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
        color: '#fff',
        fontWeight: 'bold',
        paddingHorizontal: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconContainer: {
        padding: 10,
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
        margin: 5,
    },
    shadow: {
        shadowColor: '#000',
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
    tab: {
        justifyContent: 'center',
        textAlign: 'center',
        height: Dimensions.get('window').height - 130,
    },
});
