import { useEffect, useState } from 'react';
import Maze from '../maze/Maze';
import {
    View,
    Modal,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import PlayableMaze from '../components/PlayableMaze';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FontAwesome } from '@expo/vector-icons';

export default function PlayScreen({ navigation, route }) {
    const [maze, setMaze] = useState<Maze | null>(null);
    const [name, setName] = useState(null);
    const [record, setRecord] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const congrats = [
        'A-maze-ing!',
        'Fantastic!',
        'Wowza!',
        'Alright!',
        'Killed it!',
        'Great work!',
        'Maze-sanity!'
    ];

    function CompletionModal() {
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
                            You completed {name} in {((maze.end - maze.start) / 1000).toFixed(2)} seconds
                            {((maze.end - maze.start) / 1000).toFixed(2) < record ? " - that's the new record!" : '!'}
                        </Text>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                if (((maze.end - maze.start) / 1000).toFixed(2) < record) {
                                    updateDoc(doc(db, 'mazes', route.params.id), {
                                        recordTime: Number(((maze.end - maze.start) / 1000).toFixed(2)),
                                        recordHolder: auth.currentUser.uid
                                    });
                                }

                                route.params.refresh();
                                navigation.navigate('Home');
                            }}>
                            <Text style={styles.buttonText}>Return</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    async function buildMaze() {
        try {
            const docRef = doc(db, 'mazes', route.params.id);
            const docSnap = await getDoc(docRef);
            const docData = docSnap.data()!;
            const loadedMaze = new Maze(Object.keys(docData.template).length);
            await loadedMaze.build(route.params.id);
            setMaze(loadedMaze);
            setName(docData.name);
            setRecord(docData.recordTime);
            loadedMaze.start = new Date();
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => { buildMaze() }, []);

    return (
        <View style={styles.maze}>
        {maze ?
            <View>
                <CompletionModal />
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {name}
                    </Text>
                </View>
                <PlayableMaze maze={maze} modal={setModalVisible} />
                <TouchableOpacity
                    onPress={() => { navigation.navigate('Home') }}
                    style={{marginTop: 50, padding: 10, alignItems: "center"}}
                >
                    <FontAwesome name="home" size={48} color="#000" />
                </TouchableOpacity>
            </View> : 
            <ActivityIndicator size="large" color="#000000" />}
        </View>
    );
}

const styles = StyleSheet.create({
    maze: {
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
        fontWeight: "bold",
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
    button: {
        width: '95%',
        height: 50,
        backgroundColor: '#535a78',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
