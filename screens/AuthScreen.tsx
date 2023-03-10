import { useEffect, useState } from 'react';
import { View, Image, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import {collection, doc, getDocs, query, setDoc, where} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth/react-native';

const AuthScreen = ({ navigation }) => {
    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            if (user) {
                navigation.navigate('Home');
            }
        });
    }, []);

    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        try {
            setIsLoading(true);
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            setIsLoading(false);
            navigation.navigate('Home');
        } catch (error) {
            setIsLoading(false);
            alert(error.message);
        }
    };

    const handleSignUp = async () => {
        try {
            setIsLoading(true);
            const q = query(collection(db, 'users'), where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.size > 0) {
                setIsLoading(false);
                alert('Email is already in use');
                return;
            }
            if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{10,}$/.test(password)) {
                setIsLoading(false);
                alert('Password must be at least 10 characters and contain at least one letter and one number');
                return;
            }
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            setIsLoading(false);
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
            });
            navigation.navigate('Home');
        } catch (error) {
            setIsLoading(false);
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
            <Text style={styles.label}>{'Email'}</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => setEmail(text)}
            />
            <Text style={styles.label}>{'Password'}</Text>
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={(text) => setPassword(text)}
            />
            <TouchableOpacity style={[styles.button, {backgroundColor: "#c3a3ff"}]} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor: "#8b6cc4"}]} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

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
    label: {
        fontSize: 12,
        paddingLeft: 20,
        paddingBottom: 5,
        alignSelf: "flex-start",
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
        paddingHorizontal: 25,
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
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AuthScreen;
