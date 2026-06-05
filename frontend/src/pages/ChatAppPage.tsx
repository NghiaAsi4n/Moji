import Logout from "@/components/auth/Logout";
import { useAuthStore } from "@/stores/useAuthStore";

const ChatAppPage = () => {
    const user = useAuthStore((s) => s.user); //chi lay user trong store, component se render khi user thay doi

    return (
        <div>
            {user?.username}
            <Logout />
        </div>
    );
};

export default ChatAppPage;