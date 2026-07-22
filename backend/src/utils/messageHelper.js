//ham tai su dung logic (update thong tin cua 1 conversation sau khi 1 message duoc gui thanh cong)
export const updateConversationAfterCreateMessage = (
    conversation,
    message,
    senderId
) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId,
            createdAt: message.createdAt,
        },
    });

    conversation.participants.forEach((p) => {
        //vi id trong db thuong la objectId, can chuyen sang string de so sanh va lam key cho map
        const memberId = p.userId.toString();
        //kiem tra xem ai la nguoi gui
        const isSender = memberId === senderId.toString();
        //lay so tin nhan chua doc cua member, neu chua co gia tri se fallback = 0
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        //neu la nguoi gui thi set unreadCount = 0, nguoc lai thi tang len 1
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    });
};

export const emitNewMessage = (io, conversation, message) => {
    io.to(conversation._id.toString()).emit("new-message", {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
        },
        unreadCounts: conversation.unreadCounts,
    });
};