export interface AuctionData {
  caseNumber: string;
  saleDate: string;
  appraisalValue: string;
  minimumPrice: string;
  minimumPercentage: string;
  landArea: string;
  buildingArea: string;
  address: string;
  apartmentName: string;
  status?: string;
}

export interface ProcessedImage {
  id: string;
  originalName: string;
  dataUrl: string;
}