import { Animated, Easing, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import SpaceBorders from './SpaceBorders';
import { PlayableSpaceProps } from '../../types/props';
import Space from '../../models/Space';
import React from 'react';

// TODO add these attributes to Space class
/**
 * Data corresponding to a space in a playable maze
 * to allow the maze to activate spaces on drag action.
 */
export interface SpaceData {
    activate: Function; // function to simulate a press on the space
    ref: MutableRefObject<any>; // reference to the space component
    space: Space; // space data
}

export default function PlayableSpace(props: PlayableSpaceProps): JSX.Element {
    // reference is stored to send to parent maze
    // so that it can be triggered on drag action
    const ref = useRef(null);
    // whether the maze has been started
    const [started, setStarted] = useState(false);
    // whether the space has been activated
    const [active, setActive] = useState(props.space.active);
    const [backgroundAnimation] = useState(new Animated.Value(0));
    const [starAnimation] = useState(new Animated.Value(1));

    const backgroundColor = backgroundAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['#fff', props.color],
    });

    const starSize = starAnimation.interpolate({
        inputRange: [1, 1.5],
        outputRange: [1, 1.5],
    });

    const containerStyle: Object = {
        flex: 1,
        aspectRatio: 1,
    };

    const backgroundStyle: Object = {
        backgroundColor: active ? backgroundColor : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    };

    useEffect(() => {
        if (props.maze.entrance === props.space && !started) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(starAnimation, {
                        toValue: 1.5,
                        duration: 300,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(starAnimation, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        }
    }, [started]);

    function handleAnimate() {
        Animated.timing(backgroundAnimation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }

    async function onPress() {
        if (!props.space.active &&
            (props.space.connected.some(neighbor => neighbor.active) ||
            props.space === props.maze.entrance)) {
            props.space.active = true;
            setActive(true);
            setStarted(true);
            handleAnimate();

            if (props.space === props.maze.exit) {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                props.maze.end = new Date().getTime();
                const completion = ((props.maze.end - props.maze.start) / 1000).toFixed(2);
                props.setCompletionTime(completion);
                props.showModal(true);
            } else {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    }

    return (
        <Pressable
            style={containerStyle}
            onLayout={() => {
                props.allSpaces.push({
                    activate: onPress,
                    ref: ref,
                    space: props.space
                });
            }}
            onPress={onPress}
        >
            <Animated.View ref={ref} style={backgroundStyle}>
                {
                    props.maze.entrance === props.space && !started &&
                    <Animated.View style={{ transform: [{ scale: starSize }] }}>
                        <FontAwesome name="star" size={16} color="#000" />
                    </Animated.View>
                }
            </Animated.View>
            <SpaceBorders space={props.space} maze={props.maze} />
        </Pressable>
    );
}
