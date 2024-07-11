const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

const YOUTUBE_API_KEY = 'AIzaSyBgxyZNUqq64wVkJsI8MKjB-VNlsK3cbzk';

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', { query: '', videos: null });
});

app.get('/search', async (req, res) => {
    const query = req.query.q;
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                key: YOUTUBE_API_KEY,
                maxResults: 10
            }
        });
        const videos = response.data.items;

        // ดึงข้อมูลเพิ่มเติมสำหรับยอดวิว
        const videoIds = videos.map(video => video.id.videoId).join(',');
        const videoDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'statistics',
                id: videoIds,
                key: YOUTUBE_API_KEY
            }
        });
        const videoDetails = videoDetailsResponse.data.items;
        videos.forEach(video => {
            const videoDetail = videoDetails.find(detail => detail.id === video.id.videoId);
            video.statistics = videoDetail.statistics;
        });

        // บันทึกข้อมูลลงไฟล์ JSON
        const dataToSave = videos.map(video => ({
            id: video.id.videoId,
            title: video.snippet.title,
            thumbnails: video.snippet.thumbnails.medium.url,
            viewCount: video.statistics.viewCount,
            publishedAt: video.snippet.publishedAt
        }));
        fs.writeFileSync('video_data.json', JSON.stringify(dataToSave, null, 2));

       
        res.render('index', { query: query, videos: videos });
    } catch (error) {
        console.error(error);
        res.render('index', { videos: null });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
