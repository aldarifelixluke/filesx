const express = require('express');
const axios = require('axios');
const { URLSearchParams } = require('url'); // Import URLSearchParams

const app = express();
const port = 3000; // Or any port you prefer

// Middleware to parse JSON request bodies
app.use(express.json());

// Function to get Instagram profile data
async function getInstagramProfile(username) {
    if (!username) return null;

    const apiUrl = `https://ccprojectapis.ddns.net/api/insta/stalk?ig=${username}`;

    try {
        const response = await axios.get(apiUrl);

        if (response.status === 200) {
            const data = response.data;

            if (Array.isArray(data) && data.length > 0 && !data.message) {
                return data[0];
            } else {
                const error = data.message || JSON.stringify(data);
                console.error("API response error:", error);
                return null;
            }
        } else {
            console.error("HTTP error:", response.status);
            return null;
        }
    } catch (error) {
        console.error("Error fetching Instagram profile:", error);
        return null;
    }
}

app.get('/api/roast', async (req, res) => {
    const username = req.query.username;
    const lang = req.query.lang || "id";

    let response = {
        status: false,
        author: 'Sli',
        message: 'Username parameter not found.',
        result: []
    };

    if (!username) {
        res.status(404).json(response);
        return;
    }

    try {
        const user = await getInstagramProfile(username);

        if (user) {
            const url = "https://kaiz-apis.gleeze.com/api/gemini-vision";
            const data = {
                q: `Buat roasting lucu untuk user @${user.username || ""} berdasarkan data berikut:\n` +
                    `Full name: ${user.full_name || ""}\n` +
                    `Followers: ${user.follower_count || ""}\n` +
                    `Following: ${user.following_count || ""}\n` +
                    `Posts: ${user.media_count || ""}\n` +
                    `Bio: ${user.biography || ""}\n` +
                    `Profile: ${user.is_verified ? "Private" : "Public"}\n` +
                    `Business: ${user.is_business ? "Yes" : "No"}\n` +
                    `category: ${user.category || ""}\n` +
                    `Photo profile: ` +
                    `Info: (cari info tentang namanya jika terkenal maka cari kasus atau berita viral yang bersangkutan) ` +
                    `Roasting harus tajam, dan roasting semua aspek (data yang diberikan) dan foto profile (analisis). Buat 10-20 kalimat per kategori dan jangan dimulai dengan username. Gunakan bahasa seperti meme culture dan bahasa Gaul/Slang dan vulgar. Buat dalam tiga kategori: casual, friendly, mildly_sarcastic (sedikit kasar), sarcastic (kasar), very_sarcastic (dengan kata-kata kasar toxic parah). Buat dalam bahasa: ${lang}, hanya untuk teksnya saja yang berbahasa ${lang}. Buat respon dalam format seperti: [kategori: text...]`,
                uid: Math.random().toString(36).substring(2, 7), // More concise UID generation
                imageUrl: user.profile_pic_url_hd || ""
            };


            try {
                const params = new URLSearchParams(data);
                const kaizResponse = await axios.get(`${url}?${params.toString()}`);

                if (kaizResponse.status === 200) {
                    const resFromKaiz = kaizResponse.data;

                    if (resFromKaiz.response) {
                        const text = resFromKaiz.response;
                        const roast = {
                            casual: "",
                            friendly: "",
                            mildly_sarcastic: "",
                            sarcastic: "",
                            very_sarcastic: ""
                        };

                        const regex = /\[(.*?)\]/g;
                        let match;

                        while ((match = regex.exec(text)) !== null) {
                            const [fullMatch, content] = match; // Destructure the result
                            const [category, ...rest] = content.split(':').map(s => s.trim());
                            const contentText = rest.join(':').trim(); // handles cases where there might be a colon in the content
                            if (roast.hasOwnProperty(category)) {
                                roast[category] = contentText;
                            }
                        }

                        response = {
                            status: true,
                            author: 'Sli',
                            message: 'Data retrieved successfully',
                            result: roast
                        };
                        res.status(200).json(response);

                    } else {
                        response = {
                            status: false,
                            author: 'Sli',
                            message: 'Failed to get a response from the API.',
                            result: []
                        };
                        console.error('API response from Kaiz error:', resFromKaiz);
                        res.status(422).json(response);
                    }
                } else {
                    response = {
                        status: false,
                        author: 'Sli',
                        message: 'Failed to connect to the API.',
                        result: []
                    };
                    console.error('Kaiz API HTTP error:', kaizResponse.status, kaizResponse.statusText);
                    res.status(500).json(response);
                }
            } catch (kaizError) {
                response = {
                    status: false,
                    author: 'Sli',
                    message: 'Error calling Kaiz API.',
                    result: []
                };
                console.error('Error calling Kaiz API:', kaizError);
                res.status(500).json(response);
            }

        } else {
            response = {
                status: false,
                author: 'Sli',
                message: 'Username not found or an error occurred with the Instagram API.',
                result: []
            };
             if(user === null){
                 response.message = 'User not found or API error.';
             }

            res.status(404).json(response);
        }
    } catch (error) {
        console.error("Error:", error);
        response = {
            status: false,
            author: 'Sli',
            message: 'An internal error occurred.',
            result: []
        };
        res.status(500).json(response);
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});