import api from "./api";

export async function askQuestion({
  question,
  conversationId = null,
  documentId = null,
  topK = 3,
}) {
  const { data } = await api.post("/chat/ask", {
    question,
    top_k: topK,
    conversation_id: conversationId,
    document_id: documentId,
  });

  return data;
}

export async function getConversations(documentId = null) {
  const { data } = await api.get("/conversations/", {
    params: documentId ? { document_id: documentId } : {},
  });

  return data;
}

export async function getConversation(conversationId) {
  const { data } = await api.get(`/conversations/${conversationId}`);
  return data;
}

export async function deleteConversation(conversationId) {
  const { data } = await api.delete(`/conversations/${conversationId}`);
  return data;
}