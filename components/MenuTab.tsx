import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function MenuTab(props) {
    return (
        <ScrollView
            style={styles.container}
            refreshControl={ <RefreshControl refreshing={props.loading} onRefresh={props.onRefresh} /> }
        >
            {props.mazes.map((maze: {
                plays: number;
                id: string,
                name: string,
                created: string | null,
                creator: string,
                recordTime: number,
                recordHolder: string
            }) => <View key={maze.id} style={[styles.box, styles.shadow]}>
                    <View style={styles.icon}>
                        <TouchableOpacity onPress={() => {
                            updateDoc(doc(db, 'mazes', maze.id), { plays: maze.plays + 1 });
                            props.navigation.navigate('Play', { id: maze.id, refresh: props.refresh })
                        }}>
                            <FontAwesome name="play-circle" size={48} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.mazeName}>{maze.name}</Text>
                    <View style={{flexDirection: 'column', flex: 3}}>
                        {maze.recordHolder !== null &&
                            <Text style={styles.record}>
                                {maze.recordTime}s ({maze.recordHolder})
                            </Text>
                        }
                        <Text style={styles.creator}>
                            Created: {maze.created && maze.created + '\n'}by {maze.creator}
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 30,
        padding: 20,
        marginTop: 5,
        width: '100%',
        height: Dimensions.get('window').height - 130
    },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: 15,
        margin: 5,
        borderRadius: 5,
        backgroundColor: '#F0F0F0',
    },
    icon: {
        marginRight: 10,
        margin: 5,
    },
    mazeName: {
        textAlign: 'center',
        flex: 2,
        fontSize: 20,
        fontWeight: 'bold',
    },
    record: {
        textAlign: 'right',
        fontSize: 16,
    },
    creator: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: "right"
    },
    shadow: {
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 3.84,
        elevation: 5,
    },
});