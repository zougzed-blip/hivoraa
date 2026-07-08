export function createDifficultyBar(level) {
  const meter = document.createElement('div');
  meter.className = 'difficulty-bar';
  meter.style.width = `${Math.min(100, Math.max(0, level * 20))}%`;
  meter.textContent = `Difficulty: ${level}/5`;
  return meter;
}
