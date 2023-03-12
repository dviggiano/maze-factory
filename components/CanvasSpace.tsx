import { StyleSheet, View } from 'react-native';
import { useRef } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import Space from '../maze/Space';
import Maze from '../maze/Maze';

export default function CanvasSpace(props: { space: Space, maze: Maze, size: number }) {
    const componentRef = useRef(null);

    const style: Object[] = [{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 1,
        borderStyle: 'solid',
    }];

    style.push({
        width: props.size,
        height: props.size,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    });

    function isInBounds(index: number): boolean {
        return index > -1 && index < props.maze.spaces.length;
    };

    const borderColor = 'black';

    const leftIndex = props.space.y - 1;

    if (props.space.connected.filter(neighbor => neighbor.y === leftIndex).length === 0) {
        if (isInBounds(leftIndex)) {
            style.push({ borderLeftColor: borderColor, });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderLeftColor: borderColor, });
            }

            style.push({ borderLeftWidth: 2, });
        }
    }

    const rightIndex = props.space.y + 1;

    if (props.space.connected.filter(neighbor => neighbor.y === rightIndex).length === 0) {
        if (isInBounds(rightIndex)) {
            style.push({ borderRightColor: borderColor, });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderRightColor: borderColor, });
            }

            style.push({ borderRightWidth: 2, });
        }
    }

    const upIndex = props.space.x - 1;

    if (props.space.connected.filter(neighbor => neighbor.x === upIndex).length === 0) {
        if (isInBounds(upIndex)) {
            style.push({ borderTopColor: borderColor, });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderTopColor: borderColor, });
            }

            style.push({ borderTopWidth: 2, });
        }
    }

    const downIndex = props.space.x + 1;

    if (props.space.connected.filter(neighbor => neighbor.x === downIndex).length === 0) {
        if (isInBounds(downIndex)) {
            style.push({ borderBottomColor: borderColor, });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderBottomColor: borderColor, });
            }

            style.push({ borderBottomWidth: 2, });
        }
    }
    
    const entranceOrExit = [props.maze.entrance, props.maze.exit].includes(props.space);

    return (
        <View style={StyleSheet.flatten(style)}>
            {
                [props.maze.entrance, props.maze.exit].includes(props.space) &&
                <FontAwesome name="star" size={20} color="#000" />
            }
        </View>
    );
}
