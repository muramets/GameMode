import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Uploads an avatar image to Firebase Storage and returns the download URL.
 * Path: avatars/{userId}/{timestamp}_avatar.jpg
 * 
 * @param userId - The user's ID
 * @param file - The file blob or object to upload
 * @returns Promise<string> - The download URL
 */
export async function uploadAvatar(userId: string, file: Blob | File): Promise<string> {
    if (!userId) throw new Error('User ID is required for upload');

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_avatar.jpg`;
    const storagePath = `avatars/${userId}/${filename}`;

    const storageRef = ref(storage, storagePath);

    // Upload
    const snapshot = await uploadBytes(storageRef, file);

    // Get URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}
