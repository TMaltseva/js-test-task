export const extractChatTitle = () => {
  try {
    let element = document.querySelector(".topbar .peer-title[data-peer-id]");

    if (!element?.textContent?.trim()) {
      element = document.querySelector(".topbar .peer-title");
    }

    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }

    return "Неизвестный чат";
  } catch (error) {
    return "Неизвестный чат";
  }
};
