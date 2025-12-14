import React, { createContext, useContext, useState } from "react";
const IdContext = createContext<{
  uid: string;
  setUid: React.Dispatch<React.SetStateAction<string>>;

  setSentNewMessage: React.Dispatch<React.SetStateAction<boolean>>;

  sentNewMessage: boolean;
} | null>(null);

export function IdProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState("no id yet");
  const [sentNewMessage, setSentNewMessage] = useState(false);
  return (
    <IdContext.Provider
      value={{ uid, setUid, sentNewMessage, setSentNewMessage }}
    >
      {children}
    </IdContext.Provider>
  );
}
export function useUid() {
  return useContext(IdContext);
}
