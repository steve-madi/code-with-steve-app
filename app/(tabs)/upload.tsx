import { Cloudinary } from '@cloudinary/url-gen';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentPickerAsset } from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust the path as needed

// Cloudinary configuration
const cloudName = 'dlbak5vsf'; // Replace with your Cloudinary cloud name

// Initialize Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName
  }
});

const categories = [
  'Web Development',
  'Desktop Development',
  'Mobile Development',
  'Cloud Computing',
  'Networking'
];

interface UploadedFile {
  url: string;
  type: 'pdf' | 'video';
  publicId: string;
}

const UploadScreen = () => {
  const [pdfFile, setPdfFile] = useState<DocumentPickerAsset | null>(null);
  const [videoFile, setVideoFile] = useState<DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [pdfFileInfo, setPdfFileInfo] = useState<{ size?: number } | null>(null);
  const [videoFileInfo, setVideoFileInfo] = useState<{ size?: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Cloudinary configuration
  const CLOUDINARY_UPLOAD_PRESET = 'myclass'; // Replace with your upload preset
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  const pickFile = async (type: 'pdf' | 'video') => {
    try {
      console.log("Launching document picker...");
      
      const res = await DocumentPicker.getDocumentAsync({
        type: type === 'pdf' ? 'application/pdf' : 'video/*',
        copyToCacheDirectory: true,
      });

      console.log("Document picker result:", res);

      if (!res.canceled && res.assets) {
        const asset = res.assets[0];
        // Verify the file exists and is accessible
        const info = await FileSystem.getInfoAsync(asset.uri);
        if (!info.exists) {
          throw new Error('Selected file cannot be accessed');
        }

        console.log("File selected:", {
          name: asset.name,
          uri: asset.uri,
          size: info.size,
          mimeType: asset.mimeType
        });

        if (type === 'pdf') {
          setPdfFile(asset);
          setPdfFileInfo({ size: info.size });
        } else {
          setVideoFile(asset);
          setVideoFileInfo({ size: info.size });
        }
        setUploadedFiles([]);
        setUploadProgress(0);
      } else {
        console.log("User cancelled file selection");
      }
    } catch (err: any) {
      console.error("File picking error:", err);
      Alert.alert('Error', err.message || 'Failed to select file');
    }
  };

  const uploadFiles = async () => {
    if (!selectedCategory || !title) {
      Alert.alert('Missing Fields', 'Please select a category and provide a title.');
      return;
    }

    if (!pdfFile && !videoFile) {
      Alert.alert('Missing Files', 'Please select at least one file (PDF or Video).');
      return;
    }

    try {
      setUploading(true);
      const uploaded: UploadedFile[] = [];
      
      // Upload PDF if selected
      if (pdfFile) {
        const pdfUrl = await uploadSingleFile(pdfFile, `${title}_pdf`);
        uploaded.push({ url: pdfUrl, type: 'pdf', publicId: `${title}_pdf` });
      }
      
      // Upload Video if selected
      if (videoFile) {
        const videoUrl = await uploadSingleFile(videoFile, `${title}_video`);
        uploaded.push({ url: videoUrl, type: 'video', publicId: `${title}_video` });
      }

      setUploadedFiles(uploaded);
      
      // Save to Firestore
      await saveToFirestore(uploaded);
      
      Alert.alert('Upload Successful', 'Your files have been uploaded and saved successfully!');
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      Alert.alert(
        'Upload Failed', 
        error.response?.data?.error?.message || 'Please try again.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadSingleFile = async (file: DocumentPickerAsset, publicId: string): Promise<string> => {
    console.log("Starting upload...", file);

    // Read the file as base64
    const fileContent = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const formData = new FormData();
    formData.append('file', `data:${file.mimeType};base64,${fileContent}`);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', publicId.replace(/\s+/g, '_')); // Replace spaces with underscores
    formData.append('tags', `category_${selectedCategory.toLowerCase().replace(/\s+/g, '_')}`); // Add category as tag

    console.log("FormData prepared:", {
      name: file.name,
      type: file.mimeType,
      size: file.size
    });

    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        setUploadProgress(progress);
      },
    });

    console.log("Upload response:", response.data);
    return response.data.secure_url;
  };

  const saveToFirestore = async (files: UploadedFile[]) => {
    try {
      const docRef = await addDoc(collection(db, 'uploads'), {
        title,
        category: selectedCategory,
        files: files.map(file => ({
          url: file.url,
          type: file.type,
          publicId: file.publicId
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
  };

  const getFileIcon = (file: DocumentPickerAsset | null) => {
    if (!file) return 'file-question';
    
    const mimeType = file.mimeType || '';
    const extension = file.name?.split('.').pop()?.toLowerCase() || '';

    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('image')) return 'file-image';
    if (mimeType.includes('video')) return 'file-video';
    if (mimeType.includes('audio')) return 'file-music';
    if (mimeType.includes('msword') || extension === 'doc' || extension === 'docx') return 'file-word';
    if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx') return 'file-excel';
    if (mimeType.includes('zip') || extension === 'zip' || extension === 'rar') return 'folder-zip';
    
    return 'file';
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const renderFilePreview = (file: DocumentPickerAsset | null, fileInfo: { size?: number } | null, type: string) => {
    if (!file) return (
      <Text style={styles.noFileText}>No {type} file selected</Text>
    );

    return (
      <View style={styles.fileContainer}>
        <View style={styles.fileInfoContainer}>
          <Icon name={getFileIcon(file)} size={50} color="#3498db" style={styles.fileIcon} />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
              {file.name}
            </Text>
            <Text style={styles.fileType}>{file.mimeType || 'Unknown type'}</Text>
            <Text style={styles.fileSize}>{formatFileSize(fileInfo?.size)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Upload to Code with Steve</Text>

      {/* Category Selection */}
      <View style={styles.categoryContainer}>
        <Text style={styles.label}>Select Category:</Text>
        <TouchableOpacity 
          style={styles.categorySelector} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.categorySelectorText}>
            {selectedCategory || 'Select a category'}
          </Text>
          <Icon name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter title for your uploads"
        value={title}
        onChangeText={setTitle}
      />

      {/* PDF Upload Section */}
      <Text style={styles.sectionHeader}>PDF Document</Text>
      <TouchableOpacity 
        style={styles.selectBtn} 
        onPress={() => pickFile('pdf')}
      >
        <Icon name="file-pdf-box" size={20} color="#fff" />
        <Text style={styles.btnText}>
          {pdfFile ? 'Change PDF' : 'Select PDF'}
        </Text>
      </TouchableOpacity>
      {renderFilePreview(pdfFile, pdfFileInfo, 'PDF')}

      {/* Video Upload Section */}
      <Text style={styles.sectionHeader}>Video</Text>
      <TouchableOpacity 
        style={styles.selectBtn} 
        onPress={() => pickFile('video')}
      >
        <Icon name="video" size={20} color="#fff" />
        <Text style={styles.btnText}>
          {videoFile ? 'Change Video' : 'Select Video'}
        </Text>
      </TouchableOpacity>
      {renderFilePreview(videoFile, videoFileInfo, 'video')}

      {/* Upload Progress */}
      {uploading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${uploadProgress}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadBtn,
          ((!pdfFile && !videoFile) || !title || !selectedCategory || uploading) && { backgroundColor: '#aaa' }
        ]}
        onPress={uploadFiles}
        disabled={(!pdfFile && !videoFile) || !title || !selectedCategory || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.btnText}>Upload to Cloudinary</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Upload Success Message */}
      {uploadedFiles.length > 0 && (
        <View style={styles.successContainer}>
          <Icon name="check-circle" size={40} color="#2ecc71" />
          <Text style={styles.successText}>Upload Successful!</Text>
          {uploadedFiles.map((file, index) => (
            <TouchableOpacity
              key={index}
              style={styles.urlButton}
              onPress={() => Alert.alert(`${file.type.toUpperCase()} URL`, file.url)}
            >
              <Text style={styles.urlText}>View {file.type.toUpperCase()} URL</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Category Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedCategory(category);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.categoryText}>{category}</Text>
                  {selectedCategory === category && (
                    <Icon name="check" size={20} color="#3498db" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 50,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    color: '#1c1c1e',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 20,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  selectBtn: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadBtn: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  btnText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 16,
  },
  fileContainer: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    marginRight: 15,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 14,
    color: '#555',
  },
  noFileText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e6ffed',
    borderRadius: 10,
    marginTop: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2ecc71',
    marginTop: 10,
    marginBottom: 15,
  },
  urlButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#3498db',
    borderRadius: 8,
    marginVertical: 5,
  },
  urlText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    marginVertical: 15,
    width: '100%',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 5,
    color: '#555',
    fontSize: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#444',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 25,
    borderRadius: 10,
    maxHeight: '75%',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    textAlign: 'center',
    color: '#222',
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    padding: 15,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UploadScreen;