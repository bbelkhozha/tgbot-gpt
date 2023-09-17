import OpenAI from 'openai';
import config from 'config';
import { createReadStream } from 'fs'
import fs from 'fs';



class OpenAIWrapper {
  roles = {
    ASSISTANT: 'assistant',
    USER: 'user',
    SYSTEM: 'system',
  };

  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async chat(messages) {
    try {
      const completion = await this.openai.chat.completions.create({
          messages,
          model: 'gpt-3.5-turbo',
        });
        console.log("GPT-3 Message Object:", JSON.stringify(completion.choices[0]?.message, null, 2));
        return completion.choices[0]?.message
    } catch (e) {
      console.error('Error while gpt chat:', e.message);
      console.log('Error details:', e);
      return "Error during GPT-3 chat";
    }
  }
  
  

  // Для транскрибации можно использовать другие методы, если API предоставляет их.
  async transcription(filepath) {
    try {
      console.log("Starting transcription for file:", filepath);
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filepath),
        model: 'whisper-1',
      });
      console.log("Transcription result:", response.text);
      return response.text || "Transcription returned empty text";
    } catch (e) {
      console.log('Error while transcription', e.message);
      return "Error during transcription";
    }
  }
}

export const openai = new OpenAIWrapper(config.get('OPENAI_KEY'));