import { useContext, useEffect, useRef, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, Modal, View } from 'react-native';
import ProfanityFilter from 'bad-words';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, createUser, getUser } from '../firebase/functions';
import { UserDocument } from '../types/firebase';
import { onAuthStateChanged } from 'firebase/auth/react-native';
import * as Haptics from 'expo-haptics';
import Loading from '../components/Loading';
import { UserContext } from '../context/UserContext';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Info } from '../types/enums';
import InfoContent from '../components/InfoContent';

const logo = require('../assets/logo.png');

/**
 * The default screen, which allows users to log in or create an account.
 * @return {JSX.Element} the rendered screen
 */

export default function AuthScreen({ navigation }): JSX.Element {
    const [notCreatingUser, setNotCreatingUser] = useState(true);
    const [info, setInfo] = useState(Info.TermsOfUse);
    const [infoVisible, setInfoVisible] = useState(false);
    AsyncStorage.getItem('agreed').then(agreed => { setInfoVisible(agreed === null); });
    const fadeIn = useRef(new Animated.Value(0)).current;
    const { setUser } = useContext(UserContext);

    function InfoModal() {
        const [understand, setUnderstand] = useState(false);

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={infoVisible}
                onRequestClose={() => {
                    setInfoVisible(!infoVisible);
                }}
            >
                <View style={styles.infoContainer}>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoHeader}>
                            {
                                info === Info.TermsOfUse ?
                                    'Terms of Use' :
                                    'Privacy Policy'
                            }
                        </Text>
                        <InfoContent info={info} understand={() => { setUnderstand(true); }} />
                        <TouchableOpacity
                            style={[styles.closeInfo, { backgroundColor: understand ? '#4caf50' : '#ddd' }]}
                            onPress={async () => {
                                if (understand) {
                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                                    if (info === Info.TermsOfUse) {
                                        setUnderstand(false);
                                        setInfo(Info.PrivacyPolicy);
                                    } else {
                                        await AsyncStorage.setItem('agreed', 'true');
                                        setInfoVisible(false);
                                    }
                                }
                            }}
                        >
                            <Text style={styles.buttonText}>I Understand</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        )
    }

    async function signIn(uid: string) {
        const doc = await getUser(uid);
        setUser(doc);
        await AsyncStorage.setItem('user', JSON.stringify(doc));
    }

    useEffect(() => {
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        
        // navigate to the home page if a user is logged in already
        return onAuthStateChanged(auth, async userState => {
            if (notCreatingUser) {
                try {
                    const storage = JSON.parse(await AsyncStorage.getItem('user'));

                    if (storage && userState && storage.id === userState.uid) {
                        setUser(storage);
                    }

                    if (userState) {
                        await signIn(userState.uid);
                        navigation.navigate('Home');
                    }
                } catch (error) {
                    // TODO warn could not load user data
                }
            }
        });
    }, [fadeIn]);

    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Attempts to sign in a user.
     */
    async function handleSignIn() {
        setLoading(true);

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (!email || !password) {
            alert('Please enter an email and password.');
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            await signIn(auth.currentUser.uid);
            setLoading(false);
            navigation.navigate('Home');
        } catch (error) {
            console.log(error);
            Alert.alert('Could not sign you in!', 'Use a registered email and password.');
            setLoading(false);
        }
    }

    /**
     * Attempts to create a new account,
     * and then sign in to that account.
     */
    async function handleSignUp() {
        setLoading(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (!email || !password) {
            alert('Please enter an email and password.');
            setLoading(false);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Please use a valid email address.');
            setLoading(false);
            return;
        }

        const username = email.slice(0, email.indexOf('@'));
        const filter = new ProfanityFilter();

        for (let i = 0; i < username.length; i++) {
            for (let j = i; j <= username.length; j++) {
                if (filter.isProfane(username.slice(i, j))) {
                    alert('Please do not use an email address containing inappropriate language.');
                    setLoading(false);
                    return;
                }
            }
        }

        if (password.length < 10 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
            alert('Password must be at least 10 characters and contain at least one letter and one number.');
            setLoading(false);
            return;
        }

        try {
            setNotCreatingUser(false);
            await createUserWithEmailAndPassword(auth, email, password);
            setNotCreatingUser(true);
            const doc = await createUser(auth.currentUser.uid, email);
            setUser(doc);
            await AsyncStorage.setItem('user', JSON.stringify(doc));
            setLoading(false);
            navigation.navigate('Home');
        } catch (error) {
            setNotCreatingUser(true);
            
            if (error.message.includes('already-in-use')) {
                alert(`${email} is already in use.`);
                setLoading(false);
            } else {
                console.log(error);
                Alert.alert('Could not sign you up!', 'Use a unique email and password.');
                setLoading(false);
            }
        }
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeIn }]}>
            <InfoModal />
            <Loading active={loading} />
            <Image 
                source={logo}
                style={{ height: 90, width: '100%', resizeMode: 'contain' }}
            />
            <Text style={styles.br}>{'\n'}</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                autoCapitalize="none"
                value={email}
                onChangeText={text => { setEmail(text) }}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={text => { setPassword(text) }}
            />
            <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                    style={[styles.button, styles.shadow, { backgroundColor: '#c3a3ff' }]}
                    onPress={handleSignUp}
                >
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.shadow, { backgroundColor: '#8b6cc4' }]}
                    onPress={handleSignIn}
                >
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    br: {
        fontSize: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '95%',
        height: 50,
        borderColor: '#919191',
        borderWidth: 1,
        borderRadius: 15,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    button: {
        width: '45%',
        height: 50,
        marginHorizontal: 5,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderColor: '#919191',
        borderWidth: 1,
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.30,
        shadowRadius: 3.84,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        width: '70%',
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(3px)',
    },
    infoHeader: {
        fontWeight: 'bold',
        fontSize: 24,
    },
    closeInfo: {
        marginTop: 5,
        height: 30,
        borderRadius: 10,
        width: '60%',
        marginLeft: 5,
        marginRight: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
