import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "./HomePage";
import ViewPage from "./ViewPage";
import { useEffect } from "react";
import axios from "axios";

const SERVER_URL = "https://share-text-1wmi.onrender.com";

export default function App() {
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        await axios.get(SERVER_URL);
        console.log("Server wake-up ping sent");
      } catch (error) {
        console.error("Server wake-up failed:", error);
      }
    };
    wakeUpServer();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/view/:uid" element={<ViewPage />} />
        <Route path="/x" element={<ViewPage />} />
      </Routes>
    </BrowserRouter>
  );
}
