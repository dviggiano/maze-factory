import * as Haptics from 'expo-haptics';
import { FontAwesome } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { resetPlays } from '../firebase/functions';
import Loading from '../components/Loading';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdScreen({ navigation, route }) {
    const [loading, setLoading] = useState(false);
    const { user, setUser } = useContext(UserContext);
    
    return (
        <View style={styles.container}>
            <Loading active={loading} />
            <Text 
                style={{ 
                    paddingLeft: 40,
                    paddingRight: 40,
                    fontSize: 20,
                    textAlign: 'center',
                    fontWeight: 'bold',
                }}
            >
                Someday it might be a bit harder to get attempts,
                but for now, return home with three more!
            </Text>
            <TouchableOpacity
                onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLoading(true);
                    await resetPlays(user.id, route.params.id);
                    const updatedUser = { ...user };
                    updatedUser.plays[route.params.id] = 3;
                    setUser(updatedUser);
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                    navigation.navigate('Home');
                }}
                style={{ 
                    marginTop: 50, 
                    padding: 10, 
                    alignItems: 'center',
                }}
            >
                <FontAwesome name="home" size={48} color="#000" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});