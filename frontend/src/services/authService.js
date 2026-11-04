import api from "./api";

export async function registerUser(userData) {
  const { data } = await api.post("/auth/register", userData);
  return data;
}

export async function loginUser(email, password) {
  const formData = new URLSearchParams();

  // FastAPI OAuth2PasswordRequestForm expects "username", not "email".
  formData.append("username", email);
  formData.append("password", password);

  const { data } = await api.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/users/me");
  return data;
}