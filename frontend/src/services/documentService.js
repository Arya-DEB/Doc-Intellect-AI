import api from "./api"; // your existing axios instance with the auth header

export async function getDocuments() {
  const { data } = await api.get("/documents/");
  return data;
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file); // field name must be "file"
  // don't set Content-Type manually, the browser adds the multipart boundary
  const { data } = await api.post("/documents/upload", form);
  return data;
}

export async function deleteDocument(id) {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
}

export async function getDocumentUrl(id) {
  const { data } = await api.get(`/documents/${id}/file`);
  return data.url;
}
