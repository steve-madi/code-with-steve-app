import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl
} from 'react-native';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../../firebase';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
    videoplayer: { videoUrl: string };
    Home: { uid?: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'videoplayer'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

interface UploadItem {
    id: string;
    title: string;
    category: string;
    files: {
        url: string;
        type: 'pdf' | 'video';
        publicId: string;
    }[];
    createdAt: any;
}

const HomeScreen = () => {
    const route = useRoute<HomeScreenRouteProp>();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { uid } = route.params || {};
    const [activeTab, setActiveTab] = useState('Web Development');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [filteredUploads, setFilteredUploads] = useState<UploadItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showReload, setShowReload] = useState(false);
    
    const categories = [
        'Web Development',
        'Desktop Development',
        'Mobile Development',
        'Cloud Computing',
        'Networking'
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch user name
            if (uid) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('uid', '==', uid));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    setName(userData.name);
                }
            }

            // Fetch uploads
            const uploadsRef = collection(db, 'uploads');
            const querySnapshot = await getDocs(uploadsRef);
            const uploadsData: UploadItem[] = [];
            
            querySnapshot.forEach((doc) => {
                uploadsData.push({
                    id: doc.id,
                    ...doc.data() as Omit<UploadItem, 'id'>
                });
            });

            setUploads(uploadsData);
            filterUploads(uploadsData, activeTab, searchQuery);
        } catch (error) {
            console.log('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [uid, activeTab, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        filterUploads(uploads, activeTab, searchQuery);
    }, [activeTab, searchQuery, uploads]);

    const filterUploads = (uploadsList: UploadItem[], category: string, query: string) => {
        let filtered = uploadsList.filter(item => item.category === category);
        
        if (query) {
            const searchTerm = query.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchTerm)
            );
        }
        
        setFilteredUploads(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = event.nativeEvent.contentSize.height;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        
        // Show reload when scrolled to bottom
        if (offsetY + layoutHeight >= contentHeight + 50) {
            setShowReload(true);
        } else {
            setShowReload(false);
        }
    };

    const handleEndReached = () => {
        if (showReload) {
            onRefresh();
        }
    };

    const toggleSearchBar = () => {
        setShowSearchBar(!showSearchBar);
        if (showSearchBar) {
            setSearchQuery('');
        }
    };

    const downloadFile = async (url: string, filename: string) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'File system permissions are required to download files.');
                return;
            }

            const fileUri = FileSystem.documentDirectory + filename;
            console.log('Starting download:', url, 'to', fileUri);

            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                fileUri,
                {},
                (progress) => {
                    const percentage = Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100);
                    console.log(`Download progress: ${percentage}%`);
                }
            );

            const downloadResult = await downloadResumable.downloadAsync();

            if (!downloadResult || downloadResult.status !== 200) {
                throw new Error('Failed to download file from the server.');
            }
            
            console.log('File downloaded to:', downloadResult.uri);

            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync('Downloads', asset, false);

            Alert.alert('Success', 'File downloaded successfully to your Downloads folder!');
        } catch (error: any) {
            console.error('Download error:', error);
            Alert.alert('Error', error.message || 'Failed to download file. Please try again.');
        }
    };

    const viewVideo = (videoUrl: string) => {
        navigation.navigate('videoplayer', { videoUrl });
    };

    const viewPdf = (pdfUrl: string) => {
        Linking.openURL(pdfUrl);
    };

    const getThumbnailForVideo = (videoUrl: string) => {
        return 'https://i.ytimg.com/vi/9M4XKi25I2M/hqdefault.jpg';
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    {!showSearchBar && <Text style={styles.headerTitle}>Code with Steve</Text>}
                    <View style={styles.headerRight}>
                        {showSearchBar ? (
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search uploads..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus={true}
                                />
                                <TouchableOpacity onPress={toggleSearchBar} style={styles.closeSearchButton}>
                                    <Icon name="close" size={24} color="#444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={toggleSearchBar} style={styles.searchButton}>
                                <Icon name="magnify" size={24} color="#444" />
                            </TouchableOpacity>
                        )}
                        {!showSearchBar && (
                            <TouchableOpacity>
                                <Icon name="account-circle" size={32} color="#444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Category Tabs */}
                {!showSearchBar && (
                    <View style={styles.tabWrapper}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabContent}
                        >
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.tabButton,
                                        activeTab === category && styles.activeTabButton
                                    ]}
                                    onPress={() => setActiveTab(category)}
                                >
                                    <Text style={[
                                        styles.tabText,
                                        activeTab === category && styles.activeTabText
                                    ]}>
                                        {category.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Uploads Content */}
                {loading ? (
                    <ActivityIndicator size="large" color="#3366cc" style={styles.loadingIndicator} />
                ) : (
                    <>
                        <FlatList
                            data={filteredUploads}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.videoList}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={['#3366cc']}
                                    tintColor="#3366cc"
                                />
                            }
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.1}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>
                                        {searchQuery ? 
                                            'No uploads match your search' : 
                                            'No uploads available for this category'}
                                    </Text>
                                </View>
                            }
                            renderItem={({ item }) => {
                                const videoFile = item.files.find(f => f.type === 'video');
                                const pdfFile = item.files.find(f => f.type === 'pdf');
                                
                                return (
                                    <View style={styles.videoCard}>
                                        {videoFile && (
                                            <Image
                                                source={{ uri: getThumbnailForVideo(videoFile.url) }}
                                                style={styles.thumbnail}
                                                resizeMode="cover"
                                            />
                                        )}
                                        {!videoFile && (
                                            <View style={[styles.thumbnail, styles.pdfThumbnail]}>
                                                <Icon name="file-pdf-box" size={60} color="#e74c3c" />
                                            </View>
                                        )}
                                        
                                        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
                                        
                                        <View style={styles.buttonContainer}>
                                            {videoFile && (
                                                <>
                                                    <TouchableOpacity 
                                                        style={[styles.actionButton, styles.viewButton]}
                                                        onPress={() => viewVideo(videoFile.url)}
                                                    >
                                                        <Icon2 name="play" size={14} color="white" />
                                                        <Text style={styles.buttonText}>View</Text>
                                                    </TouchableOpacity>
                                                    
                                                    <TouchableOpacity 
                                                        style={[styles.actionButton, styles.downloadButton]}
                                                        onPress={() => downloadFile(videoFile.url, `${item.title}_video.mp4`)}
                                                    >
                                                        <Icon name="download" size={16} color="white" />
                                                        <Text style={styles.buttonText}>Video</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                            
                                            {pdfFile && (
                                                <TouchableOpacity 
                                                    style={[styles.actionButton, styles.pdfButton]}
                                                    onPress={() => downloadFile(pdfFile.url, `${item.title}.pdf`)}
                                                >
                                                    <Icon name="file-pdf-box" size={16} color="white" />
                                                    <Text style={styles.buttonText}>PDF</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            }}
                        />
                        {showReload && (
                            <TouchableOpacity 
                                style={styles.reloadButton}
                                onPress={onRefresh}
                                activeOpacity={0.7}
                            >
                                <View style={styles.reloadContent}>
                                    <Icon name="reload" size={24} color="#3366cc" />
                                    <Text style={styles.reloadText}>Reload</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                <Text style={styles.name}>{name ? `Welcome, ${name}!` : ''}</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: width * 0.05,
        paddingVertical: 30,
        backgroundColor: 'white',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    headerTitle: {
        fontSize: width > 400 ? 26 : 25,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    searchButton: {
        marginRight: 15,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
    },
    closeSearchButton: {
        marginLeft: 10,
    },
    tabWrapper: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabContent: {
        paddingHorizontal: width * 0.03,
        paddingVertical: 10,
    },
    tabButton: {
        paddingHorizontal: width * 0.04,
        paddingVertical: 10,
        marginRight: width * 0.02,
    },
    activeTabButton: {
        borderBottomWidth: 3,
        borderBottomColor: '#3498db',
    },
    tabText: {
        fontSize: width > 400 ? 16 : 14,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#3498db',
        fontWeight: '600',
    },
    videoList: {
        padding: width * 0.03,
        paddingBottom: 20,
    },
    videoCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 15,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    thumbnail: {
        width: '100%',
        height: height * 0.22,
    },
    pdfThumbnail: {
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoTitle: {
        fontSize: width > 400 ? 16 : 14,
        fontWeight: '600',
        padding: 15,
        color: '#2c3e50',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: width * 0.03,
        borderRadius: 4,
        minWidth: width * 0.25,
        justifyContent: 'center',
    },
    viewButton: {
        backgroundColor: '#3498db',
    },
    downloadButton: {
        backgroundColor: '#2ecc71',
    },
    pdfButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        color: 'white',
        marginLeft: 5,
        fontSize: width > 400 ? 14 : 12,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    loadingIndicator: {
        marginTop: 20,
    },
    name: {
        fontSize: 22,
        color: '#3366cc',
        textAlign: 'center',
        marginBottom: 30,
    },
    reloadButton: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      backgroundColor: 'white',
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
          ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
          },
          android: {
              elevation: 4,
          },
      }),
  },
  reloadContent: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  reloadText: {
      marginLeft: 8,
      color: '#3366cc',
      fontWeight: '600',
      fontSize: 16,
  },
});

export default HomeScreen;