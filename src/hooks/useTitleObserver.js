import { useEffect, useRef } from "react";
import { extractChatTitle } from "../utils/extractChatTitle";
import { debounce } from "../utils/debounce";

export const useTitleObserver = ({ onChatChange, checkDelay = 500 }) => {
  const currentTitleRef = useRef("");

  useEffect(() => {
    const checkTitleChange = () => {
      const newTitle = extractChatTitle();
      if (newTitle && newTitle !== currentTitleRef.current) {
        currentTitleRef.current = newTitle;
        onChatChange?.();
      }
    };

    const handleMutation = debounce(checkTitleChange, checkDelay);

    const observer = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some((mutation) => {
        return (
          mutation.target.closest?.(".topbar, .chat-info") ||
          [...mutation.addedNodes].some(
            (node) =>
              node.nodeType === 1 &&
              node.matches?.(".peer-title, [data-peer-id]")
          )
        );
      });

      if (shouldUpdate) handleMutation();
    });

    const initObserver = () => {
      const container = document.querySelector(".topbar, .chat-info");
      if (container) {
        observer.observe(container, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        checkTitleChange();
      } else {
        setTimeout(initObserver, 500);
      }
    };

    initObserver();

    return () => {
      observer.disconnect();
      handleMutation.cancel?.();
    };
  }, [onChatChange, checkDelay]);
};
