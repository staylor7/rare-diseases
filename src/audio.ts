import { csv } from "d3";
import csvUrl from "/seq.d3.csv?url";

const CSV = await csv(csvUrl);

let currentChakraAudio = new Audio();
let currentDiseaseAudio = new Audio();

export async function playChakraSound(chakraName: string) {
  const path = (await import(`../assets/chakra_sounds_mp3/${chakraName}.mp3`))
    .default;

  if (currentChakraAudio) {
    currentChakraAudio.pause();
    currentChakraAudio.currentTime = 0;
  }

  currentChakraAudio = new Audio(path);
  currentChakraAudio.loop = true;
  currentChakraAudio.play();
}

export async function playDiseaseSound(rowNumber: string) {
  const path = (
    await import(
      `../assets/promoter_sounds_mp3/dna${rowNumber.padStart(3, "0")}.mp3`
    )
  ).default;

  if (currentDiseaseAudio) {
    currentDiseaseAudio.pause();
    currentDiseaseAudio.currentTime = 0;
  }

  currentDiseaseAudio = new Audio(path);
  currentDiseaseAudio.play();
}

export function extractChakraName(name: string) {
  return name.match(/\(([^)]+)\)/)?.[1]; // Extracts chakra name from paranthesis (e.g. "endocrine (ritu)" -> "ritu")
}

export function getRowNumberForDisease(diseaseName: string) {
  const diseaseEntry = CSV.find((entry) => entry.Disease === diseaseName);
  return diseaseEntry ? diseaseEntry.index : null;
}
