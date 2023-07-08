import { View, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import SpaceBorders from './SpaceBorders';
import { CanvasSpaceProps } from '../../types/props';
import Space from '../../models/space';
import Maze from '../../models/maze';
import React, { useRef, useState } from 'react';

/**
 * A space component within a maze canvas.
 * @param {Space} props.space data model of the space
 * @param {Maze} props.maze data model of the parent maze
 * @return {JSX.Element} the rendered component
 */
export default function CanvasSpace(props: CanvasSpaceProps): JSX.Element {
    const [active, setActive] = useState(false);
    const [animation] = useState(new Animated.Value(0));
    const ref = useRef(null);

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['#fff', props.color],
    });

    const style: Object = {
        backgroundColor: active ? backgroundColor : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        aspectRatio: 1,
        width: '100%',
        height: '100%',
    };

    function handleAnimate() {
        setActive(true);
        Animated.timing(animation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        Animated.timing(animation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
        setActive(false);
    }

    return (
        <View ref={ref}>
            <Animated.View
                style={style}
                onLayout={() => {
                    props.allSpaces.push({
                        ref: ref,
                        space: props.space,
                        activate: handleAnimate
                    });
                }}
            >
                {
                    [props.maze.entrance, props.maze.exit].includes(props.space) &&
                    <FontAwesome name="star" size={20} color="#000" />
                }
                <SpaceBorders space={props.space} maze={props.maze} />
            </Animated.View>
        </View>
    );
}