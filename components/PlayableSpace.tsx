import { Animated, Pressable, StyleSheet, Vibration } from 'react-native';
import Space from '../maze/Space';
import Maze from '../maze/Maze';
import { useRef, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';

export default function PlayableSpace(props: { allSpaces: any[], space: Space, maze: Maze, size: number, modal }) {
    const componentRef = useRef(null);

    const style: Object[] = [{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 1,
        borderStyle: 'solid',
    }];

    const [active, setActive] = useState(props.space.active);
    const [animation] = useState(new Animated.Value(0));

    function handleAnimate() {
        Animated.timing(animation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
        }).start();
    }

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['white', '#cbd3f7'],
    });

    style.push({
        width: props.size,
        height: props.size,
        backgroundColor: active ? backgroundColor : 'transparent',
        borderColor: active ? backgroundColor : 'transparent',
    });

    function isInBounds(index: number): boolean {
        return index > -1 && index < props.maze.spaces.length;
    }

    const borderColor = 'black';

    const leftIndex = props.space.y - 1;

    if (props.space.connected.filter(neighbor => neighbor.y === leftIndex).length === 0) {
        if (isInBounds(leftIndex)) {
            style.push({ borderLeftColor: borderColor });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderLeftColor: borderColor });
            }

            style.push({ borderLeftWidth: 2 });
        }
    }

    const rightIndex = props.space.y + 1;

    if (props.space.connected.filter(neighbor => neighbor.y === rightIndex).length === 0) {
        if (isInBounds(rightIndex)) {
            style.push({ borderRightColor: borderColor });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderRightColor: borderColor });
            }

            style.push({ borderRightWidth: 2 });
        }
    }

    const upIndex = props.space.x - 1;

    if (props.space.connected.filter(neighbor => neighbor.x === upIndex).length === 0) {
        if (isInBounds(upIndex)) {
            style.push({ borderTopColor: borderColor });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderTopColor: borderColor });
            }

            style.push({ borderTopWidth: 2 });
        }
    }

    const downIndex = props.space.x + 1;

    if (props.space.connected.filter(neighbor => neighbor.x === downIndex).length === 0) {
        if (isInBounds(downIndex)) {
            style.push({ borderBottomColor: borderColor });
        } else {
            if (props.maze.entrance !== props.space && props.maze.exit !== props.space) {
                style.push({ borderBottomColor: borderColor });
            }

            style.push({ borderBottomWidth: 2 });
        }
    }

    const [started, setStarted] = useState(false);

    function onPress() {
        if (!props.space.active &&
            (props.space.connected.filter(neighbor => neighbor.active).length !== 0 ||
            props.space === props.maze.entrance)) {
            props.space.active = true;
            // Vibration.vibrate(10); TODO subtle haptic feedback
            handleAnimate();
            setActive(true);
            setStarted(true);

            if (props.space === props.maze.exit) {
                props.maze.end = new Date();
                props.modal();
            }
        }
    }

    return (
        <Animated.View ref={componentRef} style={StyleSheet.flatten(style)}>
            <Pressable
                onLayout={() => { props.allSpaces.push({ activate: onPress, ref: componentRef, active: active }) }}
                onPress={onPress}
            >
                {
                    props.maze.entrance === props.space &&
                    !started &&
                    <FontAwesome name="star" size={20} color="#000" />
                }
            </Pressable>
        </Animated.View>
    );
}
