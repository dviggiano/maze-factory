import { useEffect, useState } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ProfanityFilter from 'bad-words';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth/react-native';
import * as Haptics from 'expo-haptics';

export default function AuthScreen({ navigation }) {
    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            if (user) {
                navigation.navigate('Home');
            }
        });
    }, []);

    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);

    const handleSignIn = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.navigate('Home');
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSignUp = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const username = email.slice(0, email.indexOf('@'));
            const filter = new ProfanityFilter();

            for (let i = 0; i < username.length; i++) {
                for (let j = i; j <= username.length; j++) {
                    if (filter.isProfane(username.slice(i, j))) {
                        alert('Please do not use an email address containing inappropriate language.');
                        return;
                    }
                }
            }

            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.size > 0) {
                alert(`${email} is already in use.`);
                return;
            }

            if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{10,}$/.test(password)) {
                alert('Password must be at least 10 characters and contain at least one letter and one number.');
                return;
            }

            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, 'users', user.uid), { 
                email: email,
            });

            navigation.navigate('Home');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <View style={styles.maze}>
            <Image 
                source={require('../logo.png')}
                style={{height: 90, width: "100%", resizeMode: 'contain'}}
            />
            <Text style={styles.br}>{'\n'}</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888888"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => setEmail(text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888888"
                secureTextEntry
                value={password}
                onChangeText={(text) => setPassword(text)}
            />
            <TouchableOpacity style={[styles.button, styles.shadow, {backgroundColor: "#c3a3ff"}]} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.shadow, {backgroundColor: "#8b6cc4"}]} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    maze: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
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
        width: '95%',
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderColor: '#919191',
        borderWidth: 1
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
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
