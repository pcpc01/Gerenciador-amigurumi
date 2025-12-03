/// <reference types="vite/client" />
export const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const key = import.meta.env.VITE_IMGBB_API_KEY;

    if (!key) {
        throw new Error("ImgBB API Key not found");
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to upload image to ImgBB");
    }

    const data = await response.json();
    return data.data.url;
};
