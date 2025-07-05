import { useState, useEffect, useCallback } from "react";
import { MAX_HISTORY_ITEMS, HISTORY_STORAGE_KEY } from "../config/constants";
import { extractChatTitle } from "../utils/extractChatTitle";

export const useHistory = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));

          if (parsed.length > MAX_HISTORY_ITEMS) {
            localStorage.setItem(
              HISTORY_STORAGE_KEY,
              JSON.stringify(parsed.slice(0, MAX_HISTORY_ITEMS))
            );
          }
        }
      }
    } catch (err) {
      setError("Не удалось загрузить историю");
      setHistory([]);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const saveToLocalStorage = useCallback((newHistory) => {
    try {
      const limitedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
      return limitedHistory;
    } catch (err) {
      setError("Не удалось сохранить историю");
      return newHistory;
    }
  }, []);

  const addToHistory = useCallback(
    (summary, messagesInfo, transcriptionInfo) => {
      if (!summary || summary.trim().length === 0) {
        return;
      }

      const newItem = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        summary: summary.trim(),
        timestamp: Date.now(),
        chatInfo: {
          title: extractChatTitle(),
          messagesCount: Array.isArray(messagesInfo) ? messagesInfo.length : 0,
          hasAudio: transcriptionInfo?.audioProcessed > 0 || false,
        },
        preview:
          summary.trim().substring(0, 120) +
          (summary.length > 120 ? "..." : ""),
      };

      setHistory((prev) => {
        const isDuplicate = prev.some(
          (item) => item.summary === newItem.summary
        );

        if (isDuplicate) {
          return prev;
        }

        const newHistory = [newItem, ...prev];
        const savedHistory = saveToLocalStorage(newHistory);
        return savedHistory;
      });

      return newItem.id;
    },
    [saveToLocalStorage]
  );

  const removeItem = useCallback(
    (id) => {
      setHistory((prev) => {
        const newHistory = prev.filter((item) => item.id !== id);
        saveToLocalStorage(newHistory);
        return newHistory;
      });
    },
    [saveToLocalStorage]
  );

  const clearHistory = useCallback(() => {
    try {
      setHistory([]);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      clearError();
    } catch (err) {
      setError("Не удалось очистить историю");
    }
  }, [clearError]);

  return {
    history,
    addToHistory,
    removeItem,
    clearHistory,
    error,
    clearError,
  };
};
