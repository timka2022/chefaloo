import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function buildSystemPrompt(
  allergies: string[],
  preferences: string[]
): string {
  const parts: string[] = [
    `You are a friendly culinary brainstorming partner helping users figure out what they want to cook. Your job is NOT to give them a full recipe — that happens later. Your job is to help them get excited and land on a great idea.`,
    `Ask about their mood, cravings, what ingredients they have in the fridge, how much time they have, and who they're cooking for. Be warm, curious, and energetic — like a friend who loves food.`,
    `Keep responses concise: usually 2–3 sentences. Be conversational, not listy. Avoid overwhelming them with options all at once.`,
    `Once the user seems to have landed on a clear idea, summarize it in one clean sentence so they can send it to the recipe generator. For example: "Sounds like you're going for a quick weeknight pasta with whatever veggies you have on hand — let's build that recipe!"`,
  ];

  if (allergies.length > 0) {
    parts.push(
      `IMPORTANT — this user has the following food allergies: ${allergies.join(', ')}. Never suggest dishes that contain these ingredients, and flag it if the user seems to be heading toward something that conflicts with their allergies.`
    );
  }

  if (preferences.length > 0) {
    parts.push(
      `This user has the following dietary preferences: ${preferences.join(', ')}. Try to suggest ideas that fit these preferences where possible.`
    );
  }

  return parts.join('\n\n');
}

export async function POST(request: Request) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Parse body
  let messages: Message[];
  try {
    const body = await request.json();
    messages = body.messages;
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Fetch dietary preferences
  const { data: dietaryData, error: dietaryError } = await supabase
    .from('dietary_preferences')
    .select('preference, type')
    .eq('user_id', user.id);

  if (dietaryError) {
    console.error('Failed to fetch dietary preferences:', dietaryError);
  }

  const allergies: string[] = [];
  const preferences: string[] = [];

  if (dietaryData) {
    for (const row of dietaryData) {
      if (row.type === 'allergy') {
        allergies.push(row.preference);
      } else {
        preferences.push(row.preference);
      }
    }
  }

  const systemPrompt = buildSystemPrompt(allergies, preferences);

  // Build OpenAI messages
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // Stream from OpenAI
  let openaiStream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
  try {
    openaiStream = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: openaiMessages,
      stream: true,
    });
  } catch (err) {
    console.error('OpenAI error:', err);
    return Response.json({ error: 'Failed to contact AI service' }, { status: 502 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${text}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        console.error('Streaming error:', err);
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
