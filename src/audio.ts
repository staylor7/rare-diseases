import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";

const CSV = await csv(csvUrl);

let currentChakraAudio = new Audio();
let currentDiseaseAudio = new Audio();

export async function playChakraSound(chakraName: string) {
  const path = (await import(`../assets/chakra/${chakraName}.mp3`)).default;
  const newAudio = new Audio(path);
  newAudio.loop = true;

  // Define a fade function
  function fadeAudio(
    audio: HTMLAudioElement,
    startVolume: number,
    endVolume: number,
    duration: number
  ) {
    const step = (endVolume - startVolume) / (duration / 100); // Calculate volume change per step
    let currentVolume = startVolume;
    audio.volume = currentVolume;

    const fade = setInterval(() => {
      currentVolume += step;
      if (
        (step < 0 && currentVolume <= endVolume) ||
        (step > 0 && currentVolume >= endVolume)
      ) {
        clearInterval(fade); // Stop the interval
        audio.volume = endVolume; // Ensure final volume is set

        if (endVolume === 0) {
          audio.pause();
          audio.currentTime = 0;
        }
      } else {
        audio.volume = currentVolume;
      }
    }, 100);
  }

  // Fade out current audio, if any
  if (currentChakraAudio) {
    fadeAudio(currentChakraAudio, 1.0, 0, 2000); // Fade out over 2 seconds
  }

  // Prepare the new audio
  newAudio.volume = 0; // Start at volume 0 for fade in
  currentChakraAudio = newAudio; // Update reference to new audio
  newAudio.play().catch((e) => console.error("Failed to play new audio:", e)); // Play new audio, handling potential play promise rejection

  // Fade in new audio
  setTimeout(() => {
    fadeAudio(newAudio, 0, 1.0, 500); // Fade in over 2 seconds
  }, 500); // Start fade in after ensuring the old audio has started to fade out
}

export async function playDiseaseSound(rowNumber: string) {
  const path = (
    await import(`../assets/promoter/dna${rowNumber.padStart(3, "0")}.mp3`)
  ).default;

  if (currentDiseaseAudio) {
    currentDiseaseAudio.pause();
    currentDiseaseAudio.currentTime = 0;
  }

  currentDiseaseAudio = new Audio(path);
  currentDiseaseAudio.play();
}

export function getRowNumberForDisease(diseaseName: string) {
  const diseaseEntry = CSV.find((entry) => entry.Disease === diseaseName);
  return diseaseEntry ? diseaseEntry.index : null;
}
