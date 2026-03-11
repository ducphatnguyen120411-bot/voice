const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// === CHỈ SỬA 2 DÒNG ID DƯỚI ĐÂY ===
const JOIN_TO_CREATE_ID = '1465369594179883089'; // Chuột phải vào kênh "Click để tạo room" -> Copy ID
const CATEGORY_ID = '1465369594179883087';           // Chuột phải vào tên Danh mục "Voice Gaming" -> Copy ID
// ===============================

client.once('ready', () => {
    console.log(`✅ BOT ĐÃ ONLINE: ${client.user.tag}`);
    console.log(`🚀 Sẵn sàng phục vụ anh em FPS PRO!`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;

    // 1. KHI NGƯỜI DÙNG NHẤN VÀO KÊNH MỒI
    if (newState.channelId === JOIN_TO_CREATE_ID) {
        try {
            const guild = newState.guild;
            const category = guild.channels.cache.get(CATEGORY_ID);
            if (!category) return console.error("Không tìm thấy Category!");

            // Lấy danh sách phòng hiện có để tính số thứ tự (Phòng 1, Phòng 2...)
            const existingRooms = category.children.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== JOIN_TO_CREATE_ID);
            
            let roomNumber = 1;
            const roomNames = existingRooms.map(r => r.name);
            while (roomNames.some(name => name.includes(`Phòng ${roomNumber}`))) {
                roomNumber++;
            }

            // Tạo phòng mới giống hệt ảnh mẫu
            const channel = await guild.channels.create({
                name: `🔊 ・ Phòng ${roomNumber}`, 
                type: ChannelType.GuildVoice,
                parent: CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: user.id, // Chủ phòng có quyền chỉnh sửa, kéo người
                        allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers],
                    },
                    {
                        id: guild.id, // Mọi người khác đều thấy và vào được
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
                    }
                ],
            });

            // Tự động kéo người dùng vào phòng vừa tạo
            await newState.setChannel(channel);
            console.log(`🏠 Đã tạo: Phòng ${roomNumber} cho ${user.username}`);

        } catch (error) {
            console.error('❌ Lỗi tạo phòng:', error);
        }
    }

    // 2. TỰ ĐỘNG XÓA KHI PHÒNG TRỐNG
    if (oldState.channelId && oldState.channelId !== JOIN_TO_CREATE_ID) {
        const oldChannel = oldState.guild.channels.cache.get(oldState.channelId);
        
        // Kiểm tra nếu phòng thuộc Category quản lý và không còn ai
        if (oldChannel && oldChannel.parentId === CATEGORY_ID && oldChannel.members.size === 0) {
            try {
                await oldChannel.delete();
                console.log(`🗑️ Đã xóa phòng trống: ${oldChannel.name}`);
            } catch (error) {
                // Phòng có thể đã bị xóa thủ công trước đó
            }
        }
    }
});

// QUAN TRỌNG: Railway sẽ dùng biến này để login
client.login(process.env.TOKEN);
