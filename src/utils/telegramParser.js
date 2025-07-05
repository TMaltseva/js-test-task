export const parseMessages = async () => {
  if (!window.location.href.includes("web.telegram.org")) {
    throw new Error("Расширение работает только на web.telegram.org");
  }

  const transcriptionStatus = await tryGetAudioTranscriptions();

  const messageElements = document.querySelectorAll(".message");

  if (messageElements.length === 0) {
    throw new Error("В чате нет или слишком мало сообщений для анализа.");
  }

  const messages = [];

  messageElements.forEach((element) => {
    const videoText = element.querySelector(
      ".video-transcribed-text"
    )?.textContent;
    const audioText = element.querySelector(
      ".audio-transcribed-text"
    )?.textContent;

    if (videoText) {
      const cleanText = cleanTranscriptionText(videoText);
      if (cleanText.length > 10) {
        messages.push(`[Видео] ${cleanText}`);
        return;
      }
    }

    if (audioText) {
      const cleanText = cleanTranscriptionText(audioText);
      if (cleanText.length > 10) {
        messages.push(`[Аудио] ${cleanText}`);
        return;
      }
    }

    const text = extractTextFromMessage(element);
    if (text && text.length > 5) {
      messages.push(text);
    }
  });

  if (messages.length === 0) {
    throw new Error("Не удалось извлечь текст сообщений.");
  }

  return {
    messages,
    transcriptionStatus,
  };
};

const tryGetAudioTranscriptions = async () => {
  const status = {
    audioFound: 0,
    audioProcessed: 0,
    audioFailed: 0,
    hasIssues: false,
  };

  try {
    const audioButtons = document.querySelectorAll(".audio-to-text-button");
    status.audioFound = audioButtons.length;

    if (audioButtons.length === 0) {
      return status;
    }

    for (let i = 0; i < audioButtons.length; i++) {
      const button = audioButtons[i];

      if (
        button.style.display !== "none" &&
        !button.classList.contains("clicked")
      ) {
        try {
          button.classList.add("clicked");
          button.click();
          status.audioProcessed++;
          await delay(500);
        } catch (error) {
          status.audioFailed++;
          status.hasIssues = true;
        }
      }
    }

    await delay(2000);
  } catch (error) {
    status.hasIssues = true;
  }

  return status;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanTranscriptionText = (text) => {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\d{1,2}:\d{2}/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const extractTextFromMessage = (messageElement) => {
  if (!messageElement) return "";
  const clone = messageElement.cloneNode(true);

  const elementsToRemove = [
    ".time",
    ".time-inner",
    ".tgico",
    ".clearfix",
    ".reactions-element",
    ".bubble-hover-reaction",
    "svg",
    "canvas",
  ];

  elementsToRemove.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });

  let text = clone.textContent || "";

  return text.replace(/\s+/g, " ").trim();
};
