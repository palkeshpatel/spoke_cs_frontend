import { apiRequest } from "@/services/api";

export type LoyaltyProgramSettings = {
  id: number;
  earn_amount: number; // Rs
  earn_points: number; // points
  min_redeem_points: number;
};

export async function getLoyaltyProgramSettings() {
  return apiRequest<LoyaltyProgramSettings>("/api/loyalty-program");
}

export async function updateLoyaltyProgramSettings(payload: {
  earn_amount: number;
  earn_points: number;
  min_redeem_points: number;
}) {
  return apiRequest<LoyaltyProgramSettings>("/api/loyalty-program", { method: "PUT", body: payload });
}

