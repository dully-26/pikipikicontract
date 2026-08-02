import imageCompression from 'browser-image-compression';

export async function compressImage(file) {
  if (!file) {
    throw new Error('No image selected.');
  }

  // Make sure it is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1200,
    useWebWorker: false,
    initialQuality: 0.8,
    fileType: 'image/jpeg',
  };

  try {
    const compressedFile = await imageCompression(
      file,
      options
    );

    console.log('Image compression:', {
      originalName: file.name,
      originalSize:
        (file.size / 1024 / 1024).toFixed(2) + ' MB',

      compressedSize:
        (compressedFile.size / 1024 / 1024).toFixed(2) + ' MB',

      originalType: file.type,
      compressedType: compressedFile.type,
    });

    return compressedFile;

  } catch (error) {
    console.error(
      'Image compression failed:',
      error
    );

    /*
     * If compression fails, return the original
     * image instead of completely stopping upload.
     */
    return file;
  }
}