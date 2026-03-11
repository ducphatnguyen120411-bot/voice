const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// ID THẬT CỦA BẠN (Mình đã giữ nguyên)
const JOIN_TO_CREATE_ID = '1465369594179883089'; 
const CATEGORY_ID = '1465369594179883087';      

client.once('ready', () => {
    console.log(`✅ BOT ĐÃ ONLINE: ${client.user.tag}`);
    console.log(`🚀 Sẵn sàng tạo phòng cho anh em!`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    // KHI CÓ NGƯỜI BẤM VÀO KÊNH MỒI
    if (newState.channelId === JOIN_TO_CREATE_ID) {
        const guild = newState.guild;
        const category = guild.channels.cache.get(CATEGORY_ID);
        if (!category) return;

        // Tính toán số phòng
        const existingRooms = category.children.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== JOIN_TO_CREATE_ID);
        let roomNumber = 1;
        while (existingRooms.some(r => r.name.includes(`Phòng ${roomNumber}`))) {
            roomNumber++;
        }

        try {
            const channel = await guild.channels.create({
                name: `🔊 ・ Phòng ${roomNumber}`,
                type: ChannelType.GuildVoice,
                parent: CATEGORY_ID,
                permissionOverwrites: [
                    { id: newState.member.id, allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers] }
                ]
            });

            await newState.setChannel(channel);
            console.log(`🏠 Đã tạo [Phòng ${roomNumber}] cho ${newState.member.user.username}`);
        } catch (error) {
            console.error("❌ Lỗi khi tạo phòng (Có thể do Bot chưa có quyền Quản lý Kênh):", error.message);
        }
    }

    // TỰ ĐỘNG XÓA PHÒNG TRỐNG
    if (oldState.channel && oldState.channel.parentId === CATEGORY_ID && oldState.channelId !== JOIN_TO_CREATE_ID) {
        if (oldState.channel.members.size === 0) {
            await oldState.channel.delete().catch(() => null);
            console.log(`🗑️ Đã xóa phòng trống.`);
        }
    }
});

// ==========================================
// HỆ THỐNG KIỂM TRA BẮT LỖI RAILWAY Ở ĐÂY
// ==========================================
const token = process.env.TOKEN;

if (!token) {
    console.log("=========================================");
    console.error("❌ LỖI NGHIÊM TRỌNG: RAILWAY KHÔNG TÌM THẤY TOKEN!");
    console.error("👉 Hãy vào tab 'Variables' trên Railway để thêm biến TOKEN.");
    console.log("=========================================");
    process.exit(1); // Dừng lại luôn để không in ra đống lỗi đỏ nữa
}

client.login(token).catch(err => {
    console.log("=========================================");
    console.error("❌ LỖI ĐĂNG NHẬP: TOKEN BỊ SAI HOẶC BỊ DISCORD KHÓA!");
    console.error("👉 Hãy Reset Token mới trên Discord Developer Portal và dán lại vào Railway.");
    console.error("Chi tiết lỗi:", err.message);
    console.log("=========================================");
});
