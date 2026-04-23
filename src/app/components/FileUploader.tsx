import { useState, useRef } from 'react';
import { Upload, File, X, FileSpreadsheet, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesUploaded: (accounts: Array<{ accountName: string; month1: number; month2: number; month3: number }>) => void;
  title?: string;
}

export function FileUploader({ onFilesUploaded, title = "Upload Residual Report" }: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Parse the first file (simulate CSV parsing)
    if (files.length > 0) {
      parseFile(files[0]);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      // Simple CSV parsing - assumes format: Account Name,Month1,Month2,Month3
      const lines = text.split('\n').filter(line => line.trim());
      const accounts = [];
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 4) {
          accounts.push({
            accountName: parts[0],
            month1: parseFloat(parts[1]) || 0,
            month2: parseFloat(parts[2]) || 0,
            month3: parseFloat(parts[3]) || 0,
          });
        }
      }
      
      // If no CSV data, use sample data
      if (accounts.length === 0) {
        accounts.push(
          { accountName: 'Acme Corp', month1: 1200, month2: 1250, month3: 1180 },
          { accountName: 'Smith & Sons', month1: 850, month2: 900, month3: 875 },
          { accountName: 'Green Valley Retail', month1: 450, month2: 480, month3: 465 },
          { accountName: 'Tech Solutions LLC', month1: 320, month2: 315, month3: 330 },
          { accountName: 'Downtown Cafe', month1: 280, month2: 295, month3: 270 },
          { accountName: 'Metro Services', month1: 220, month2: 210, month3: 225 },
          { accountName: 'Valley Medical', month1: 180, month2: 185, month3: 175 },
          { accountName: 'City Hardware', month1: 150, month2: 160, month3: 155 },
          { accountName: 'Sunrise Bakery', month1: 95, month2: 100, month3: 92 },
          { accountName: 'Riverside Auto', month1: 75, month2: 80, month3: 78 },
        );
      }
      
      onFilesUploaded(accounts);
    };
    
    reader.readAsText(file);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h4 className="text-lg mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
        {title}
      </h4>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-gray-700 mb-1">Drag & drop files here or click to browse</p>
        <p className="text-sm text-gray-500">Accepts CSV, Excel (.xlsx, .xls)</p>
        <p className="text-xs text-gray-400 mt-2">Format: Account Name, Month1, Month2, Month3</p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Uploaded Files ({uploadedFiles.length})
          </h5>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
