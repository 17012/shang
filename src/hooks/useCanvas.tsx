import React, { useState } from "react";
import { createContext, useContext } from "react";
import { fabric } from "fabric-with-gestures";
import { createFileList } from "../utils";

export interface MediaExportType {
  ({ name: string, duration: number }): Promise<FileList>;
}
export interface CanvasContextType {
  canvas: any;
  mediaFileList: FileList | undefined;
  createCanvas(canvas: any): void;
  addImage(iamgeURL: string): void;
  addVideo(videoEl: HTMLVideoElement): void;
  exportCapturingCanvas(MediaExportType): Promise<FileList>;
}

export const CanvasContext = createContext<CanvasContextType | undefined>(
  undefined
);
export const useCanvas = () => {
  const ctx = useContext(CanvasContext);
  if (ctx === undefined) {
    throw new Error("Canvas Context must be used within CanvasProvider");
  }
  return ctx;
};

export const CanvasProvider: React.FC = ({ children }) => {
  const [canvas, setCanvas] = useState();
  const [mediaFileList, setMediaFileList] = useState<FileList>();

  const createCanvas = (canvas: any) => {
    setCanvas(canvas);
  };

  const addImage = (fileURL: string) => {
    fabric.Image.fromURL(fileURL, (oImg) => {
      canvas.add(oImg);
    });
  };

  const addVideo = (videoEl: HTMLVideoElement) => {
    console.log("addvideo", canvas.getWidth() / 2);
    var video1 = new fabric.Image(videoEl, {
      left: 200,
      top: 200,
      originX: "center",
      originY: "center",
      objectCaching: false,
    });
    canvas.add(video1);
    video1.getElement().play();

    fabric.util.requestAnimFrame(function render() {
      canvas.renderAll();
      fabric.util.requestAnimFrame(render);
      console.log("render");
    });
  };

  const exportCapturingCanvas: MediaExportType = ({
    name = "myvid.mp4",
    duration = 5000,
  }) => {
    return new Promise((resolve, reject) => {
      try {
        const canvasEl = document.getElementById("canvas") as HTMLCanvasElement;
        if (!canvasEl) {
          return reject("Canvas Element is not assign");
        }
        // @ts-ignore: Type handling is conflict itself.
        const stream = canvasEl.captureStream();
        const chunks: Blob[] = [];
        const rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => {
          chunks.push(e.data);
        };
        rec.onstart = (e) => {
          console.log("start rec");
          canvas.getObjects().map((klass) => {
            console.log(klass);
            if (klass?._element?.nodeName === "VIDEO") {
              klass._element.pause();
              klass._element.currentTime = 0;
              klass._element.play();
            }
          });
        };
        rec.onstop = (e) => {
          console.log("end rec => ", chunks);
          const media = new File(chunks, name, { type: "video/mp4" });
          const fileList = createFileList([media]);
          setMediaFileList(fileList);
          resolve(fileList);
        };
        rec.start();
        setTimeout(() => rec.stop(), duration);
      } catch (err) {
        reject(err);
      }
    });
  };

  const ctx = {
    canvas,
    mediaFileList,
    exportCapturingCanvas,
    addImage,
    addVideo,
    createCanvas,
  };

  return (
    <CanvasContext.Provider value={ctx}>{children}</CanvasContext.Provider>
  );
};
