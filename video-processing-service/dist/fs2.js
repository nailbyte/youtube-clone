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
exports.deleteProcessedVideo = exports.deleteRawVideo = exports.deleteFile = exports.uploadProcessedVideo = exports.downloadRawVideo = exports.convertVideo = exports.setUpDirectories = void 0;
const storage_1 = require("@google-cloud/storage");
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const storage = new storage_1.Storage();
const rawVideoBucketName = "jun-yt-raw-videos";
const processedVideoBucketName = "jun-yt-processed-videos";
const rawVideoDir = "./raw-videos";
const processedVideoDir = "./processed-videos";
//Function to create directories if they don't exist
function setUpDirectories() {
    ensureDirectoryExists(rawVideoDir);
    ensureDirectoryExists(processedVideoDir);
}
exports.setUpDirectories = setUpDirectories;
/*
* @param rawVideoName - name of the raw video file to be converted {@link rawVideoDir} }
* @param processedVideoName - name of the processed video file to be saved {@link processedVideoDir} }
* @returns Promise that resolves when the video conversion is complete
*/
function convertVideo(rawVideoName, processedVideoName) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(`${rawVideoDir}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:360") //scale the video to 360p
            .on("end", () => {
            console.log("Video conversion completed");
            resolve();
        })
            .on("error", (err) => {
            console.log(`An error occured: ${err.message}`); //log the error message
            reject(err);
        })
            .save(`${processedVideoDir}/${processedVideoName}`); //save the output video file to the specified path
    });
}
exports.convertVideo = convertVideo;
/*
* @param rawVideoName - name of the raw video file to be downloaded from the Cloud Storage bucket {@link rawVideoBucketName} }
* File to be downloaded from {@link rawVideoBucketName} to {@link rawVideoDir}
* @returns Promise that resolves when the raw video has been downloaded
*/
function downloadRawVideo(rawVideoName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield storage.bucket(rawVideoBucketName).file(rawVideoName).download({
            destination: `${rawVideoDir}/${rawVideoName}`
        });
        console.log(`Raw video ${rawVideoName} downloaded`);
    });
}
exports.downloadRawVideo = downloadRawVideo;
/*
* @param processedVideoName - name of the processed video file to be uploaded to the Cloud Storage bucket {@link processedVideoBucketName} }
* File to be uploaded from {@link processedVideoDir} to {@link processedVideoBucketName}
* @returns Promise that resolves when the processed video has been uploaded
*/
function uploadProcessedVideo(processedVideoName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield storage.bucket(processedVideoBucketName).upload(`${processedVideoDir}/${processedVideoName}`);
        yield storage.bucket(processedVideoBucketName).file(processedVideoName).makePublic();
        console.log(`Processed video ${processedVideoName} uploaded`);
    });
}
exports.uploadProcessedVideo = uploadProcessedVideo;
/*
* @param filePath - Path file to be deleted
* @returns Promise that resolves when the file has been deleted
*/
function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs_1.default.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist`);
            resolve();
        }
        else {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file @ ${filePath}`, err); // log the error message
                    reject(err);
                    return;
                }
                console.log(`File ${filePath} deleted`);
                resolve();
            });
        }
    });
}
exports.deleteFile = deleteFile;
//Clean up functions
/*
* @param fileName - name of the raw video file to be deleted from {@link rawVideoDir}
* @returns Promise that resolves when the raw video has been deleted
*/
function deleteRawVideo(fileName) {
    console.log(`Deleting raw video ${fileName}`);
    return deleteFile(`${rawVideoDir}/${fileName}`);
}
exports.deleteRawVideo = deleteRawVideo;
/*
* @param fileName - name of the process video file to be deleted from {@link processedVideoDir}
* @returns Promise that resolves when the raw video has been deleted
*/
function deleteProcessedVideo(fileName) {
    console.log(`Deleting processed video ${fileName}`);
    return deleteFile(`${processedVideoDir}/${fileName}`);
}
exports.deleteProcessedVideo = deleteProcessedVideo;
/**
 * Ensure a directory exists, if no directory exists, create one
 * @param dirPath - Path of the directory to be created
 */
function ensureDirectoryExists(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory ${dirPath} created`);
    }
}
