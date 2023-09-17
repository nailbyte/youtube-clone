"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_1 = require("./storage");
const firestore_1 = require("./firestore");
(0, storage_1.setUpDirectories)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.post('/process-video', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Get the bucket and filename from the cloud pub/sub message
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString(`utf8`);
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error(`Invalid message payload received`);
        }
    }
    catch (err) {
        console.error(err);
        res.status(400).send(`Bad Request: missing file name`);
        return;
    }
    const inputFileName = data.name;
    const processedFileName = `processed-${inputFileName}`;
    //Check if the video is new or has already been processed or is processing
    const videoId = inputFileName.split('.')[0];
    const isNewVideo = yield (0, firestore_1.isVideoNew)(videoId);
    if (!isNewVideo) {
        console.log(`Video ${inputFileName} has already been processed`);
        res.status(200).send(`Video processing complete`);
        return;
    }
    {
        yield (0, firestore_1.setVideo)(videoId, {
            id: videoId,
            uid: videoId.split('-')[0],
            status: 'processing'
        });
    }
    //Download the video from the Cloud Storage bucket
    yield (0, storage_1.downloadRawVideo)(inputFileName);
    yield (0, firestore_1.setVideo)(videoId, {
        status: 'processed',
        filename: processedFileName
    });
    //Convert the video
    try {
        yield (0, storage_1.convertVideo)(inputFileName, processedFileName);
    }
    catch (err) {
        yield Promise.all([
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteProcessedVideo)(processedFileName)
        ]);
        console.error(err);
        res.status(500).send(`Internal Server Error: video conversion failed`);
        return;
    }
    //Upload the processed video to the Cloud Storage bucket
    yield (0, storage_1.uploadProcessedVideo)(processedFileName);
    yield Promise.all([
        (0, storage_1.deleteRawVideo)(inputFileName),
        (0, storage_1.deleteProcessedVideo)(processedFileName)
    ]);
    return res.status(200).send(`Video processing complete`);
}));
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video processing service listening at http://localhost:${port}`);
});
