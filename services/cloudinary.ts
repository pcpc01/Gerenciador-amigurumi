
const CLOUD_NAME = 'duljbwers'; // Substitua pelo seu Cloud Name
const UPLOAD_PRESET = 'Gerenciador de Atelie'; // Substitua pelo seu Upload Preset (Unsigned)

export const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Cloudinary Error:', errorData);
            throw new Error('Falha no upload para o Cloudinary');
        }

        const data = await response.json();
        return data.secure_url; // Retorna a URL direta (HTTPS)
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        throw error;
    }
};
