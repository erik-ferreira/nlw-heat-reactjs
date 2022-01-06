import { createContext, ReactNode, useEffect, useState } from "react";

import { api } from "../services/api";

type AuthProvider = {
  children: ReactNode;
};

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
};

type AuthResponse = {
  token: string;
  user: User | null;
};

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
};

export const AuthContext = createContext({} as AuthContextData);

const CLIENT_ID = "ef66ad1e0a86621783b1";

export function AuthProvider(props: AuthProvider) {
  const [userData, setUserData] = useState<User | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=${CLIENT_ID}&redirect_uri=http://localhost:3000`;

  async function signIn(githubCode: string) {
    try {
      const response = await api.post<AuthResponse>("/authenticate", {
        code: githubCode,
      });

      const { token, user } = response.data;

      localStorage.setItem("@doWhile:token", token);

      api.defaults.headers.common.authorization = `Bearer ${token}`;

      setUserData(user);
    } catch (err) {
      console.log(err);
    }
  }

  function signOut() {
    setUserData(null);
    localStorage.removeItem("@doWhile:token");
  }

  useEffect(() => {
    async function getUserData(token: string) {
      try {
        api.defaults.headers.common.authorization = `Bearer ${token}`;

        const response = await api.get<User>("/profile");

        setUserData(response.data);
      } catch (err) {
        console.log("erro ao pegar os dados do usuário");
      }
    }

    const token = localStorage.getItem("@doWhile:token");

    if (token) {
      getUserData(token);
    }
  }, []);

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes("?code=");

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split("?code=");

      window.history.pushState({}, "", urlWithoutCode);

      signIn(githubCode);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ signInUrl, user: userData, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}
