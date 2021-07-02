import express from 'express'
import http from 'http'
import mongodb from 'mongodb'
import amqp from 'amqplib'

const app = express();
const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST
const VIDEO_STORAGE_PORT = process.env.VIDEO_STORAGE_PORT
const DB_HOST = process.env.DB_HOST
const DB_NAME = process.env.DB_NAME
const RABBIT = process.env.RABBIT

const client = mongodb.MongoClient(DB_HOST)

await client.connect()
const messagingConnection = await amqp.connect(RABBIT)
const messageChannel = await messagingConnection.createChannel()
const db = client.db(DB_NAME)
const videosCollection = db.collection('videos')

const sendViewedMessage = (messageChannel, videoPath) => {
    const msg = { videoPath }
    const jsonMsg = JSON.stringify(msg)

    messageChannel.publish('', 'viewed', Buffer.from(jsonMsg))

    // const postOptions = {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // }

    // const req = http.request('http://history/viewed', postOptions)

    // req.on('close', () => {})
    // req.on('error', err => {})

    // req.write(JSON.stringify(msg))
    // req.end()
}

app.get("/video", async (req, res) => {
    try {
        const videoId = new mongodb.ObjectID(req.query.id)
        const videoRecord = await videosCollection.findOne({ _id: videoId })
        if (!videoRecord) {
            return res.sendStatus(404)
        }

        sendViewedMessage(messageChannel, videoRecord.videoPath)
    } catch (err) {
        console.error(err && err.stack || err)
        return res.sendStatus(500)
    }
    

    // const forwardRequest = http.request({
    //     host: VIDEO_STORAGE_HOST,
    //     port: VIDEO_STORAGE_PORT,
    //     path: '/video?path=SampleVideo_1280x720_1mb.mp4',
    //     method: 'GET',
    //     headers: req.headers
    // }, forwardResponse => {
    //     res.writeHeader(forwardResponse.statusCode, forwardResponse.headers)
    //     forwardResponse.pipe(res)
    // })

    // req.pipe(forwardRequest)
    
});

app.listen(PORT, () => {
    console.log(`video-streaming microservice online!`);
});
