import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";
import { TRANSITION_TIME } from "./main";

const CSV = await csv(csvUrl);

let currentChakra = "";
let currentDiseaseAudio = new Audio();

const chakraContext = new AudioContext();
let currentChakraGainNode = chakraContext.createGain();

/**
 * Fades in a new chakra/category sound, fading out the current chakra sound if it exists
 * If the current sound is the same, ignores and continues looping
 */
export async function playChakraSound(chakraName: string) {
  if (chakraName === currentChakra) return;

  const path = (await import(`../assets/chakra/${chakraName}.mp3`)).default;
  const audio = new Audio(path);
  const newGainNode = chakraContext.createGain();
  const source = chakraContext.createMediaElementSource(audio);

  newGainNode.connect(chakraContext.destination);
  source.connect(newGainNode);

  audio.loop = true;
  audio.play();

  fade(currentChakraGainNode, 1, 0);
  fade(newGainNode, 0, 1);

  currentChakra = chakraName;
  currentChakraGainNode = newGainNode;
}

function fade(
  gainNode: GainNode,
  startVolume: number,
  endVolume: number,
  duration: number = TRANSITION_TIME
) {
  gainNode.gain.setValueAtTime(
    boundVolume(startVolume),
    chakraContext.currentTime
  );

  gainNode.gain.linearRampToValueAtTime(
    boundVolume(endVolume),
    chakraContext.currentTime + duration / 1000
  );
}

function boundVolume(volume: number) {
  return Math.min(Math.max(volume, 0), 1);
}

/**
 * Plays a new disease sound, stopping the current disease sound if it exists
 */
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
