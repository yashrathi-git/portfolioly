/**
 * Deployment API service for storing Vercel deployment information
 */

import { getIdToken } from "../firebase";
import { env } from "@/lib/env";

const API_BASE_URL = env.API_BASE_URL;

export class DeploymentAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "DeploymentAPIError";
  }
}

/**
 * Get authorization headers with Firebase ID token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) {
    throw new DeploymentAPIError("User not authenticated", 401);
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface DeploymentInfo {
  deployedUrl: string;
  deploymentDashboardUrl?: string;
  projectDashboardUrl?: string;
  projectName?: string;
  repositoryUrl?: string;
}

/**
 * Save deployment info to backend
 * This is a fire-and-forget operation - errors are logged but not thrown
 */
export async function saveDeploymentUrl(
  info: DeploymentInfo
): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/deployment`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        deployed_url: info.deployedUrl,
        deployment_dashboard_url: info.deploymentDashboardUrl,
        project_dashboard_url: info.projectDashboardUrl,
        project_name: info.projectName,
        repository_url: info.repositoryUrl,
      }),
    });

    if (!response.ok) {
      console.error("Failed to save deployment URL:", response.status);
    }
  } catch (error) {
    // Log but don't throw - this is non-critical
    console.error("Error saving deployment URL:", error);
  }
}
