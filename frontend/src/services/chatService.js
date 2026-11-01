import api from "./api";

export async function askQuestion({
  question,
  conversationId = null,
  topK = 5,
}) {
  const { data } = await api.post("/chat/ask", {
    question,
    top_k: topK,
    conversation_id: conversationId,
  });

  return data;
}