import express from 'express'
import mongodb from 'mongodb'
import amqp from 'amqplib'

const DB_HOST = process.env.DB_HOST
const DB_NAME = process.env.DB_NAME
const RABBIT = process.env.RABBIT

const client = mongodb.MongoClient(DB_HOST)
const PORT = process.env.PORT || 3000
const app = express()

await client.connect()
const messagingConnection = await amqp.connect(RABBIT)
const messageChannel = await messagingConnection.createChannel()
const db = client.db(DB_NAME)
const videosCollection = db.collection('videos')


const consumeViewedMessage = async msg => {
    const parsedMsg = JSON.parse(msg.content.toString())
    await videosCollection.insertOne({ videoPath: parsedMsg.videoPath })
    messageChannel.ack(msg)
}

await messageChannel.assertQueue('viewed', {})
await messageChannel.consume('viewed', consumeViewedMessage)

app.use(express.json())

app.post('/viewed', async (req, res) => {
    const { videoPath } = req.body
    try {
        await videosCollection.insertOne({ videoPath })
        console.log(`Added video ${videoPath} to history`)
        res.sendStatus(200)
    } catch (err) {
        console.error(`Error adding video ${videoPath} to history`)
        console.error(err)
        res.sendStatus(500)
    }

})

app.listen(PORT, () => {
    console.log("hello, computer!")
})