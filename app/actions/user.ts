"use server";

import { getAuth } from "../actions";

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { tokens } = await getAuth();

    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch user info:", response.statusText);
      return null;
    }

    const data = await response.json();
    return {
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
