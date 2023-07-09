import React from 'react';
import { useEffect } from 'react';
import { View, Modal, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { LoadingProps } from '../types/props';

// TODO make this use an animated icon of a circular mini maze

/**
 * A loading indicator component.
 * @return {JSX.Element} the rendered component
 */
export default function Loading(props: LoadingProps): JSX.Element {
    const animation = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(animation, {
            toValue: props.active ? 1 : 0,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, [props.active]);

    return (
        <Modal visible={props.active} transparent>
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.modal,
                        {
                            opacity: animation,
                            transform: [
                                {
                                    scale: animation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <ActivityIndicator size="large" color="#aaa" />
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 14,
        paddingLeft: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
