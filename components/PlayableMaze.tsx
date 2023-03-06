import {View, StyleSheet, Dimensions, PanResponder} from 'react-native';
import {useRef, useState} from 'react';

import Maze from '../maze/Maze';
import Space from '../maze/Space';

import PlayableSpace from './PlayableSpace';

export default function PlayableMaze(props: { maze: Maze, modal }) {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const size = Math.min(screenWidth, screenHeight) * .8 / props.maze.spaces.length;
    const spaces: any[] = [];

    // @ts-ignore
    const onPanResponderMove = (e, gestureState) => {
        const { moveX, moveY } = gestureState;
        spaces.forEach((ref) => {
            if (ref[1].current) {
                // @ts-ignore
                ref[1].current.measure((x, y, width, height, pageX, pageY) => {
                    if (moveX >= pageX && moveX <= pageX + width && moveY >= pageY && moveY <= pageY + height) {
                        ref[0]();
                    }
                });
            }
        });
    };

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove,
    });

    let key = 0;

    return (
        <View
            style={styles.maze}
            {...panResponder.panHandlers}
        >
            {props.maze.spaces.map((column: Space[]) => (
                <View key={key++} style={{ flexDirection: 'row', }}>
                    {column.map((space: Space) => (
                        <PlayableSpace
                            allSpaces={spaces}
                            key={key++}
                            space={space}
                            maze={props.maze}
                            size={size}
                            modal={props.modal}
                        />
                    ))}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
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
});
