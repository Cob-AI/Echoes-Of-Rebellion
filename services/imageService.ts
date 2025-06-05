// Hybrid image generation - Free (Pollinations) or Premium (OpenAI)

// Free option - Pollinations.ai (no API key needed)
export const generateFreeImage = async (prompt: string): Promise<string | null> => {
  try {
    const enhancedPrompt = encodeURIComponent(
      `Star Wars Andor style, cinematic lighting, gritty realistic, dark atmosphere: ${prompt}`
    );
    // Pollinations generates images on-demand via URL
    return `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1024&height=1024&nologo=true`;
  } catch (error) {
    console.error('Failed to generate free image:', error);
    return null;
  }
};

// Premium option - OpenAI DALL-E 3
export const generatePremiumImage = async (apiKey: string, prompt: string): Promise<string | null> => {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Star Wars Andor scene: ${prompt}. Cinematic style like the Andor TV series, gritty, realistic, moody dramatic lighting, high detail.`,
        n: 1,
        size: "1024x1024",
        quality: "standard", // Use "hd" for even better quality
        style: "natural"
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DALL-E 3 error:', error);
      // Fall back to free option
      return generateFreeImage(prompt);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Failed to generate premium image, falling back to free:', error);
    // Fall back to free option
    return generateFreeImage(prompt);
  }
};

// Main function that chooses which service to use
export const generateGameImage = async (prompt: string, openaiKey?: string | null): Promise<string | null> => {
  if (openaiKey) {
    // Try premium first, falls back to free if it fails
    return generatePremiumImage(openaiKey, prompt);
  } else {
    // Use free option
    return generateFreeImage(prompt);
  }
};