
/**
 * Resizes an image Blob to the specified maximum dimensions while maintaining aspect ratio.
 * @param file The image Blob to resize.
 * @param maxWidth The maximum width of the resized image.
 * @param maxHeight The maximum height of the resized image.
 * @param quality The quality of the output JPEG (0 to 1). Defaults to 0.8.
 * @returns A Promise that resolves to the resized image Blob.
 */
export const resizeImage = (
    file: Blob,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = () => {
            let width = image.width;
            let height = image.height;

            // Calculate new dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(image, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                    URL.revokeObjectURL(image.src); // Clean up
                },
                'image/jpeg',
                quality
            );
        };

        image.onerror = (error) => {
            URL.revokeObjectURL(image.src);
            reject(error);
        };
    });
};
