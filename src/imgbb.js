/**
 * ImgBB configuration
 * Using a placeholder API key. User should replace this with their own.
 */
export const IMGBB_CONFIG = {
    apiKey: '53ab874261e647d55f805e6ff81b1c60', // API Key provided by user
    apiUrl: 'https://api.imgbb.com/1/upload'
};

/**
 * Compress image using Canvas API
 * Maintains quality while reducing file size
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
 * Upload image to ImgBB with automatic compression
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} Permanent ImgBB URL
 */
export const uploadToImgbb = async (file) => {
    try {
        console.log('📤 Starting image upload to ImgBB...');
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
        formData.append('image', fileToUpload);

        const response = await fetch(
            `${IMGBB_CONFIG.apiUrl}?key=${IMGBB_CONFIG.apiKey}`,
            {
                method: 'POST',
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error('❌ ImgBB API error:', data);
            throw new Error(data.error?.message || `Upload failed: ${response.status}`);
        }

        // Use the display URL from ImgBB
        const permanentUrl = data.data.url;
        console.log('✅ Image uploaded successfully to ImgBB:', permanentUrl);

        return permanentUrl;
    } catch (error) {
        console.error('❌ ImgBB upload error:', error);
        throw error;
    }
};

/**
 * Validate if an image URL is from ImgBB
 */
export const isImgbbUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.includes('ibb.co');
};
