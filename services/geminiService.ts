import { GoogleGenAI, Type } from "@google/genai";
import { AuctionData } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractAuctionData = async (base64Image: string): Promise<AuctionData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze this real estate auction summary image. Extract the following information into a structured JSON object.
    
    Fields to extract:
    - caseNumber: The case number (e.g., 2024타경12345).
    - saleDate: The auction date (format YYYY년 M월 D일).
    - appraisalValue: The appraisal price (감정가).
    - minimumPrice: The minimum bid price (최저가).
    - minimumPercentage: The percentage of the minimum price relative to appraisal (e.g., 70%, 100%).
    - landArea: Land area (대지권).
    - buildingArea: Building area (건물면적/전용).
    - address: Full address of the property.
    - apartmentName: Name of the apartment or building complex.

    If a field is not found, leave it as an empty string. 
    Ensure the date format is clean.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caseNumber: { type: Type.STRING },
            saleDate: { type: Type.STRING },
            appraisalValue: { type: Type.STRING },
            minimumPrice: { type: Type.STRING },
            minimumPercentage: { type: Type.STRING },
            landArea: { type: Type.STRING },
            buildingArea: { type: Type.STRING },
            address: { type: Type.STRING },
            apartmentName: { type: Type.STRING },
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AuctionData;
  } catch (error) {
    console.error("Error extracting auction data:", error);
    throw error;
  }
};