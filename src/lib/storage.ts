import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import type { PhotoType } from '../types';

// ─── Upload Photo ─────────────────────────────────────────────────────────────
export interface UploadProgress {
  percent: number;
  url?: string;
  error?: string;
}

export const uploadJobPhoto = (
  jobId: string,
  propertyId: string,
  photoType: PhotoType,
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `jobs/${jobId}/${photoType}/${timestamp}.${ext}`;
    const storageRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        jobId,
        propertyId,
        photoType,
        uploadedAt: new Date().toISOString(),
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress({ percent });
      },
      (error) => {
        onProgress({ percent: 0, error: error.message });
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress({ percent: 100, url });
        resolve(url);
      }
    );
  });
};

// ─── Compress image before upload (mobile optimization) ───────────────────────
export const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        quality
      );
    };
    img.src = url;
  });
};

// ─── Delete photo ─────────────────────────────────────────────────────────────
export const deletePhoto = async (storageUrl: string) => {
  try {
    const photoRef = ref(storage, storageUrl);
    await deleteObject(photoRef);
  } catch (err) {
    console.error('Failed to delete photo:', err);
  }
};