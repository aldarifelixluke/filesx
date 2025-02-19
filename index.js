const express = require('express');
const axios = require('axios');
const { URLSearchParams } = require('url');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Set JSON spaces for prettier formatting
app.set('json spaces', 2); // Added this line

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

app.get('/', async (req, res) => {
  const username = req.query.username;
  const lang = req.query.lang || "id";

  const response = {
    status: false,
    author: 'Sli',
    message: 'Username parameter not found.'
    
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
        q: `Buat roasting yang SANGAT KASAR dan AGRESIF untuk user @${user.username || ""} berdasarkan data berikut:\n` +
          `Full name: ${user.full_name || ""}\n` +
          `Followers: ${user.follower_count || ""}\n` +
          `Following: ${user.following_count || ""}\n` +
          `Posts: ${user.media_count || ""}\n` +
          `Bio: ${user.biography || ""}\n` +
          `Profile: ${user.is_private ? "Private" : "Public"}\n` +
          `Verification: ${user.is_verified ? "Ya" : "Tidak"}\n` +
          `Business: ${user.is_business ? "Ya" : "Tidak"}\n` +
          `Photo profile: ` +
          `Info: (cari info tentang namanya jika terkenal maka cari kasus atau berita viral yang bersangkutan) ` +
          `Roasting harus SEPEDAS mungkin, gunakan bahasa yang SANGAT VULGAR, TOXIC, dan penuh hinaan. Jangan ada ampun, semua aspek harus diroasting habis-habisan, termasuk foto profil. Gunakan bahasa seperti meme culture, bahasa Gaul/Slang yang paling kasar. Jangan dimulai dengan username. Buat dalam satu kategori: very_sarcastic (dengan kata-kata kasar toxic parah). Buat dalam bahasa: ${lang}, hanya untuk teksnya saja yang berbahasa ${lang}. Buat respon dalam format seperti: [very_sarcastic: text...]`,
        uid: Math.random().toString(36).substring(2, 7),
        imageUrl: user.profile_pic_url_hd || ""
      };

      try {
        const params = new URLSearchParams(data);
        // Jalankan kedua panggilan API secara bersamaan untuk mengurangi waktu tunggu.
        const [kaizResponse] = await Promise.all([
          axios.get(`${url}?${params.toString()}`)
        ]);

        if (kaizResponse.status === 200) {
          const resFromKaiz = kaizResponse.data;

          if (resFromKaiz.response) {
            const text = resFromKaiz.response;
            const regex = /\[very_sarcastic:(.*?)\]/i; // Changed regex
            const match = text.match(regex);

            if (match && match[1]) {
              response.status = true;
              response.message = 'Data retrieved successfully';
              response.result = match[1].trim().replace(/\s+/g, ' '); // Directly assign the roast
              res.status(200).json(response);
            } else {
              response.message = 'Failed to extract roasting text.';
              console.error('No roasting text found in response:', text);
              res.status(422).json(response);
            }

          } else {
            response.message = 'Failed to get a response from the API.';
            console.error('API response error:', resFromKaiz);
            res.status(422).json(response);
          }
        } else {
          response.message = 'Failed to connect to the API.';
          console.error('API HTTP error:', kaizResponse.status, kaizResponse.statusText);
          res.status(500).json(response);
        }
      } catch (kaizError) {
        response.message = 'Error calling API.';
        console.error('Error calling API:', kaizError);
        res.status(500).json(response);
      }
    } else {
      response.message = 'Username not found or an error occurred with the Instagram API.';
      if (user === null) {
        response.message = 'User not found or API error.';
      }
      res.status(404).json(response);
    }
  } catch (error) {
    console.error("Error:", error);
    response.message = 'An internal error occurred.';
    res.status(500).json(response);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
