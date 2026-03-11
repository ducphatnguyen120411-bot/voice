const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// THAY ID THẬT CỦA BẠN VÀO ĐÂY
const JOIN_TO_CREATE_ID = '1465369594179883089'; // ID kênh "Click để tạo room"
const CATEGORY_ID = '1465369594179883087';      // ID Danh mục "Voice Gaming"

client.once('ready', () => {
    console.log(`✅ BOT ĐÃ ONLINE: ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    // Logic khi người dùng vào kênh mồi
    if (newState.channelId === JOIN_TO_CREATE_ID) {
        const guild = newState.guild;
        const category = guild.channels.cache.get(CATEGORY_ID);
        if (!category) return;

        // Tính toán số phòng dựa trên các phòng hiện có trong danh mục
        const existingRooms = category.children.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== JOIN_TO_CREATE_ID);
        let roomNumber = 1;
        while (existingRooms.some(r => r.name.includes(`Phòng ${roomNumber}`))) {
            roomNumber++;
        }

        const channel = await guild.channels.create({
            name: `🔊 ・ Phòng ${roomNumber}`,
            type: ChannelType.GuildVoice,
            parent: CATEGORY_ID,
            permissionOverwrites: [
                { id: newState.member.id, allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers] }
            ]
        });

        return newState.setChannel(channel);
    }

    // Tự động xóa phòng khi trống
    if (oldState.channel && oldState.channel.parentId === CATEGORY_ID && oldState.channelId !== JOIN_TO_CREATE_ID) {
        if (oldState.channel.members.size === 0) {
            await oldState.channel.delete().catch(() => null);
        }
    }
});

// Dòng này để Railway tự đọc Token từ Variables, không dán token vào đây!
client.login(process.env.TOKEN);
