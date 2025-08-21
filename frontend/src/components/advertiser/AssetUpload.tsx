import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  Code,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  assetId?: string;
}

interface AssetUploadProps {
  onUploadComplete?: (assetId: string) => void;
  onClose?: () => void;
}

export const AssetUpload: React.FC<AssetUploadProps> = ({ 
  onUploadComplete, 
  onClose 
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [assetNames, setAssetNames] = useState<Record<string, string>>({});

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
    
    // Set default asset names
    const newNames: Record<string, string> = {};
    newFiles.forEach(uploadFile => {
      newNames[uploadFile.id] = uploadFile.file.name.replace(/\.[^/.]+$/, '');
    });
    setAssetNames(prev => ({ ...prev, ...newNames }));
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
    setAssetNames(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateAssetName = (id: string, name: string) => {
    setAssetNames(prev => ({ ...prev, [id]: name }));
  };

  const startUpload = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    for (const uploadFile of pendingFiles) {
      await uploadSingleFile(uploadFile);
    }
  };

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    // Update status to uploading
    setUploadFiles(prev => 
      prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' } : f)
    );

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadFiles(prev => 
          prev.map(f => f.id === uploadFile.id ? { ...f, progress } : f)
        );
      }

      // Simulate successful upload
      const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setUploadFiles(prev => 
        prev.map(f => f.id === uploadFile.id 
          ? { ...f, status: 'completed', assetId, progress: 100 } 
          : f
        )
      );

      onUploadComplete?.(assetId);
    } catch (error) {
      setUploadFiles(prev => 
        prev.map(f => f.id === uploadFile.id 
          ? { ...f, status: 'error', error: 'Upload failed' } 
          : f
        )
      );
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (mimeType === 'text/html') return <Code className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'uploading': return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasPendingFiles = uploadFiles.some(f => f.status === 'pending');
  const hasUploadingFiles = uploadFiles.some(f => f.status === 'uploading');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upload Creative Assets</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drag & Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag and drop files here
          </p>
          <p className="text-gray-500 mb-4">
            or click to browse files
          </p>
          <input
            type="file"
            multiple
            accept="image/*,video/*,text/html"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button>
              Choose Files
            </Button>
          </label>
          <p className="text-sm text-gray-400 mt-2">
            Supports: JPG, PNG, GIF, WebP, MP4, WebM, HTML (Max: 100MB per file)
          </p>
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Files to Upload ({uploadFiles.length})</h3>
              {hasPendingFiles && (
                <Button onClick={startUpload} disabled={hasUploadingFiles}>
                  Start Upload
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(uploadFile.file.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={assetNames[uploadFile.id] || ''}
                          onChange={(e) => updateAssetName(uploadFile.id, e.target.value)}
                          placeholder="Asset name"
                          className="max-w-xs"
                        />
                        <span className="text-sm text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </span>
                        {getStatusIcon(uploadFile.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {uploadFile.file.name}
                      </p>
                      
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={uploadFile.progress} className="w-full" />
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadFile.progress}% complete
                          </p>
                        </div>
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <p className="text-sm text-red-600 mt-1">
                          {uploadFile.error}
                        </p>
                      )}
                      
                      {uploadFile.status === 'completed' && (
                        <p className="text-sm text-green-600 mt-1">
                          Upload completed! Asset ID: {uploadFile.assetId}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={uploadFile.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Summary */}
        {uploadFiles.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Upload Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Files:</span>
                <span className="ml-2 font-medium">{uploadFiles.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Pending:</span>
                <span className="ml-2 font-medium">
                  {uploadFiles.filter(f => f.status === 'pending').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Uploading:</span>
                <span className="ml-2 font-medium">
                  {uploadFiles.filter(f => f.status === 'uploading').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>
                <span className="ml-2 font-medium">
                  {uploadFiles.filter(f => f.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 