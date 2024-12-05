"use client";

import { CloudUpload, FileImage, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import axios from "axios";
import { cn } from "@/lib/utils";

export default function FileUpload() {
  const [count, setCount] = useState(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false)
  const [fileInfo, setFileInfo] = useState<{
    imageUrl: string;
    fileName: string;
    imageFile: File;
    fileSize: number;
  } | null>();
  const [compressedFileInfo, setCompressedFileInfo] = useState<{
    imageUrl: string;
    fileName: string;
    imageFile: File;
    fileSize: number;
  } | null>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
    const reader = new FileReader();
    const file = acceptedFiles[0];

    reader.onload = (e) => {
      if (e.target) {
        setFileInfo({
          imageUrl: e.target.result as string,
          fileName: file.name,
          fileSize: file.size,
          imageFile: file,
        });
      }
    };

    reader.readAsDataURL(acceptedFiles[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCancelFile = () => {
    setFileInfo(null)
    setCompressedFileInfo(null)
  }

  const handleCompressFile = async () => {
    setIsCompressing(true);
    setCount(0);
    
    const progInterval = setInterval(() => {
      setCount((prev) => {
        if (prev >= 90 && isCompressing) {
          return 90;
        }
        return prev + 10;
      });
    }, 100);
  
    if (fileInfo?.imageFile) {
      try {
        const formData = new FormData();
        formData.append("picture", fileInfo.imageFile);
        
        const res = await axios.post<Blob>("http://16.171.145.152/upload", formData, {
          responseType: "blob", // Important for handling file downloads
        });
        
        // Create a new File from the response
        const compressedFile = new File([res.data], "compressed_image.jpg", {
          type: res.data.type, // Preserve the original mime type
        });
  
        // Revoke the previous URL if it exists
        if (compressedFileInfo?.imageUrl) {
          URL.revokeObjectURL(compressedFileInfo.imageUrl);
        }
  
        // Update state with compressed file details
        const newImageUrl = URL.createObjectURL(compressedFile);
        setCompressedFileInfo({
          fileName: compressedFile.name,
          fileSize: compressedFile.size,
          imageFile: compressedFile,
          imageUrl: newImageUrl, // Create a preview URL
        });
      } catch (error) {
        console.error("File upload/compression failed", error);
      } finally {
        setIsCompressing(false);
        clearInterval(progInterval);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-[#50586C] flex flex-col items-center justify-center">
      <div className="rounded-3xl bg-[#DCE2F0] flex flex-col px-6 lg:px-8 pt-[4rem] pb-[2.5rem]">
        <h1 className="text-3xl font-semibold tracking-tight text-center text-[#060707]">
          Upload your images
        </h1>
        <p className="text-[#555E71] text-base/7 font-normal text-center mt-2 mb-8">
          PNG, JPG and GIF files are allowed
        </p>
        {!fileInfo?.imageUrl ? (
          <div
            {...getRootProps()}
            className=" border-2 border-dashed hover:border-solid transition-all duration-300 cursor-pointer border-[#8D99B6] mt-[52px] lg:min-w-[600px] bg-[#EFF3FC] rounded-2xl px-4 py-9 flex flex-col gap-6 items-center"
          >
            <input {...getInputProps()} />
            <CloudUpload className="size-20 text-[#50586C]" />
            <p className="text-[#555E71] text-base/7 font-normal text-center mt-2">
              {isDragActive
                ? "Drop your file here"
                : "Drag and drop or browse to choose file"}
            </p>
          </div>
        ) : (
          <div className="flex w-full flex-col lg:flex-row lg:min-w-[600px] gap-4">
            <div className="flex flex-col basis-1/2">
              <h2 className="text-lg font-semibold mb-3 text-[#50586C]">Original</h2>
              <ImagePreview dataUrl={fileInfo.imageUrl} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="size-5 text-[#555E71]" />
                  <p className="text-[#555E71] text-base/7 font-normal text-center mt-2">
                    {fileInfo?.fileName}
                  </p>
                </div>
                <span className="text-[#555E71] text-base/7 font-normal text-center mt-2">
                  {fileInfo?.fileSize}
                </span>
              </div>
            </div>
            {compressedFileInfo && <div className="flex flex-col basis-1/2">
              <h2 className="text-lg font-semibold mb-3 text-[#50586C]">Compressed</h2>
              <ImagePreview dataUrl={compressedFileInfo.imageUrl} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="size-5 text-[#555E71]" />
                  <p className="text-[#555E71] text-base/7 font-normal text-center mt-2">
                    {compressedFileInfo?.fileName}
                  </p>
                </div>
                <span className="text-[#555E71] text-base/7 font-normal text-center mt-2">
                  {compressedFileInfo?.fileSize}
                </span>
              </div>
            </div>}

          </div>
        )}
        {isCompressing && <Progress progress={count} />}
        <div className="flex flex-col mt-6">
          {fileInfo && (
            <div className="flex items-center gap-2 justify-between mt-4">
              <Button disabled={isCompressing} onClick={handleCompressFile} className="hover:rounded-3xl transition-all duration-300 ">Compress Image { isCompressing && <Loader2 className="size-4 animate-spin" />}</Button>
              <Button
                variant={"outline"}
                className="border bg-transparent border-black/15"
                onClick={handleCancelFile}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ImagePreview = ({ dataUrl }: { dataUrl: string }) => {
  return (
    <div className="border-2 border-[#8D99B6] aspect-video lg:aspect-square relative overflow-hidden bg-[#EFF3FC] max-w-[642px] rounded-2xl px-4 py-9 flex flex-col gap-6 items-center">
      <Image fill className="object-cover" alt="uploaded image" src={dataUrl} />
    </div>
  );
};

const Progress = ({progress}: {progress: number}) => {
  return <div className="h-2 w-full transition-all">
    <div style={{width: `${progress}%`}} className={cn("h-full max-w-full", `bg-black`)}></div>
  </div>
}
