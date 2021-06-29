import express from 'express'
import http from 'http'
import mongodb from 'mongodb'

const app = express();
const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST
const VIDEO_STORAGE_PORT = process.env.VIDEO_STORAGE_PORT
const DB_HOST = process.env.DB_HOST
const DB_NAME = process.env.DB_NAME

const client = mongodb.MongoClient(DB_HOST)

await client.connect()
const db = client.db(DB_NAME)
const videosCollection = db.collection('videos')

app.get("/video", async (req, res) => {
    try {
        const videoId = new mongodb.ObjectID(req.query.id)
        const videoRecord = await videosCollection.findOne({ _id: videoId })
        if (!videoRecord) {
            return res.sendStatus(404)
        }
    } catch (err) {
        console.error(err && err.stack || err)
        return res.sendStatus(500)
    }
    

    const forwardRequest = http.request({
        host: VIDEO_STORAGE_HOST,
        port: VIDEO_STORAGE_PORT,
        path: '/video?path=SampleVideo_1280x720_1mb.mp4',
        method: 'GET',
        headers: req.headers
    }, forwardResponse => {
        res.writeHeader(forwardResponse.statusCode, forwardResponse.headers)
        forwardResponse.pipe(res)
    })

    req.pipe(forwardRequest)
});

app.listen(PORT, () => {
    console.log(`video-streaming microservice online!`);
});
