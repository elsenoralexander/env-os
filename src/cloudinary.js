// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
    cloudName: 'duje7ffxm',
    uploadPreset: 'envios'
};

// Upload image to Cloudinary
export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'hospital_envios');

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        console.log('✅ Image uploaded to Cloudinary:', data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw error;
    }
};

// Upload base64 image to Cloudinary
export const uploadBase64ToCloudinary = async (base64String) => {
    const formData = new FormData();
    formData.append('file', base64String);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'hospital_envios');

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        console.log('✅ Image uploaded to Cloudinary:', data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        throw error;
    }
};
