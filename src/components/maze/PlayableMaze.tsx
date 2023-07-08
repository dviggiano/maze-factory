import { View, StyleSheet, Dimensions, PanResponder } from 'react-native';
import Space from '../../models/space';
import PlayableSpace, { SpaceData } from './PlayableSpace';
import { PlayableMazeProps } from '../../types/props';
import React from 'react';

/**
 * A playable maze component.
 * @param {Maze} props.maze data model of the maze
 * @param {string} props.color color of active spaces
 * @param {(show: boolean) => void} props.showModal
 *        function to toggle the parent screen's modal
 * @return {JSX.Element} the rendered component
 */
export default function PlayableMaze(props: PlayableMazeProps): JSX.Element {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const containerSize = Math.min(screenWidth, screenHeight) * .8;
    // reduce size to whole number for maze component for flush border layout
    const reducedSize = Math.floor(containerSize / props.maze.spaces.length) * props.maze.spaces.length;
    const spaces: SpaceData[] = [];

    /**
     * Defines how spaces should be triggered upon a user's drag.
     */
    const onPanResponderMove = (_, gestureState) => {
        const { moveX, moveY } = gestureState;
        
        // activate each space within range of the user's drag
        for (const space of spaces) {
            if (!space.space.active && space.ref.current) {
                space.ref.current.measure((_, __, width, height, screenX, screenY) => {
                    if (moveX >= screenX - width * .1 &&
                        moveX <= screenX + width * 1.1 &&
                        moveY >= screenY - height * .1 &&
                        moveY <= screenY + height * 1.1) {
                        space.activate();
                    }
                });
            }
        }
    };

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove,
    });

    return (
        <View
            style={{ alignSelf: 'center', width: containerSize, height: containerSize }}
            {...panResponder.panHandlers}
        >
            <View style={{...styles.maze, width: reducedSize, height: reducedSize }}>
                {props.maze.spaces.map((column: Space[], colKey: number) => (
                    <View key={colKey * props.maze.spaces.length} style={{ flex: 1, flexDirection: 'row', }}>
                        {column.map((space: Space, rowKey: number) => (
                            <PlayableSpace
                                allSpaces={spaces}
                                key={colKey * props.maze.spaces.length + rowKey}
                                space={space}
                                maze={props.maze}
                                setCompletionTime={props.setCompletionTime}
                                showModal={props.showModal}
                                color={props.color}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
});
