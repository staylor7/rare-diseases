import { csv } from "d3";

const CSV = await csv("seq.d3.csv");

let currentChakraAudio = new Audio();
let currentDiseaseAudio = new Audio();

export function playChakraSound(chakraName: string) {
  const filePath = `chakra_sounds_mp3/${chakraName}.mp3`;
  if (currentChakraAudio) {
    currentChakraAudio.pause();
    currentChakraAudio.currentTime = 0;
  }

  currentChakraAudio = new Audio(filePath);
  currentChakraAudio.loop = true;
  currentChakraAudio.play();
}

export function playDiseaseSound(rowNumber: string) {
  rowNumber = rowNumber.padStart(3, "0");
  const filePath = `promoter_sounds_mp3/dna${rowNumber}.mp3`;

  if (currentDiseaseAudio) {
    currentDiseaseAudio.pause();
    currentDiseaseAudio.currentTime = 0;
  }

  currentDiseaseAudio = new Audio(filePath);
  currentDiseaseAudio.play();
}

export function extractChakraName(name: string) {
  return name.match(/\(([^)]+)\)/)?.[1]; // Extracts chakra name from paranthesis (e.g. "endocrine (ritu)" -> "ritu")
}

export function getRowNumberForDisease(diseaseName: string) {
  const diseaseEntry = CSV.find((entry) => entry.Disease === diseaseName);
  return diseaseEntry ? diseaseEntry.index : null;
}
