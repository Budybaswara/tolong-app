import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../core/prisma/prisma.service';

type ChatInput = { message: string; conversationId?: string; userId?: string };

@Injectable()
export class AiService {
  private openai?: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    const key = config.get<string>('OPENAI_API_KEY');
    const baseURL = config.get<string>('OPENAI_BASE_URL');
    if (key) this.openai = new OpenAI({ apiKey: key, ...(baseURL ? { baseURL } : {}) });
  }

  async chat(input: ChatInput) {
    const conversation = input.conversationId
      ? await this.prisma.aiConversation.findUnique({ where: { id: input.conversationId } })
      : await this.prisma.aiConversation.create({ data: { userId: input.userId } });
    if (!conversation) throw new NotFoundException('Percakapan tidak ditemukan');

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: input.message }
    });

    const messages = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 12
    });

    let provider: 'openai' | 'gemini' = 'openai';
    let model = this.config.get('OPENAI_MODEL', 'gpt-5.5');
    let answer: string;
    try {
      answer = await this.askOpenAi(messages.map((message) => ({ role: message.role, content: message.content })));
    } catch {
      provider = 'gemini';
      model = this.config.get('GEMINI_MODEL', 'gemini-2.5-pro');
      answer = await this.askGemini(input.message, model);
    }

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: answer, model }
    });

    return {
      conversationId: conversation.id,
      provider,
      model,
      answer,
      suggestedPrompts: [
        'Bagaimana cara lapor jalan rusak?',
        'Bantuan UMKM apa yang tersedia minggu ini?',
        'Buatkan ringkasan aspirasi untuk operator DPD',
        'Di mana lokasi laporan darurat terdekat?'
      ]
    };
  }

  private async askOpenAi(messages: Array<{ role: string; content: string }>) {
    if (!this.openai) throw new ServiceUnavailableException('OpenAI belum dikonfigurasi');
    const response = await this.openai.responses.create({
      model: this.config.get('OPENAI_MODEL', 'gpt-5.5'),
      instructions:
        'Anda adalah AI TOLONG untuk DPD PSI Mesuji Lampung. Jawab dalam Bahasa Indonesia, singkat, operasional, aman, dan arahkan warga ke fitur yang tepat.',
      input: messages.map((message) => `${message.role}: ${message.content}`).join('\n')
    });
    return response.output_text;
  }

  private async askGemini(message: string, model: string) {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (!key) throw new ServiceUnavailableException('Provider AI belum dikonfigurasi');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'Anda adalah AI TOLONG untuk layanan publik Kabupaten Mesuji. Jawab praktis dan sopan.' }]
        },
        contents: [{ role: 'user', parts: [{ text: message }] }]
      })
    });
    if (!response.ok) throw new ServiceUnavailableException('Gemini fallback gagal');
    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return json.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim() || 'Tidak ada jawaban AI.';
  }
}
