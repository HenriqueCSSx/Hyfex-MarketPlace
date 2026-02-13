import { supabase } from "@/lib/supabase";

/**
 * Uploads a file to Supabase Storage.
 * @param file The file to upload.
 * @param bucket The bucket name (defaults to 'products').
 * @returns The public URL of the uploaded file.
 */
export async function uploadImage(file: File, bucket: string = "products") {
    try {
        const fileExt = (file as any).name?.split(".").pop() || "jpg";
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            console.error("Supabase Storage Error:", uploadError);
            return { publicUrl: null, error: uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { publicUrl, error: null };
    } catch (error: any) {
        console.error("Error uploading image:", error);
        return { publicUrl: null, error: error.message || "Unknown error" };
    }
}
