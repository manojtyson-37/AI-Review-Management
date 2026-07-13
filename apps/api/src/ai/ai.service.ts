import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
    });
  }

  async generateReviewDrafts(
    feedback: string,
    rating: number,
    businessName: string
  ): Promise<{ professional: string; friendly: string; short: string }> {
    const prompt = `
      You are an AI assistant helping a customer write a genuine Google Review for ${businessName}.
      The customer gave a rating of ${rating} out of 5 and provided the following feedback: "${feedback}".
      
      Generate 3 variations of a review (Professional, Friendly, and Short). 
      Keep it authentic, do not hallucinate specific names or events not mentioned in the feedback.
      Format the response strictly as JSON with keys: "professional", "friendly", "short".
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      console.error('Error generating AI review drafts:', error);
      throw error;
    }
  }
}
