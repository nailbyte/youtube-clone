import express from 'express';
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setUpDirectories, uploadProcessedVideo } from './storage';

import { isVideoNew, setVideo } from "./firestore";

setUpDirectories();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/process-video', async (req, res) => {
    //Get the bucket and filename from the cloud pub/sub message
    let data;
    try {
      const message = Buffer.from(req.body.message.data, 'base64').toString(`utf8`);
      data = JSON.parse(message);
      if (!data.name) {
        throw new Error(`Invalid message payload received`);
      }
    } catch (err) {
      console.error(err);
      res.status(400).send(`Bad Request: missing file name`);
      return;
    }
    const inputFileName = data.name;
    const processedFileName = `processed-${inputFileName}`;

    //Check if the video is new or has already been processed or is processing
    const videoId = inputFileName.split('.')[0];
    const isNewVideo = await isVideoNew(videoId);
    if (!isNewVideo) {
      console.log(`Video ${inputFileName} has already been processed`);
      res.status(200).send(`Video processing complete`);
      return;
    } {
      await setVideo(videoId, {
        id: videoId,
        uid: videoId.split('-')[0], //This is buggy and heavily depends on videoId genertation technique
        status: 'processing'
      });
    }

    //Download the video from the Cloud Storage bucket
    await downloadRawVideo(inputFileName);

    await setVideo(videoId, {
      status: 'processed',
      filename: processedFileName
    });

    //Convert the video
    try {
      await convertVideo(inputFileName, processedFileName);
    } catch (err) {
      await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(processedFileName)
      ]);
      console.error(err);
      res.status(500).send(`Internal Server Error: video conversion failed`);
      return;
    }


    //Upload the processed video to the Cloud Storage bucket
    await uploadProcessedVideo(processedFileName);
    
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(processedFileName)
    ]);

    return res.status(200).send(`Video processing complete`);
});
    
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Video processing service listening at http://localhost:${port}`);
});