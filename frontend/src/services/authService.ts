import api from "@/lib/axios";

export const authService = {
    //them vao cac thong tin de dang ky tai khoan
    signUp: async (
        username: string,
        password: string,
        email: string,
        firstName: string,
        lastName: string
    ) => {
        //goi api signup
        const res = await api.post(
            "/auth/signup",
            //gui kem thong tin body
            { username, password, email, firstName, lastName },
            { withCredentials: true }
        );

        return res.data;
    },

    signIn: async (username: string, password: string) => {
        const res = await api.post(
            "auth/signin",
            { username, password },
            { withCredentials: true }
        );
        return res.data; //access token server gui lai
    },

    signOut: async () => {
        return api.post("/auth/signout", { withCredentials: true });
    },

    fetchMe: async () => {
        const res = await api.get("/users/me", { withCredentials: true });
        return res.data.user;
    },

    refresh: async () => {
        const res = await api.post("/auth/refresh", { withCredentials: true });
        return res.data.accessToken;
    },
};