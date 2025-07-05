import React, { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { Title } from "./Components/Title/Title";
import { Summary } from "./Components/Summary/Summary";
import { useSummary } from "./hooks/useSummary";
import { useHistory } from "./hooks/useHistory";
import { History } from "./Components/History/History";
import { Tabs } from "./Components/Tabs/Tabs";
import { useTabs } from "./hooks/useTabs";
import { useDraggable } from "./hooks/useDraggable";
import { useTitleObserver } from "./hooks/useTitleObserver";

import {
  CONTAINER_WIDTH,
  CONTAINER_MIN_HEIGHT,
  RIGHT_OFFSET,
} from "./config/constants";

const AppContainer = styled.div`
  width: 400px;
  height: 500px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  color: #111827;
  position: fixed;
  top: ${(props) => props.$top}px;
  left: ${(props) => props.$left}px;
  z-index: 100;
  cursor: ${(props) => (props.$isDragging ? "grabbing" : "grab")};
  transition: ${(props) =>
    props.$isDragging ? "none" : "box-shadow 0.2s ease"};
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: ${(props) =>
      props.$isDragging
        ? "0 10px 25px rgba(0, 0, 0, 0.1)"
        : "0 15px 35px rgba(0, 0, 0, 0.15)"};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const App = () => {
  const {
    summary,
    isLoading,
    error,
    isConfigured,
    generateSummary,
    transcriptionInfo,
    messagesInfo,
  } = useSummary();

  const {
    history,
    addToHistory,
    removeItem,
    clearHistory,
    error: historyError,
    clearError: clearHistoryError,
  } = useHistory();

  const { activeTab, switchToTab } = useTabs("summary");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const prevSummaryRef = useRef("");

  const handleChatChange = useCallback(() => {
    setSelectedHistoryItem(null);
    generateSummary();
  }, [generateSummary]);

  useTitleObserver({
    onChatChange: handleChatChange,
    checkDelay: 300,
  });

  const { position, isDragging, handleMouseDown } = useDraggable(
    {
      top: 20,
      left: Math.max(0, window.innerWidth - CONTAINER_WIDTH - RIGHT_OFFSET),
    },
    {
      width: CONTAINER_WIDTH,
      height: CONTAINER_MIN_HEIGHT,
      rightOffset: RIGHT_OFFSET,
    }
  );

  useEffect(() => {
    const handleMessage = (request) => {
      if (request.action === "toggle") {
        generateSummary();
      }
    };

    if (window.chrome && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, [generateSummary]);

  const handleSelectHistoryItem = useCallback(
    (item) => {
      setSelectedHistoryItem(item);
      switchToTab("summary");
    },
    [switchToTab]
  );

  const handleGenerateNewSummary = () => {
    setSelectedHistoryItem(null);
    generateSummary();
  };

  useEffect(() => {
    if (
      summary &&
      summary !== prevSummaryRef.current &&
      !isLoading &&
      !error &&
      !selectedHistoryItem
    ) {
      addToHistory(summary, messagesInfo, transcriptionInfo);
      prevSummaryRef.current = summary;
    }
  }, [
    summary,
    isLoading,
    error,
    selectedHistoryItem,
    addToHistory,
    messagesInfo,
    transcriptionInfo,
  ]);

  const currentSummary = selectedHistoryItem
    ? selectedHistoryItem.summary
    : summary;

  const isShowingHistoryItem = Boolean(selectedHistoryItem);

  const renderTabContent = () => {
    switch (activeTab) {
      case "history":
        return (
          <History
            history={history}
            onSelectSummary={handleSelectHistoryItem}
            onClearHistory={clearHistory}
            onRemoveItem={removeItem}
            error={historyError}
            onClearError={clearHistoryError}
          />
        );
      case "summary":
      default:
        return (
          <Summary
            summary={currentSummary}
            isLoading={isLoading && !isShowingHistoryItem}
            error={error}
            onRefresh={handleGenerateNewSummary}
            isConfigured={isConfigured}
            transcriptionInfo={transcriptionInfo}
            historyError={historyError}
            onClearHistoryError={clearHistoryError}
            selectedHistoryItem={selectedHistoryItem}
          />
        );
    }
  };

  return (
    <AppContainer
      $top={position.top}
      $left={position.left}
      $isDragging={isDragging}
      onMouseDown={handleMouseDown}
    >
      <Title />
      <Tabs
        activeTab={activeTab}
        onTabChange={switchToTab}
        historyCount={history.length}
      />
      <ContentArea>{renderTabContent()}</ContentArea>
    </AppContainer>
  );
};
