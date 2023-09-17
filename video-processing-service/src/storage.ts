import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

const storage = new Storage();

const rawVideoBucketName = "jun-yt-raw-videos";
const processedVideoBucketName = "jun-yt-processed-videos";

const rawVideoDir = "./raw-videos";
const processedVideoDir = "./processed-videos";

//Function to create directories if they don't exist
export function setUpDirectories() {
    ensureDirectoryExists(rawVideoDir);
    ensureDirectoryExists(processedVideoDir);
}

/*
* @param rawVideoName - name of the raw video file to be converted {@link rawVideoDir} }
* @param processedVideoName - name of the processed video file to be saved {@link processedVideoDir} }
* @returns Promise that resolves when the video conversion is complete
*/
export function convertVideo(rawVideoName: string, processedVideoName: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(`${rawVideoDir}/${rawVideoName}`)
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

/*
* @param rawVideoName - name of the raw video file to be downloaded from the Cloud Storage bucket {@link rawVideoBucketName} }
* File to be downloaded from {@link rawVideoBucketName} to {@link rawVideoDir}
* @returns Promise that resolves when the raw video has been downloaded
*/
export async function downloadRawVideo(rawVideoName: string) {
  await storage.bucket(rawVideoBucketName).file(rawVideoName).download({
    destination: `${rawVideoDir}/${rawVideoName}`
  });
  console.log(`Raw video ${rawVideoName} downloaded`);
}

/*
* @param processedVideoName - name of the processed video file to be uploaded to the Cloud Storage bucket {@link processedVideoBucketName} }
* File to be uploaded from {@link processedVideoDir} to {@link processedVideoBucketName}
* @returns Promise that resolves when the processed video has been uploaded
*/
export async function uploadProcessedVideo(processedVideoName: string) {
  await storage.bucket(processedVideoBucketName).upload(`${processedVideoDir}/${processedVideoName}`);
  await storage.bucket(processedVideoBucketName).file(processedVideoName).makePublic();
  console.log(`Processed video ${processedVideoName} uploaded`);
}

/*
* @param filePath - Path file to be deleted
* @returns Promise that resolves when the file has been deleted
*/
export function deleteFile(filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist`);
            resolve();
        } else {
            fs.unlink(filePath, (err) => {
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

//Clean up functions

/*
* @param fileName - name of the raw video file to be deleted from {@link rawVideoDir}
* @returns Promise that resolves when the raw video has been deleted
*/
export function deleteRawVideo(fileName: string) {
  console.log(`Deleting raw video ${fileName}`);
  return deleteFile(`${rawVideoDir}/${fileName}`);
}

/*
* @param fileName - name of the process video file to be deleted from {@link processedVideoDir}
* @returns Promise that resolves when the raw video has been deleted
*/
export function deleteProcessedVideo(fileName: string) {
  console.log(`Deleting processed video ${fileName}`);
  return deleteFile(`${processedVideoDir}/${fileName}`);
}

/**
 * Ensure a directory exists, if no directory exists, create one
 * @param dirPath - Path of the directory to be created
 */
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory ${dirPath} created`);
  }
}