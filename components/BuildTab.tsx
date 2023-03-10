import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useState } from 'react';
import ProfanityFilter from 'bad-words';
import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Maze from '../maze/Maze';
import Space from '../maze/Space';
import CanvasSpace from './CanvasSpace';
import * as Haptics from 'expo-haptics';

export default function BuildTab(props) {
    const [maze, setMaze] = useState(new Maze(7, true));
    const sizes = [5, 6, 7, 8, 9, 10];

    function Canvas() {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        const spaceSize = Math.min(screenWidth, screenHeight) * .8 / maze.spaces.length;

        let key = 0;

        return (
            <TouchableOpacity
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMaze(new Maze(sizes[Math.floor(Math.random() * sizes.length)], true));
                }}
                style={styles.maze}
            >
                {maze.spaces.map((column: Space[]) => (
                    <View key={key++} style={{ flexDirection: 'row', }}>
                        {column.map((space: Space) => (
                            <CanvasSpace
                                key={key++}
                                space={space}
                                maze={maze}
                                size={spaceSize}
                            />
                        ))}
                    </View>
                ))}
            </TouchableOpacity>
        );
    }

    async function handlePress(name) {
        try {
            if (!maze.isValid()) {
                throw new Error();
            }

            await setDoc(doc(collection(db, 'mazes')), {
                name: name,
                recordTime: Infinity,
                plays: 0,
                recordHolder: null,
                creator: auth.currentUser.uid,
                created: Date.now(),
                template: maze.getTemplate()
            });

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Alert.alert('Upload successful!');

            await props.refresh().catch(_ => { props.fail(true) });
        } catch (error) {
            Alert.alert('Could not post your maze...sorry about that.');
        }
    }

    return (
        <View style={{ height: Dimensions.get('window').height - 130, justifyContent: 'center' }}>
            <Canvas />
            <View style={{flexDirection: 'row', marginTop: 5}}>
                <TouchableOpacity
                    style={[styles.button, styles.shadow]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                        Alert.prompt(
                            'Name:',
                            '',
                            async (input) => {
                                const filter = new ProfanityFilter();

                                for (let i = 0; i < input.length; i++) {
                                    for (let j = i; j <= input.length; j++) {
                                        if (filter.isProfane(input.slice(i, j))) {
                                            Alert.alert('Please do not include inappropriate language.');
                                            return;
                                        }
                                    }
                                }

                                if (/^[a-zA-Z0-9\s]+$/.test(input)) {
                                    await handlePress(input.trim());
                                } else {
                                    Alert.alert('Please enter only alphanumeric characters.');
                                }
                            },
                            'plain-text',
                            'My Maze',
                        );
                    }}
                >
                    <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: '#e64d43',
        borderRadius: 5,
        color: 'white',
        fontWeight: 'bold',
        flex: 2.5,
        margin: 5,
        fontSize: 18,
        textAlign: 'center',
        padding: 10
    },
    button: {
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        padding: 10,
        margin: 5,
        flex: 3.5,
        alignItems: 'center',
    },
    shadow: {
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 3.84,
        hover: 5,
    },
    maze: {
        aspectRatio: 1,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 3.84,
        hover: 5,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
