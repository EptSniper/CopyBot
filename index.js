require('dotenv').config();
const { Client, Events, GatewayIntentBits, ApplicationCommandOptionType } = require('discord.js');

// Environment-driven config
const BACKEND_URL = process.env.BACKEND_URL; // where normalized trades are sent (optional)
const BACKEND_API_KEY = process.env.BACKEND_API_KEY; // optional bearer token for backend
const COMMAND_GUILD_ID = process.env.COMMAND_GUILD_ID; // if set, register slash commands only in this guild (faster propagation)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  registerSlashCommands().catch((err) => {
    console.error('Failed to register slash commands:', err);
  });
});

async function registerSlashCommands() {
  const commands = [
    {
      name: 'trade',
      description: 'Submit a trade with explicit fields',
      options: [
        {
          name: 'symbol',
          description: 'Symbol (e.g., ES, NQ)',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'contracts',
          description: 'Number of contracts/lots',
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
        {
          name: 'side',
          description: 'Direction',
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: 'Long', value: 'BUY' },
            { name: 'Short', value: 'SELL' },
          ],
        },
        {
          name: 'ordertype',
          description: 'Order type',
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: 'Market', value: 'MARKET' },
            { name: 'Limit', value: 'LIMIT' },
          ],
        },
        {
          name: 'stoploss',
          description: 'Stop loss price',
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
        {
          name: 'takeprofit',
          description: 'Take profit price',
          type: ApplicationCommandOptionType.Number,
          required: true,
        },
        {
          name: 'entryprice',
          description: 'Entry price (required if order type = LIMIT)',
          type: ApplicationCommandOptionType.Number,
          required: false,
        },
      ],
    },
  ];

  if (COMMAND_GUILD_ID) {
    const guild = await client.guilds.fetch(COMMAND_GUILD_ID);
    await guild.commands.set(commands);
    console.log(`Registered /trade command in guild ${guild.id}`);
  } else {
    await client.application.commands.set(commands);
    console.log('Registered /trade command globally (can take up to 1 hour to propagate).');
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'trade') return;

  try {
    const symbol = interaction.options.getString('symbol', true).toUpperCase();
    const contracts = interaction.options.getNumber('contracts', true);
    const side = interaction.options.getString('side', true);
    const orderType = interaction.options.getString('ordertype', true);
    const entryPrice = interaction.options.getNumber('entryprice');
    const stopLoss = interaction.options.getNumber('stoploss', true);
    const takeProfit = interaction.options.getNumber('takeprofit', true);

    if (orderType === 'LIMIT' && entryPrice === null) {
      await interaction.reply({
        content: 'Entry price is required when order type is LIMIT.',
        ephemeral: true,
      });
      return;
    }

    const trade = {
      symbol,
      contract: null,
      side,
      quantity: contracts,
      orderType,
      entryPrice: orderType === 'LIMIT' ? entryPrice : null,
      stopLoss,
      stopLossTicks: null,
      takeProfits: [{ level: 1, price: takeProfit }],
    };

    const payload = toPayload(trade, interaction);

    if (BACKEND_URL) {
      await sendToBackend(payload);
    }

    const text = formatTradeMessage(trade);
    await interaction.reply(text);
  } catch (error) {
    console.error('Failed to handle /trade:', error);
    const userMsg = error.userMessage || 'Could not process that trade. Please try again.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: userMsg, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: userMsg, ephemeral: true }).catch(() => {});
    }
  }
});

function formatTradeMessage(trade) {
  const header = `${trade.symbol} ${trade.side}`;
  const entry =
    trade.orderType === 'MARKET'
      ? 'Entry: MARKET'
      : `Entry: ${trade.entryPrice} (LIMIT)`;
  const stop = `StopLoss: ${trade.stopLoss}`;
  const tp = `TakeProfit: ${trade.takeProfits[0].price}`;
  const qty = `Contracts: ${trade.quantity}`;
  return [header, entry, stop, tp, qty].join('\n');
}

function toPayload(trade, interaction) {
  return {
    trade: {
      id: interaction.id,
      symbol: trade.symbol,
      contract: trade.contract,
      side: trade.side,
      quantity: trade.quantity,
      orderType: trade.orderType,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      stopLossTicks: trade.stopLossTicks,
      takeProfits: trade.takeProfits,
      sentAt: Date.now(),
      source: 'discord',
      messageLink: interaction.channel
        ? `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.id}`
        : null,
    },
    sender: {
      id: interaction.user.id,
      username: interaction.user.username,
      discriminator: interaction.user.discriminator,
      roles: interaction.member?.roles ? [...interaction.member.roles.cache.keys()] : [],
    },
    channel: {
      id: interaction.channelId,
      name: interaction.channel?.name,
    },
    guild: {
      id: interaction.guildId,
      name: interaction.guild?.name,
    },
  };
}

async function sendToBackend(payload) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (BACKEND_API_KEY) {
    headers.Authorization = `Bearer ${BACKEND_API_KEY}`;
  }

  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw userFacingError(`Backend error ${res.status}: ${text || res.statusText}`);
  }
}

function userFacingError(msg) {
  const err = new Error(msg);
  err.userMessage = msg;
  return err;
}

client.login(process.env.DISCORD_TOKEN);
