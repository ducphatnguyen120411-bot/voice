require('dotenv').config();
const { 
    Client, GatewayIntentBits, ChannelType, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
    ],
});

// Lưu trữ dữ liệu các phòng tạm thời: ID Phòng => ID Chủ phòng
const tempChannels = new Map();

client.on('ready', async () => {
    console.log(`✅ Bot ${client.user.tag} đã online!`);

    // Tạo bảng điều khiển (Interface) nếu chưa có
    const controlChannel = client.channels.cache.get(process.env.CONTROL_CHANNEL_ID);
    if (controlChannel) {
        const messages = await controlChannel.messages.fetch({ limit: 10 });
        const botMsg = messages.find(m => m.author.id === client.user.id);
        
        if (!botMsg) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('lock').setLabel('🔒 Khóa/Mở').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('rename').setLabel('✏️ Đổi tên').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('limit').setLabel('👥 Giới hạn người').setStyle(ButtonStyle.Secondary)
            );
            await controlChannel.send({ 
                content: '**🛠️ ĐIỀU KHIỂN PHÒNG VOICE**\nTham gia kênh tạo phòng, sau đó dùng các nút bên dưới để quản lý phòng của bạn!', 
                components: [row] 
            });
        }
    }
});

// Xử lý tạo và xóa phòng voice
client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;

    // 1. Nếu user join vào kênh "Join to Create"
    if (newState.channelId === process.env.JOIN_TO_CREATE_ID) {
        try {
            const newChannel = await newState.guild.channels.create({
                name: `Phòng của ${user.username}`,
                type: ChannelType.GuildVoice,
                parent: process.env.CATEGORY_ID,
                userLimit: 0, // Mặc định không giới hạn
            });

            // Chuyển user sang phòng mới
            await newState.setChannel(newChannel);
            // Lưu lại chủ phòng
            tempChannels.set(newChannel.id, user.id);
        } catch (error) {
            console.error("Lỗi khi tạo phòng:", error);
        }
    }

    // 2. Nếu user rời khỏi một phòng tạm thời
    if (oldState.channelId && tempChannels.has(oldState.channelId)) {
        const channel = oldState.channel;
        // Nếu phòng trống thì xóa
        if (channel && channel.members.size === 0) {
            try {
                await channel.delete();
                tempChannels.delete(oldState.channelId);
            } catch (error) {
                console.error("Lỗi khi xóa phòng:", error);
            }
        }
    }
});

// Xử lý nút bấm và bảng nhập liệu (Modal)
client.on('interactionCreate', async (interaction) => {
    // Kiểm tra xem user có ở trong phòng do mình tạo không
    if (interaction.isButton() || interaction.isModalSubmit()) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || tempChannels.get(voiceChannel?.id) !== interaction.user.id) {
            return interaction.reply({ content: '❌ Bạn phải đang ở trong phòng do chính bạn tạo để dùng chức năng này!', ephemeral: true });
        }

        // Xử lý nút bấm
        if (interaction.isButton()) {
            if (interaction.customId === 'rename') {
                const modal = new ModalBuilder().setCustomId('rename_modal').setTitle('Đổi tên phòng');
                const nameInput = new TextInputBuilder()
                    .setCustomId('room_name').setLabel('Nhập tên phòng mới').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                await interaction.showModal(modal);

            } else if (interaction.customId === 'limit') {
                const modal = new ModalBuilder().setCustomId('limit_modal').setTitle('Giới hạn người (Team CS2/Valo)');
                const limitInput = new TextInputBuilder()
                    .setCustomId('room_limit').setLabel('Số người (Ví dụ: 5. Nhập 0 để gỡ)').setStyle(TextInputStyle.Short).setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
                await interaction.showModal(modal);

            } else if (interaction.customId === 'lock') {
                // Toggle Khóa/Mở phòng
                const isLocked = voiceChannel.permissionsFor(interaction.guild.roles.everyone).has(PermissionsBitField.Flags.Connect) === false;
                await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    Connect: isLocked ? null : false // null là trả về mặc định (mở), false là khóa
                });
                await interaction.reply({ content: isLocked ? '🔓 Đã **mở** khóa phòng!' : '🔒 Đã **khóa** phòng!', ephemeral: true });
            }
        }

        // Xử lý dữ liệu nhập từ Modal
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'rename_modal') {
                const newName = interaction.fields.getTextInputValue('room_name');
                await voiceChannel.setName(newName);
                await interaction.reply({ content: `✅ Đã đổi tên phòng thành: **${newName}**`, ephemeral: true });

            } else if (interaction.customId === 'limit_modal') {
                const limit = parseInt(interaction.fields.getTextInputValue('room_limit'));
                if (isNaN(limit) || limit < 0 || limit > 99) {
                    return interaction.reply({ content: '❌ Vui lòng nhập một số hợp lệ từ 0 đến 99!', ephemeral: true });
                }
                await voiceChannel.setUserLimit(limit);
                await interaction.reply({ content: limit === 0 ? '✅ Đã gỡ giới hạn người!' : `✅ Đã giới hạn phòng: **${limit} người**`, ephemeral: true });
            }
        }
    }
});

client.login(process.env.TOKEN);
