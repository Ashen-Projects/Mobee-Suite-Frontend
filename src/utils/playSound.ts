export const playSound = (source: string, volume = 0.55) => {
  try {
    const audio = new Audio(source);
    audio.volume = volume;
    void audio.play().catch(() => {
      // Browsers can block sounds until the user interacts with the page.
    });
  } catch {
    // Sound feedback is helpful, but it should never break the workflow.
  }
};
