// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
    cloudName: 'duje7ffxm',
    uploadPreset: 'envios'
};

/**
 * Compress image using Canvas API
 * Maintains quality while reducing file size
 * @param {File|Blob} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default 1200px)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            console.log(`📸 Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`);
                            resolve(blob);
                        } else {
                            reject(new Error('Error compressing image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Error loading image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(file);
    });
};

/**
 * Upload image to Cloudinary with automatic compression
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Permanent Cloudinary URL
 */
export const uploadToCloudinary = async (file) => {
    try {
        console.log('📤 Starting image upload...');
        console.log(`📁 Original file: ${file.name}, ${(file.size / 1024).toFixed(1)}KB, type: ${file.type}`);

        // Compress image before upload (skip for very small files)
        let fileToUpload = file;
        if (file.size > 100 * 1024) { // Only compress if > 100KB
            try {
                fileToUpload = await compressImage(file, 1200, 0.85);
            } catch (compressError) {
                console.warn('⚠️ Compression failed, uploading original:', compressError);
                fileToUpload = file;
            }
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('folder', 'hospital_envios');
        // Request stable URL format
        formData.append('resource_type', 'image');
        formData.append('type', 'upload');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Cloudinary API error:', data);
            throw new Error(data.error?.message || `Upload failed: ${response.status}`);
        }

        // Use secure_url which is permanent and stable
        const permanentUrl = data.secure_url;
        console.log('✅ Image uploaded successfully:', permanentUrl);
        console.log('📊 Public ID:', data.public_id);

        return permanentUrl;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw error;
    }
};

/**
 * Upload base64 image to Cloudinary
 * @param {string} base64String - Base64 encoded image
 * @returns {Promise<string>} Permanent Cloudinary URL
 */
export const uploadBase64ToCloudinary = async (base64String) => {
    try {
        console.log('📤 Starting base64 image upload...');

        // Validate base64 string
        if (!base64String || typeof base64String !== 'string') {
            throw new Error('Invalid base64 string');
        }

        // Ensure proper data URL format
        let dataUrl = base64String;
        if (!base64String.startsWith('data:')) {
            dataUrl = `data:image/jpeg;base64,${base64String}`;
        }

        const formData = new FormData();
        formData.append('file', dataUrl);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('folder', 'hospital_envios');
        formData.append('resource_type', 'image');
        formData.append('type', 'upload');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Cloudinary API error:', data);
            throw new Error(data.error?.message || `Upload failed: ${response.status}`);
        }

        const permanentUrl = data.secure_url;
        console.log('✅ Base64 image uploaded successfully:', permanentUrl);

        return permanentUrl;
    } catch (error) {
        console.error('❌ Cloudinary base64 upload error:', error);
        throw error;
    }
};

/**
 * Validate if a Cloudinary URL is valid and accessible
 * @param {string} url - Cloudinary URL to validate
 * @returns {boolean} True if valid Cloudinary URL
 */
export const isValidCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
};
