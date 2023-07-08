import { View, StyleSheet } from 'react-native';
import { SpaceBordersProps } from '../../types/props';
import Space from '../../models/space';
import Maze from '../../models/maze';
import React from 'react';

/**
 * Applies borders to a space component.
 * @param {Space} props.space data modal of the space
 * @param {Maze} props.maze data model of the parent maze
 * @return {JSX.Element} the rendered component
 */
export default function SpaceBorders(props: SpaceBordersProps): JSX.Element {
    function isInBounds(index: number): boolean {
        return index > -1 && index < props.maze.spaces.length;
    }

    const borderColor = '#000';
    const notEntranceOrExit = props.maze.entrance !== props.space && props.maze.exit !== props.space;
    
    const leftIndex = props.space.y - 1;
    const rightIndex = props.space.y + 1;
    const upIndex = props.space.x - 1;
    const downIndex = props.space.x + 1;

    const topBorder = !props.space.connected.some(neighbor => neighbor.x === upIndex);
    const bottomBorder = !props.space.connected.some(neighbor => neighbor.x === downIndex);
    const leftBorder = !props.space.connected.some(neighbor => neighbor.y === leftIndex);
    const rightBorder = !props.space.connected.some(neighbor => neighbor.y === rightIndex);

    const styles: Object[] = [{
        margin: -1,
        borderStyle: 'solid',
        borderColor: 'transparent',
        position: 'absolute',
        width: '100%',
        height: '100%'
    }];

    if (topBorder) {
        if (isInBounds(upIndex)) {
            styles.push({ 
                borderTopColor: borderColor,
                borderTopWidth: 1
            });
        } else {
            if (notEntranceOrExit) {
                styles.push({ 
                    borderTopColor: borderColor 
                });
            }

            styles.push({ 
                borderTopWidth: 2
            });
        }
    }

    if (bottomBorder) {
        if (isInBounds(downIndex)) {
            styles.push({ 
                borderBottomColor: borderColor,
                borderBottomWidth: 1
            });
        } else {
            if (notEntranceOrExit) {
                styles.push({ 
                    borderBottomColor: borderColor
                });
            }

            styles.push({ 
                borderBottomWidth: 2
            });
        }
    }

    if (leftBorder) {
        if (isInBounds(leftIndex)) {
            styles.push({ 
                borderLeftColor: borderColor,
                borderLeftWidth: 1
            });
        } else {
            if (notEntranceOrExit) {
                styles.push({
                    borderLeftColor: borderColor
                });
            }

            styles.push({
                borderLeftWidth: 2
            });
        }
    }

    if (rightBorder) {
        if (isInBounds(rightIndex)) {
            styles.push({ 
                borderRightColor: borderColor,
                borderRightWidth: 1
            });
        } else {
            if (notEntranceOrExit) {
                styles.push({ 
                    borderRightColor: borderColor
                });
            }

            styles.push({ 
                borderRightWidth: 2
            });
        }
    }

    return <View style={StyleSheet.flatten(styles)} />;
}