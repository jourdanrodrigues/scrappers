import { AxiosResponse } from 'axios';
import { CreateCompletionResponse } from 'openai';

const { Configuration, OpenAIApi } = require('openai');

export default class OpenAIClient {
  private static getClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    return new OpenAIApi(new Configuration({ apiKey }));
  }

  static summarize(
    content: string
  ): Promise<AxiosResponse<CreateCompletionResponse>> {
    return this.getClient().createCompletion({
      model: 'text-davinci-003',
      prompt: `Resume esse texto a seguir numa frase curta e objetiva:

${content}`,
      temperature: 0.7,
      max_tokens: 512,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
  }
}
