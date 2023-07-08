import { Alert, Animated, Dimensions, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import React, { useContext, useRef, useState } from 'react';
import BadWordsFilter from 'bad-words';
import { createMaze } from '../../firebase/functions';
import Maze from '../../models/maze';
import Space from '../../models/space';
import CanvasSpace from '../maze/CanvasSpace';
import * as Haptics from 'expo-haptics';
import { BuildTabProps } from '../../types/props';
import { UserContext } from '../../context/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import { MazeContext } from '../../context/MazeContext';
import { SpaceData } from '../maze/PlayableSpace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tab, Tool } from '../../types/enums';


export default function BuildTab(props: BuildTabProps): JSX.Element {
    const [tool, setTool] = useState<Tool>(Tool.None);
    const [red, setRed] = useState(203);
    const [green, setGreen] = useState(211);
    const [blue, setBlue] = useState(247);
    const [sizeVisible, setSizeVisible] = useState(false);
    const [paletteVisible, setPaletteVisible] = useState(false);
    const [overlayOpacity] = useState(new Animated.Value(0));
    const { user, setUser } = useContext(UserContext);
    const { maze, setMaze, sizes, history, setHistory, color, setColor } = useContext(MazeContext);
    const spaces: SpaceData[] = [];
    let last: Space = null;
    let unmodified = true;

    function showOverlay() {
        Animated.sequence([
            Animated.timing(overlayOpacity, {
                toValue: .8,
                duration: 90,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 90,
                useNativeDriver: true,
            }),
        ]).start();
    }

    function Undo(): JSX.Element {
        return (
            <TouchableOpacity
                style={styles.history}
                onPress={async () => {
                    if (history.previous.length > 0) {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        showOverlay();
                        setTimeout(() => {
                            setHistory(history.undo());
                        }, 90);
                        unmodified = true;
                        last = null;
                    }
                }}
            >
                <FontAwesome
                    name="undo"
                    size={24}
                    color={history.previous.length > 0 ? '#f5c638' : '#ccc'}
                />
            </TouchableOpacity>
        );
    }

    function Redo(): JSX.Element {
        return (
            <TouchableOpacity
                style={styles.history}
                onPress={async () => {
                    if (history.future.length > 0) {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        showOverlay();
                        setTimeout(() => {
                            setHistory(history.redo());
                        }, 90);
                        unmodified = true;
                        last = null;
                    }
                }}
            >
                <FontAwesome
                    name="undo"
                    size={24}
                    color={history.future.length > 0 ? '#f5c638' : '#ccc'}
                    style={{ transform: [{ scaleX: -1 }] }}
                />
            </TouchableOpacity>
        );
    }

    /**
     * A maze canvas component.
     * @return {JSX.Element} the rendered component
     */
    function Canvas(): JSX.Element {
        const [refresh, setRefresh] = useState(false);
        const mazeRef = useRef(null);
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        const canvasSize = Math.min(screenWidth, screenHeight) * .8;
        // reduce size to whole number for maze component for flush border layout
        const reducedSize = Math.floor( canvasSize / maze.spaces.length) * maze.spaces.length;

        const onPanResponderMove = (_, gestureState) => {
            if (tool !== Tool.None) {
                const { moveX, moveY } = gestureState;

                for (const space of spaces) {
                    if (space.ref.current && space.space !== last) {
                        space.ref.current.measure((_, __, width, height, screenX, screenY) => {
                            if (moveX >= screenX - width &&
                                moveX <= screenX + width &&
                                moveY >= screenY - height &&
                                moveY <= screenY + height) {
                                if (last !== null && maze.adjacentTo(space.space).includes(last)) {
                                    if (unmodified) {
                                        history.modify();
                                        unmodified = false;
                                    }

                                    switch (tool) {
                                        case Tool.Brush:
                                            space.space.removeEdge(last);
                                            break;
                                        case Tool.Eraser:
                                            space.space.addEdge(last);
                                            break;
                                    }
                                }

                                setRefresh(!refresh);
                                last = space.space;
                            }
                        });
                    }
                }
            }
        };

        const onPanResponderRelease = (_, __) => {
            if (last !== null) {
                last = null;
                unmodified = true;
            }
        };

        const panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove,
            onPanResponderRelease,
        });

        const marginTop = screenHeight * .1;

        return (
            <>
                <View style={[styles.historyContainer, { marginTop: marginTop }]}>
                    <Undo />
                    <Redo />
                </View>
                <View
                    style={[styles.canvas, { width: canvasSize, height: canvasSize }]}
                    {...panResponder.panHandlers}
                >
                    <View
                        style={StyleSheet.flatten([styles.maze, { width: reducedSize, height: reducedSize }])}
                        ref={mazeRef}
                    >
                        <Animated.View
                            style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: overlayOpacity }]}
                        />
                        {maze.spaces.map((column: Space[], colKey: number) => (
                            <View key={colKey * maze.spaces.length} style={{ flex: 1, flexDirection: 'row', }}>
                                {column.map((space: Space, rowKey: number) => (
                                    <CanvasSpace
                                        key={colKey * maze.spaces.length + rowKey}
                                        space={space}
                                        maze={maze}
                                        allSpaces={spaces}
                                        color={color}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </View>
            </>
        );
    }

    function NewButton(): JSX.Element {
        return (
            <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSizeVisible(true);
                }}
            >
                <FontAwesome name="file" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    }

    function RandomizeButton(): JSX.Element {
        return (
            <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    history.modify();
                    unmodified = true;
                    const newMaze = new Maze(maze.spaces.length, true);
                    showOverlay();
                    setTimeout(() => {
                        setMaze(newMaze);
                    }, 90);
                }}
            >
                <FontAwesome name="random" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    }

    function BrushButton(): JSX.Element {
        return (
            <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTool(Tool.Brush);
                }}
            >
                <FontAwesome name="paint-brush" size={24} color={tool === Tool.Brush ? '#2c4859' : '#ccc'} />
            </TouchableOpacity>
        );
    }

    function EraserButton(): JSX.Element {
        return (
            <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTool(Tool.Eraser);
                }}
            >
                <FontAwesome name="eraser" size={24} color={tool === Tool.Eraser ? '#2c4859' : '#ccc'} />
            </TouchableOpacity>
        );
    }

    function PaletteButton(): JSX.Element {
        return (
            <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaletteVisible(true);
                }}
            >
                <FontAwesome name="eyedropper" size={24} color={color} />
            </TouchableOpacity>
        );
    }

    function Size(): JSX.Element {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={sizeVisible}
                onRequestClose={() => { setSizeVisible(!sizeVisible) }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { height: '24%' }]}>
                        <Text style={styles.modalHeader}>
                            Change Size
                        </Text>
                        <View style={styles.sizes}>
                            {sizes.map((size: number) =>
                                <TouchableOpacity
                                    key={size}
                                    style={[styles.sizeButton, {
                                        backgroundColor: size === maze.spaces.length ? color : '#3e414f'
                                    }]}
                                    onPress={async () => {
                                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSizeVisible(false);
                                        history.modify();
                                        unmodified = true;
                                        const newMaze = new Maze(size);
                                        showOverlay();
                                        setTimeout(() => {
                                            setMaze(newMaze);
                                        }, 90);
                                    }}
                                >
                                    <Text style={styles.buttonText}>{size}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.cancel}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSizeVisible(false);
                            }}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    function Palette(): JSX.Element {
        const [redSlider, setRedSlider] = useState(red);
        const [greenSlider, setGreenSlider] = useState(green);
        const [blueSlider, setBlueSlider] = useState(blue);

        function toHex(int: number) {
            const hex = int.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={paletteVisible}
                onRequestClose={() => { setPaletteVisible(!paletteVisible) }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, { height: '25%', padding: 20 }]}>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={255}
                            minimumTrackTintColor="#ff0000"
                            step={1}
                            value={redSlider}
                            onValueChange={setRedSlider}
                        />
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={255}
                            minimumTrackTintColor="#00ff00"
                            step={1}
                            value={greenSlider}
                            onValueChange={setGreenSlider}
                        />
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={255}
                            minimumTrackTintColor="#0000ff"
                            step={1}
                            value={blueSlider}
                            onValueChange={setBlueSlider}
                        />
                        <TouchableOpacity
                            style={styles.submit}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                                setRed(redSlider);
                                setGreen(greenSlider);
                                setBlue(blueSlider);
                                setColor(`#${toHex(redSlider)}${toHex(greenSlider)}${toHex(blueSlider)}`);
                                setPaletteVisible(false);

                                for (const space of spaces) {
                                    space.activate();
                                }
                            }}
                        >
                            <Text style={styles.buttonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    function Submit(): JSX.Element {
        return (
            <TouchableOpacity
                style={[styles.submit, styles.shadow]}
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                    Alert.prompt(
                        'Name:',
                        '',
                        async input => {
                            if (input.length > 21) {
                                Alert.alert('Please only use 21 characters or less.');
                                return;
                            }

                            if (/^[a-zA-Z0-9\s]+$/.test(input)) {
                                await handlePress(input.trim());
                            } else {
                                Alert.alert('Please only use alphanumeric characters.');
                            }

                            const filter = new BadWordsFilter();

                            for (let i = 0; i < input.length; i++) {
                                for (let j = i; j <= input.length; j++) {
                                    if (filter.isProfane(input.slice(i, j))) {
                                        Alert.alert('Please do not include inappropriate language.');
                                        return;
                                    }
                                }
                            }
                        },
                        'plain-text',
                        'My Maze',
                    );
                }}
            >
                <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
        );
    }

    /**
     * Verifies and uploads the maze on the canvas.
     * @param name the maze's name
     */
    async function handlePress(name: string) {
        try {
            if (!maze.isValid()) {
                Alert.alert('Invalid maze!', 'There should be one path to each space from the entrance.');
                return;
            }

            props.setLoading(true);
            const doc = await createMaze(name, user.id, color, maze.getTemplate());
            const newUser = { ...user };
            newUser.mazes.unshift(doc);
            setUser(newUser);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            props.setLoading(false);
            Alert.alert('Upload successful!');
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
        } catch (error) {
            Alert.alert('Could not post your maze...sorry about that.');
            props.setLoading(false);
        }
    }

    return (
        <View style={[styles.container, { display: props.tab === Tab.Build ? 'flex' : 'none' }]}>
            <Canvas />
            <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <NewButton />
                <RandomizeButton />
                <BrushButton />
                <EraserButton />
                <PaletteButton />
                <Size />
                <Palette />
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Submit />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        justifyContent: 'center',
        marginBottom: 50,
    },
    input: {
        color: '#000',
        fontWeight: 'bold',
        margin: 25,
        textShadowOffset: {
            width: 2,
            height: 2
        },
        textShadowRadius: 3,
        height: 30,
        fontSize: 30,
        textAlign: 'center',
    },
    button: {
        borderRadius: 5,
        padding: 10,
        marginHorizontal: 10,
        textShadowColor: '#000',
        textShadowOffset: {
            width: 2,
            height: 2
        },
        textShadowRadius: 3,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 0
        },
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancel: {
        borderRadius: 5,
        padding: 10,
        marginHorizontal: 10,
        textShadowColor: '#000',
        textShadowOffset: {
            width: 2,
            height: 2
        },
        backgroundColor: 'rgba(234, 67, 67, 0.9)',
        height: 50,
        width: '97.5%',
        textShadowRadius: 3,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 0
        },
        alignItems: 'center',
        justifyContent: 'center',
    },
    sizes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        alignItems: 'center'
    },
    sizeButton: {
        borderRadius: 5,
        padding: 2,
        marginHorizontal: 5,
        textShadowColor: '#000',
        textShadowOffset: {
            width: 2,
            height: 2
        },
        textShadowRadius: 3,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 0
        },
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
    },
    modalHeader: {
        fontSize: 32,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    modalText: {
        color: '#f54d4d',
        fontWeight: '600',
        fontSize: 22,
        alignSelf: 'center',
        textAlign: 'center',
    },
    submit: {
        backgroundColor: '#4caf50',
        borderRadius: 5,
        padding: 10,
        margin: 5,
        marginTop: 0,
        flex: 3.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadow: {
        shadowColor: '#000',
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 3.84,
        hover: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sizeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    historyContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    history: {
        borderRadius: 5,
        padding: 10,
        marginLeft: 20,
        textShadowColor: '#000',
        textShadowOffset: {
            width: 2,
            height: 2
        },
        textShadowRadius: 3,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 0
        },
        alignItems: 'center',
        justifyContent: 'center',
    },
    slider: { 
        width: '90%', 
        alignSelf: 'center',
    },
    overlay: {
        backgroundColor: '#fff',
        borderColor: '#000',
        borderWidth: 0,
        zIndex: 1,
    },
    canvas: {
        marginTop: 20,
        alignSelf: 'center',
    }
});
