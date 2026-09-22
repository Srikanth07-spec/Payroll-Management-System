import { supabase } from "../lib/supabase";

const BUCKET = "payroll-documents";

export async function uploadPayrollDocument(
  file,
  userId,
  documentType = "documents"
) {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const safeName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const filePath =
    `${userId}/${documentType}/${Date.now()}-${safeName}`;

  const { data, error } =
    await supabase.storage
      .from(BUCKET)
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        }
      );

  if (error) {
    throw error;
  }

  return data;
}

export async function deletePayrollDocument(
  filePath
) {
  const { error } =
    await supabase.storage
      .from(BUCKET)
      .remove([filePath]);

  if (error) {
    throw error;
  }

  return true;
}

export async function listPayrollDocuments(
  userId,
  documentType = "documents"
) {
  const folder =
    `${userId}/${documentType}`;

  const { data, error } =
    await supabase.storage
      .from(BUCKET)
      .list(folder);

  if (error) {
    throw error;
  }

  return data;
}