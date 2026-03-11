const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// THAY ĐỔI ID Ở ĐÂY
const JOIN_TO_CREATE_ID = '1465369594179883089'; 
const CATEGORY_ID = '1465369594179883087'; 

client.once('ready', () => {
    console.log(`✅ Bot FPS PRO đã online: ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;

    // 1. KHI NGƯỜI DÙNG NHẤN VÀO KÊNH MỒI
    if (newState.channelId === JOIN_TO_CREATE_ID) {
        try {
            const guild = newState.guild;
            const category = guild.channels.cache.get(CATEGORY_ID);

            // Lấy các phòng hiện có để tính số thứ tự (Phòng 1, Phòng 2...)
            const existingRooms = category.children.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== JOIN_TO_CREATE_ID);
            
            let roomNumber = 1;
            const roomNames = existingRooms.map(r => r.name);
            while (roomNames.some(name => name.includes(`Phòng ${roomNumber}`))) {
                roomNumber++;
            }

            const channel = await guild.channels.create({
                name: `🔊・Phòng ${roomNumber}`,
                type: ChannelType.GuildVoice,
                parent: CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: user.id,
                        allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers],
                    },
                    {
                        id: guild.id, // Mọi người đều vào được
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
                    }
                ],
            });

            await newState.setChannel(channel);
            console.log(`🏠 Đã tạo Phòng ${roomNumber} cho ${user.username}`);
        } catch (error) {
            console.error('❌ Lỗi tạo phòng:', error);
        }
    }

    // 2. TỰ ĐỘNG XÓA KHI PHÒNG TRỐNG
    if (oldState.channelId && oldState.channelId !== JOIN_TO_CREATE_ID) {
        const oldChannel = oldState.guild.channels.cache.get(oldState.channelId);
        
        if (oldChannel && oldChannel.parentId === CATEGORY_ID && oldChannel.members.size === 0) {
            try {
                await oldChannel.delete();
                console.log(`🗑️ Đã xóa phòng trống: ${oldChannel.name}`);
            } catch (error) {
                // Tránh lỗi nếu phòng đã bị xóa trước đó
            }
        }
    }
});

// DÒNG NÀY LÀ QUAN TRỌNG NHẤT ĐỂ CHẠY TRÊN RAILWAY
client.login(process.env.TOKEN);
