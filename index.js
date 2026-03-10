const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// CẤU HÌNH Ở ĐÂY
const TOKEN = 'TOKEN_BOT_CỦA_BẠN';
const JOIN_TO_CREATE_ID = 'ID_KÊNH_VOICE_MỒI'; // ID của kênh "Click để tạo room"
const CATEGORY_ID = 'ID_DANH_MỤC'; // ID của Category chứa các phòng

const activeRooms = new Map(); // Lưu trữ các phòng đã tạo

client.once('ready', () => {
    console.log(`Bot đã sẵn sàng! Đăng nhập dưới tên: ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;

    // 1. KHI NGƯỜI DÙNG NHẤN VÀO KÊNH "CLICK ĐỂ TẠO ROOM"
    if (newState.channelId === JOIN_TO_CREATE_ID) {
        try {
            const channel = await newState.guild.channels.create({
                name: `🔊 Phòng của ${user.username}`,
                type: ChannelType.GuildVoice,
                parent: CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: user.id,
                        allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers],
                    },
                ],
            });

            // Di chuyển người dùng vào phòng mới
            await newState.setChannel(channel);
            activeRooms.set(channel.id, user.id);
            console.log(`Đã tạo phòng cho ${user.username}`);
        } catch (error) {
            console.error('Lỗi khi tạo phòng:', error);
        }
    }

    // 2. KHI PHÒNG TRỐNG (KHÔNG CÒN AI) -> TỰ ĐỘNG XÓA
    if (oldState.channelId && oldState.channelId !== JOIN_TO_CREATE_ID) {
        const oldChannel = oldState.guild.channels.cache.get(oldState.channelId);
        
        // Kiểm tra nếu phòng này nằm trong danh mục và không còn ai
        if (oldChannel && oldChannel.parentId === CATEGORY_ID && oldChannel.members.size === 0) {
            try {
                await oldChannel.delete();
                activeRooms.delete(oldChannel.id);
                console.log(`Đã xóa phòng trống: ${oldChannel.name}`);
            } catch (error) {
                console.error('Lỗi khi xóa phòng:', error);
            }
        }
    }
});

client.login(TOKEN);
