import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';
import { removeFile } from './utilis.js';
import { Completions } from 'openai/resources/completions.js';

console.log(config.get('TEST_ENV'))

const INITIAL_SESSION = {
  messages: [],
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.use(session())

bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
})

// ... (импорты и начало кода остаются без изменений)

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);
    await removeFile(oggPath);
    
    const text = await openai.transcription(mp3Path);

    if (!text) {
      await ctx.reply("Транскрипция вернула пустой текст");
      return;
    }

    await ctx.reply(code(`Ваш запрос: ${text}`));
    ctx.session.messages.push({role: openai.roles.USER, content: text })

    const responseContent = await openai.chat(messages);
    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: responseContent.content })
    await ctx.reply(responseContent.content);

  } catch (e) {
    console.error(`Error while processing voice message`, e.message);
  }
});

bot.on(message('text'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));
    ctx.session.messages.push({role: openai.roles.USER, content: ctx.message.text });
    
    const messages = [
      { role: openai.roles.SYSTEM, content: "You are a helpful assistant." },
      { role: openai.roles.USER, content: ctx.message.text }
    ];
    const responseContent = await openai.chat(messages);

    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: responseContent.content });
    await ctx.reply(responseContent.content);
  } catch (e) {
    console.error(`Error while processing text message`, e.message);
  }
});


bot.command('start', async (ctx) => {
  await ctx.reply(JSON.stringify(ctx.message, null, 2));
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));